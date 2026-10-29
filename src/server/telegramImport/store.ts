// Firestore storage of the Telegram import, so it runs the same on the owner's computer and on Cloud Run:
//   telegram_import/config  { channels: [{ name, days }] }        days = period of the first scan
//   telegram_import/state   { channels: { name: { lastId, posts } } }
//   telegram_import/run     current or last run: { running, step, startedAt, finishedAt, ok, error, summary, log }
//   telegram_posts/{channel}-{messageId}  { post, pass1, pass2, uploaded }
import { adminDb } from '../firebaseAdmin';
import type { Pass1, Pass2, TelegramPost } from './extract';

const IMPORT = adminDb.collection('telegram_import');
const POSTS = adminDb.collection('telegram_posts');
const BATCH_LIMIT = 400;

export type ChannelEntry = { name: string; days?: number };
export type ChannelState = { lastId: number; posts: number };
export type UploadedEntry = { collection: string; docId: string; uploadedAt: string };
export type StoredPost = { post: TelegramPost; pass1?: Pass1; pass2?: Pass2; uploaded?: UploadedEntry };
export type ImportSummary = {
  created: Record<'ads' | 'services' | 'afisha' | 'life', number>;
  reposts: number;
  removed: number;
  skipped: number;
  photoErrors: number;
  failed: number;
};
export type ImportRun = {
  running: boolean;
  step: string;
  startedAt: string;
  finishedAt?: string;
  ok?: boolean;
  error?: string;
  summary?: ImportSummary;
  log: string[];
};

// Firestore rejects undefined values; Gemini answers and Telegram data may contain them.
const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const writeInBatches = async (entries: Array<[FirebaseFirestore.DocumentReference, Record<string, unknown>]>) => {
  for (let start = 0; start < entries.length; start += BATCH_LIMIT) {
    const batch = adminDb.batch();
    entries.slice(start, start + BATCH_LIMIT).forEach(([reference, data]) => batch.set(reference, clean(data), { merge: true }));
    await batch.commit();
  }
};

export const getChannelEntries = async (): Promise<ChannelEntry[]> =>
  ((await IMPORT.doc('config').get()).get('channels') || []) as ChannelEntry[];

export const saveChannelEntries = (channels: ChannelEntry[]) => IMPORT.doc('config').set(clean({ channels }), { merge: true });

export const getChannelStates = async (): Promise<Record<string, ChannelState>> =>
  ((await IMPORT.doc('state').get()).get('channels') || {}) as Record<string, ChannelState>;

export const saveChannelState = (channel: string, state: ChannelState) =>
  IMPORT.doc('state').set({ channels: { [channel]: state } }, { merge: true });

export const savePosts = (posts: TelegramPost[]) =>
  writeInBatches(posts.map(post => [POSTS.doc(post.key), { post }]));

export const loadPosts = async (): Promise<StoredPost[]> =>
  (await POSTS.get()).docs.map(doc => doc.data() as StoredPost).filter(item => item.post?.key);

export const savePass = (field: 'pass1' | 'pass2', values: Record<string, Pass1 | Pass2>) =>
  writeInBatches(Object.entries(values).map(([key, value]) => [POSTS.doc(key), { [field]: value }]));

export const clearPass = (keys: string[]) =>
  writeInBatches(keys.map(key => [POSTS.doc(key), { pass1: null, pass2: null }]));

export const saveUploaded = (entries: Record<string, UploadedEntry>) =>
  writeInBatches(Object.entries(entries).map(([key, uploaded]) => [POSTS.doc(key), { uploaded }]));

export const getRun = async (): Promise<ImportRun | null> => ((await IMPORT.doc('run').get()).data() as ImportRun) || null;

export const saveRun = (run: Partial<ImportRun>) => IMPORT.doc('run').set(clean(run), { merge: true });

// A run that started long ago and never finished (crashed job) no longer blocks a new one.
const STALE_RUN_MS = 3 * 60 * 60 * 1000;

export const claimRun = async (): Promise<boolean> => adminDb.runTransaction(async transaction => {
  const reference = IMPORT.doc('run');
  const current = (await transaction.get(reference)).data() as ImportRun | undefined;
  if (current?.running && Date.now() - Date.parse(current.startedAt) < STALE_RUN_MS) return false;
  transaction.set(reference, { running: true, step: 'queued', startedAt: new Date().toISOString(), log: [] });
  return true;
});
