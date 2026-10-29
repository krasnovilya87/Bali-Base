import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adminDb } from '../firebaseAdmin';
import { uploadImageBufferToImageKit } from '../imageUpload/routes';

// The Telegram parser (Python + Telethon session) lives in the project's Data folder, so the import
// only works where that folder exists: the API server running on the owner's computer.
const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const IMPORT_DIR = process.env.TELEGRAM_IMPORT_DIR
  || path.resolve(APP_ROOT, '../../../Data/маркет/telegramm');
const OUT_DIR = path.join(IMPORT_DIR, 'out');
const CHANNELS_FILE = path.join(IMPORT_DIR, 'channels.json');
const UPLOADED_FILE = path.join(OUT_DIR, 'uploaded.json');
const LAST_RUN_FILE = path.join(OUT_DIR, 'last_run.json');
const PYTHON = process.env.PYTHON || 'python';
const SECTIONS = ['ads', 'services', 'afisha', 'life'] as const;
const IMAGE_FOLDER = '/bali-base/telegram';
const LOG_LIMIT = 300;
const CHANNEL_RE = /^[A-Za-z][A-Za-z0-9_]{3,31}$/;

type Section = typeof SECTIONS[number];
type UploadedEntry = { collection: string; docId: string; uploadedAt: string };
export type ImportSummary = {
  created: Record<Section, number>;
  reposts: number;
  removed: number;
  skipped: number;
  photoErrors: number;
  failed: number;
};
export type ImportRun = { startedAt: string; finishedAt?: string; ok?: boolean; error?: string; summary?: ImportSummary };

const state: { running: boolean; step: string; log: string[]; current?: ImportRun } = { running: false, step: '', log: [] };

const addLog = (line: string) => {
  const clean = line.replace(/\r/g, '').trimEnd();
  if (!clean) return;
  state.log.push(`${new Date().toISOString().slice(11, 19)} ${clean}`);
  if (state.log.length > LOG_LIMIT) state.log.splice(0, state.log.length - LOG_LIMIT);
};

const readJson = async <T>(file: string, fallback: T): Promise<T> => {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
};

const writeJson = async (file: string, data: unknown) => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2), 'utf8');
};

