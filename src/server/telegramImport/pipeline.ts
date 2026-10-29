// One Telegram import run: collect new posts -> Gemini (only posts not processed yet) -> build listings ->
// upload photos (ImageKit) and listings (Firestore, status "moderation"). Progress goes to telegram_import/run,
// so the admin tab shows it whether the run happens in the API process or in a Cloud Run job.
import type { TelegramClient } from 'telegram';
import { adminDb } from '../firebaseAdmin';
import { uploadImageBufferToImageKit } from '../imageUpload/routes';
import { getSiteSchema } from './schema';
import { DEFAULT_FIRST_DAYS, collectChannel, connectTelegram, downloadPhotos } from './collector';
import {
  SECTIONS,
  buildListing,
  extractContacts,
  GeminiQuotaExhausted,
  ImportStopped,
  hasContact,
  mergeReposts,
  runPass1,
  runPass2,
  type Listing,
  type Pass1,
  type Pass2,
  type StopCheck,
  type TelegramPost
} from './extract';
import {
  STOPPED_BY_ADMIN,
  getChannelEntries,
  getChannelStates,
  isStopRequested,
  loadPosts,
  savePass,
  savePosts,
  saveChannelState,
  saveRun,
  saveUploaded,
  type ImportSummary,
  type UploadedEntry
} from './store';

const IMAGE_FOLDER = '/bali-base/telegram';
// Dry run: collect and Gemini work as usual, but nothing is created or deleted on the site.
const DRY_RUN = process.env.TELEGRAM_IMPORT_DRY_RUN === 'true';
const LOG_LIMIT = 300;
const LOG_FLUSH_MS = 2000;
const HEARTBEAT_MS = 60_000;
export const GEMINI_LIMIT_NOTE = 'Gemini daily limit reached: the rest will be processed by the next run.';

const createLogger = () => {
  const lines: string[] = [];
  let timer: NodeJS.Timeout | null = null;
  const flush = async () => {
    timer = null;
    await saveRun({ log: lines.slice(-LOG_LIMIT), heartbeatAt: new Date().toISOString() })
      .catch(error => console.error('[Telegram import] log write failed:', error));
  };
  const log = (line: string) => {
    const clean = line.replace(/\r/g, '').trimEnd();
    if (!clean) return;
    console.log(`[Telegram import] ${clean}`);
    lines.push(`${new Date().toISOString().slice(11, 19)} ${clean}`);
    if (!timer) timer = setTimeout(() => void flush(), LOG_FLUSH_MS);
  };
  return {
    log,
    flush: async () => {
      if (timer) clearTimeout(timer);
      await flush();
    }
  };
};

const setStep = (step: string) => saveRun({ step });

const listingKey = (listingId: string) => listingId.replace(/^tg-/, '');
const listingIdFromUrl = (url: string) => {
  const match = url.match(/t\.me\/([^/]+)\/(\d+)/);
  return match ? `tg-${match[1]}-${match[2]}` : '';
};

/**
 * Several site listings that turned out to be one post (a repost, the same event posted by different people):
 * keep one and delete the other imported copies. An already approved (active) copy is the one that stays.
 */
const removeDuplicates = async (entries: UploadedEntry[], summary: ImportSummary, log: (line: string) => void) => {
  if (entries.length === 1) return entries[0];
  const snapshots = await Promise.all(entries.map(entry => adminDb.collection(entry.collection).doc(entry.docId).get()));
  const existing = entries.map((entry, index) => ({ entry, snapshot: snapshots[index] })).filter(item => item.snapshot.exists);
  if (!existing.length) return null;
  const keeper = existing.find(item => item.snapshot.get('status') === 'active') || existing[0];
  for (const item of existing) {
    if (item === keeper || item.snapshot.get('importSource') !== 'telegram') continue;
    if (DRY_RUN) {
      log(`[dry run] would remove duplicate ${item.entry.docId} (keep ${keeper.entry.docId})`);
      summary.removed += 1;
      continue;
    }
    try {
      await item.snapshot.ref.delete();
      summary.removed += 1;
      log(`- duplicate removed: ${item.entry.docId} (kept ${keeper.entry.docId})`);
    } catch (error: any) {
      log(`duplicate delete failed for ${item.entry.docId}: ${error.message}`);
    }
  }
  return keeper.entry;
};