export const normalizeChannel = (value: string) => value.trim()
  .replace(/^https?:\/\//, '')
  .replace(/^t\.me\//, '')
  .replace(/^@/, '')
  .split(/[/?#]/)[0];

export const getAvailability = () => existsSync(path.join(IMPORT_DIR, 'collect.py'))
  ? { available: true }
  : { available: false, reason: `Telegram parser folder not found: ${IMPORT_DIR}` };

export const getChannels = () => readJson<string[]>(CHANNELS_FILE, []);

export const addChannel = async (raw: string) => {
  const channel = normalizeChannel(raw);
  if (!CHANNEL_RE.test(channel)) throw new Error('Enter a channel username or a t.me link.');
  const channels = await getChannels();
  if (!channels.some(item => item.toLowerCase() === channel.toLowerCase())) {
    channels.push(channel);
    await writeJson(CHANNELS_FILE, channels);
  }
  return channels;
};

export const removeChannel = async (raw: string) => {
  const channel = normalizeChannel(raw).toLowerCase();
  const channels = (await getChannels()).filter(item => item.toLowerCase() !== channel);
  await writeJson(CHANNELS_FILE, channels);
  return channels;
};

export const getStatus = async () => {
  const channelState = await readJson<Record<string, { last_id: number; posts: number }>>(path.join(OUT_DIR, 'state.json'), {});
  return {
    ...getAvailability(),
    channels: (await getChannels()).map(name => ({
      name,
      lastMessageId: channelState[name]?.last_id || 0,
      posts: channelState[name]?.posts || 0
    })),
    running: state.running,
    step: state.step,
    log: state.log,
    lastRun: state.current || await readJson<ImportRun | null>(LAST_RUN_FILE, null)
  };
};

const runProcess = (command: string, args: string[], cwd: string) => new Promise<void>((resolve, reject) => {
  addLog(`$ ${command} ${args.join(' ')}`);
  const child = spawn(command, args, {
    cwd,
    shell: process.platform === 'win32',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' }
  });
  const onData = (chunk: Buffer) => chunk.toString('utf8').split('\n').forEach(addLog);
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  child.on('error', reject);
  child.on('close', code => (code === 0 ? resolve() : reject(new Error(`${path.basename(args[0] || command)} exited with code ${code}`))));
});

const quote = (value: string) => (process.platform === 'win32' ? `"${value}"` : value);

const messageIdFromUrl = (url: string) => {
  const match = url.match(/t\.me\/([^/]+)\/(\d+)/);
  return match ? `tg-${match[1]}-${match[2]}` : '';
};

/**
 * Several site listings that turned out to be one post (a repost, the same event posted by different people):
 * keep one and delete the other imported copies. An already approved (active) copy is the one that stays.
 */
const removeDuplicates = async (entries: UploadedEntry[], summary: ImportSummary): Promise<UploadedEntry | null> => {
  if (entries.length === 1) return entries[0];
  const snapshots = await Promise.all(entries.map(entry => adminDb.collection(entry.collection).doc(entry.docId).get()));
  const existing = entries.map((entry, index) => ({ entry, snapshot: snapshots[index] })).filter(item => item.snapshot.exists);
  if (!existing.length) return null;
  const keeper = existing.find(item => item.snapshot.get('status') === 'active') || existing[0];
  for (const item of existing) {
    if (item === keeper || item.snapshot.get('importSource') !== 'telegram') continue;
    try {
      await item.snapshot.ref.delete();
      summary.removed += 1;
      addLog(`- duplicate removed: ${item.entry.docId} (kept ${keeper.entry.docId})`);
    } catch (error: any) {
      addLog(`duplicate delete failed for ${item.entry.docId}: ${error.message}`);
    }
  }
  return keeper.entry;
};

export const uploadListings = async (): Promise<ImportSummary> => {
  const uploaded = await readJson<Record<string, UploadedEntry>>(UPLOADED_FILE, {});
  const summary: ImportSummary = {
    created: { ads: 0, services: 0, afisha: 0, life: 0 },
    reposts: 0,
    removed: 0,
    skipped: 0,
    photoErrors: 0,
    failed: 0
  };

  for (const section of SECTIONS) {
    const listings = await readJson<any[]>(path.join(OUT_DIR, 'listings', `${section}.json`), []);
    for (const listing of listings) {
      const relatedIds = [listing.id, ...(listing.repostUrls || []).map(messageIdFromUrl)].filter(Boolean);
      const knownEntries = [...new Map(relatedIds.map(id => uploaded[id]).filter(Boolean)
        .map(entry => [`${entry.collection}/${entry.docId}`, entry])).values()];
      if (knownEntries.length) {
        const keeper = await removeDuplicates(knownEntries, summary);
        if (!keeper) continue;
        // The same post was published again: keep one listing and lift it as fresh.
        const lifted = !uploaded[listing.id];
        if (lifted) {
          await adminDb.collection(keeper.collection).doc(keeper.docId)
            .set({ pushedAt: listing.createdAt }, { merge: true })
            .catch(error => addLog(`repost update failed for ${keeper.docId}: ${error.message}`));
          summary.reposts += 1;
        } else if (knownEntries.length === 1) {
          summary.skipped += 1;
        }
        relatedIds.forEach(id => { uploaded[id] = keeper; });
        await writeJson(UPLOADED_FILE, uploaded);
        continue;
      }

      const collection = section === 'services' ? 'services' : 'market';
      const reference = adminDb.collection(collection).doc(listing.id);
      try {
        if ((await reference.get()).exists) {
          relatedIds.forEach(id => { uploaded[id] = { collection, docId: listing.id, uploadedAt: new Date().toISOString() }; });
          summary.skipped += 1;
          continue;
        }
        const images: string[] = [];
        for (const photo of listing.photoFiles || []) {
          try {
            const buffer = await readFile(path.join(IMPORT_DIR, photo));
            images.push(await uploadImageBufferToImageKit(buffer, path.basename(photo), IMAGE_FOLDER));
          } catch (error: any) {
            summary.photoErrors += 1;
            addLog(`photo ${photo}: ${error.message}`);
          }
        }
        const { photoFiles: _photoFiles, ...doc } = listing;
        await reference.create({ ...doc, images, pushedAt: listing.createdAt, importedAt: new Date().toISOString() });
        const entry = { collection, docId: listing.id, uploadedAt: new Date().toISOString() };
        relatedIds.forEach(id => { uploaded[id] = entry; });
        summary.created[section] += 1;
        addLog(`+ ${section}: ${listing.title} (${images.length} photos)`);
      } catch (error: any) {
        summary.failed += 1;
        addLog(`upload failed for ${listing.id}: ${error.message}`);
      }
      await writeJson(UPLOADED_FILE, uploaded);
    }
  }
  await writeJson(UPLOADED_FILE, uploaded);
  return summary;
};

const runPipeline = async () => {
  const run: ImportRun = { startedAt: new Date().toISOString() };
  state.current = run;
  try {
    state.step = 'schema';
    await runProcess('npx', ['tsx', quote(path.join(IMPORT_DIR, 'export_schema.ts'))], APP_ROOT);
    state.step = 'collect';
    await runProcess(PYTHON, [quote(path.join(IMPORT_DIR, 'collect.py'))], IMPORT_DIR);
    state.step = 'extract';
    await runProcess(PYTHON, [quote(path.join(IMPORT_DIR, 'extract.py'))], IMPORT_DIR);
    state.step = 'upload';
    run.summary = await uploadListings();
    run.ok = true;
    addLog(`done: ${JSON.stringify(run.summary)}`);
  } catch (error: any) {
    run.ok = false;
    run.error = error.message;
    addLog(`error: ${error.message}`);
  } finally {
    run.finishedAt = new Date().toISOString();
    state.running = false;
    state.step = '';
    await writeJson(LAST_RUN_FILE, run).catch(() => undefined);
  }
};

export const startImport = async () => {
  const availability = getAvailability();
  if (!availability.available) throw new Error(availability.reason);
  if (state.running) return false;
  if (!(await getChannels()).length) throw new Error('Add at least one channel first.');
  state.running = true;
  state.log = [];
  void runPipeline();
  return true;
};