const uploadListings = async (
  client: TelegramClient,
  listings: Listing[],
  uploaded: Record<string, UploadedEntry>,
  log: (line: string) => void,
  checkStop: StopCheck
): Promise<ImportSummary> => {
  const summary: ImportSummary = {
    created: { ads: 0, services: 0, afisha: 0, life: 0 },
    reposts: 0,
    removed: 0,
    skipped: 0,
    photoErrors: 0,
    failed: 0
  };
  const remember = async (ids: string[], entry: UploadedEntry) => {
    ids.forEach(id => { uploaded[id] = entry; });
    if (!DRY_RUN) await saveUploaded(Object.fromEntries(ids.map(id => [listingKey(id), entry])));
  };

  for (const listing of listings) {
    await checkStop();
    const section = listing.category as keyof ImportSummary['created'];
    const relatedIds: string[] = [listing.id, ...(listing.repostUrls || []).map(listingIdFromUrl)].filter(Boolean);
    const knownEntries = [...new Map(relatedIds.map(id => uploaded[id]).filter(Boolean)
      .map(entry => [`${entry.collection}/${entry.docId}`, entry])).values()];
    if (knownEntries.length) {
      const keeper = await removeDuplicates(knownEntries, summary, log);
      if (!keeper) continue;
      if (!uploaded[listing.id]) {
        // The same post was published again: keep one listing and lift it as fresh.
        if (!DRY_RUN) {
          await adminDb.collection(keeper.collection).doc(keeper.docId)
            .set({ pushedAt: listing.createdAt }, { merge: true })
            .catch(error => log(`repost update failed for ${keeper.docId}: ${error.message}`));
        }
        summary.reposts += 1;
      } else if (knownEntries.length === 1) {
        summary.skipped += 1;
      }
      await remember(relatedIds, keeper);
      continue;
    }

    const collection = section === 'services' ? 'services' : 'market';
    const reference = adminDb.collection(collection).doc(listing.id);
    const entry: UploadedEntry = { collection, docId: listing.id, uploadedAt: new Date().toISOString() };
    try {
      if ((await reference.get()).exists) {
        summary.skipped += 1;
        await remember(relatedIds, entry);
        continue;
      }
      if (DRY_RUN) {
        const photos = await downloadPhotos(client, listing.photoChannel, listing.photoIds).catch(() => []);
        log(`[dry run] would create ${section}: ${listing.title} (${photos.length}/${listing.photoIds.length} photos downloaded)`);
        summary.created[section] += 1;
        continue;
      }
      const images: string[] = [];
      try {
        for (const photo of await downloadPhotos(client, listing.photoChannel, listing.photoIds)) {
          try {
            images.push(await uploadImageBufferToImageKit(photo.buffer, `${listing.photoChannel}_${photo.id}.jpg`, IMAGE_FOLDER));
          } catch (error: any) {
            summary.photoErrors += 1;
            log(`photo ${listing.photoChannel}/${photo.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        summary.photoErrors += listing.photoIds.length;
        log(`photos of ${listing.id}: ${error.message}`);
      }
      if (section === 'ads' && !images.length) {
        log(`skip ${listing.id}: no photo could be downloaded`);
        summary.failed += 1;
        continue;
      }
      const { photoIds: _photoIds, photoChannel: _photoChannel, ...doc } = listing;
      await reference.create(JSON.parse(JSON.stringify({
        ...doc,
        images,
        pushedAt: listing.createdAt,
        importedAt: new Date().toISOString()
      })));
      await remember(relatedIds, entry);
      summary.created[section] += 1;
      log(`+ ${section}: ${listing.title} (${images.length} photos)`);
    } catch (error: any) {
      summary.failed += 1;
      log(`upload failed for ${listing.id}: ${error.message}`);
    }
  }
  return summary;
};

const checkStop: StopCheck = async () => {
  if (await isStopRequested()) throw new ImportStopped(STOPPED_BY_ADMIN);
};

export const runImport = async () => {
  const { log, flush } = createLogger();
  let client: TelegramClient | null = null;
  // The run is alive while it writes heartbeatAt; the admin tab and the lock rely on it.
  const heartbeat = setInterval(() => void saveRun({ heartbeatAt: new Date().toISOString() }).catch(() => undefined), HEARTBEAT_MS);
  try {
    // Only channels checked in the admin tab are updated; the others and their posts are left untouched.
    const channels = (await getChannelEntries()).filter(entry => entry.enabled !== false);
    if (!channels.length) throw new Error('Check at least one channel to update.');
    const enabledNames = new Set(channels.map(entry => entry.name));

    await setStep('collect');
    client = await connectTelegram();
    const states = await getChannelStates();
    for (const { name, days } of channels) {
      await checkStop();
      const previous = states[name] || { lastId: 0, posts: 0 };
      const { posts, lastId } = await collectChannel(client, name, previous.lastId, days || DEFAULT_FIRST_DAYS, log);
      if (posts.length) await savePosts(posts);
      await saveChannelState(name, { lastId, posts: previous.posts + posts.length, scannedAt: new Date().toISOString() });
    }

    await setStep('extract');
    const stored = (await loadPosts()).filter(item => enabledNames.has(item.post.channel));
    const contactsByKey = new Map(stored.map(item => [item.post.key, extractContacts(item.post)]));
    const pass1: Record<string, Pass1> = {};
    const pass2: Record<string, Pass2> = {};
    stored.forEach(item => {
      if (item.pass1) pass1[item.post.key] = item.pass1;
      if (item.pass2) pass2[item.post.key] = item.pass2;
    });

    // Answers that used a market group name instead of a subcategory id are asked again.
    const schema = getSiteSchema();
    const adsIds = new Set(schema.ads.subcategories.map(item => item.id));
    const groupIds = new Set(schema.ads.subcategories.map(item => item.group).filter(id => !adsIds.has(id)));
    for (const [key, value] of Object.entries(pass1)) {
      if (value.section === 'ads' && groupIds.has(value.subCategory)) {
        delete pass1[key];
        delete pass2[key];
      }
    }

    // Posts without text or without any contact are decided without the model.
    const quick: Record<string, Pass1> = {};
    for (const { post } of stored) {
      if (pass1[post.key]) continue;
      if (post.text.trim().length < 15) quick[post.key] = { section: 'reject', reject_reason: 'no_text' };
      else if (!hasContact(contactsByKey.get(post.key)!)) quick[post.key] = { section: 'reject', reject_reason: 'no_contact' };
    }
    if (Object.keys(quick).length) {
      await savePass('pass1', quick);
      Object.assign(pass1, quick);
    }

    // Only posts of current channels within each channel's period go to Gemini.
    const periodStart = new Map(channels.map(({ name, days }) => [name, Date.now() - (days || DEFAULT_FIRST_DAYS) * 86_400_000]));
    const inPeriod = (post: TelegramPost) => Date.parse(post.date) >= (periodStart.get(post.channel) ?? Infinity);

    let quotaHit = false;
    try {
      const todo1 = stored.map(item => item.post).filter(post => !pass1[post.key] && inPeriod(post));
      log(`posts: ${stored.length}, pass 1 to do: ${todo1.length}`);
      if (todo1.length) {
        await runPass1(todo1, async batch => {
          await savePass('pass1', batch);
          Object.assign(pass1, batch);
        }, log, checkStop);
      }
      const todo2 = stored.map(item => item.post)
        .filter(post => inPeriod(post) && pass1[post.key] && !pass2[post.key]
          && (SECTIONS as readonly string[]).includes(pass1[post.key].section))
        .map(post => ({ ...post, section: pass1[post.key].section, subCategory: pass1[post.key].subCategory || '' }));
      log(`pass 2 to do: ${todo2.length}`);
      if (todo2.length) {
        await runPass2(todo2, async batch => {
          await savePass('pass2', batch);
          Object.assign(pass2, batch);
        }, log, checkStop);
      }
    } catch (error) {
      if (!(error instanceof GeminiQuotaExhausted)) throw error;
      // Answers so far are saved; the rest is processed by the next run (the quota resets daily).
      quotaHit = true;
      log('Gemini daily limit reached: uploading what is ready, the rest continues on the next run.');
    }

    const bySection: Record<string, Listing[]> = { ads: [], services: [], afisha: [], life: [] };
    const reasons: Record<string, number> = {};
    for (const { post } of stored) {
      // A post sorted into a section but still without its fields waits for the next run.
      if (!pass1[post.key] || !periodStart.has(post.channel)) continue;
      if ((SECTIONS as readonly string[]).includes(pass1[post.key].section) && !pass2[post.key]) continue;
      const { listing, reason } = buildListing(post, contactsByKey.get(post.key)!, pass1[post.key], pass2[post.key] || {});
      if (listing) bySection[listing.category].push(listing);
      else if (reason) reasons[reason] = (reasons[reason] || 0) + 1;
    }
    const listings = SECTIONS.flatMap(section => mergeReposts(bySection[section]));
    log(`${SECTIONS.map(section => `${section}: ${listings.filter(item => item.category === section).length}`).join(', ')}; rejected ${JSON.stringify(reasons)}`);

    await setStep('upload');
    const uploaded: Record<string, UploadedEntry> = {};
    stored.forEach(item => {
      if (item.uploaded) uploaded[`tg-${item.post.key}`] = item.uploaded;
    });
    const summary = await uploadListings(client, listings, uploaded, log, checkStop);
    log(`done: ${JSON.stringify(summary)}`);
    await flush();
    await saveRun({
      running: false,
      step: '',
      ok: true,
      error: quotaHit ? GEMINI_LIMIT_NOTE : '',
      summary,
      finishedAt: new Date().toISOString()
    });
    return summary;
  } catch (error: any) {
    const stopped = error instanceof ImportStopped;
    log(stopped ? 'stopped by admin' : `error: ${error.message}`);
    await flush();
    await saveRun({ running: false, step: '', ok: false, error: error.message, finishedAt: new Date().toISOString() });
    if (!stopped) throw error;
    return null;
  } finally {
    clearInterval(heartbeat);
    await client?.disconnect().catch(() => undefined);
  }
};
