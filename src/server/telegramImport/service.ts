import { firebaseAdminApp } from '../firebaseAdmin';
import firebaseConfig from '../../config/firebaseConfig';
import { DEFAULT_FIRST_DAYS, isTelegramConfigured } from './collector';
import { runImport } from './pipeline';
import { claimRun, getChannelEntries, getChannelStates, getRun, saveChannelEntries, saveRun } from './store';

// The import runs on Cloud Run as a separate job (it takes minutes) when TELEGRAM_IMPORT_JOB is set;
// otherwise (local development) it runs in this API process.
const JOB_NAME = process.env.TELEGRAM_IMPORT_JOB || '';
const JOB_REGION = process.env.TELEGRAM_IMPORT_REGION || 'asia-southeast1';
const CHANNEL_RE = /^[A-Za-z][A-Za-z0-9_]{3,31}$/;
const MIN_SCAN_DAYS = 1;
const MAX_SCAN_DAYS = 365;

export const normalizeChannel = (value: string) => value.trim()
  .replace(/^https?:\/\//, '')
  .replace(/^t\.me\//, '')
  .replace(/^@/, '')
  .split(/[/?#]/)[0];

export const getAvailability = () => (isTelegramConfigured()
  ? { available: true }
  : { available: false, reason: 'TELEGRAM_SESSION, TELEGRAM_API_ID and TELEGRAM_API_HASH are not set on the server.' });

export const addChannel = async (raw: string, rawDays: unknown) => {
  const channel = normalizeChannel(raw);
  if (!CHANNEL_RE.test(channel)) throw new Error('Enter a channel username or a t.me link.');
  const days = Math.round(Number(rawDays));
  if (!Number.isFinite(days) || days < MIN_SCAN_DAYS || days > MAX_SCAN_DAYS) {
    throw new Error(`The scan period must be from ${MIN_SCAN_DAYS} to ${MAX_SCAN_DAYS} days.`);
  }
  const entries = await getChannelEntries();
  if (!entries.some(item => item.name.toLowerCase() === channel.toLowerCase())) {
    entries.push({ name: channel, days });
    await saveChannelEntries(entries);
  }
  return entries.map(entry => entry.name);
};

export const removeChannel = async (raw: string) => {
  const channel = normalizeChannel(raw).toLowerCase();
  const entries = (await getChannelEntries()).filter(item => item.name.toLowerCase() !== channel);
  await saveChannelEntries(entries);
  return entries.map(entry => entry.name);
};

export const getStatus = async () => {
  const [entries, states, run] = await Promise.all([getChannelEntries(), getChannelStates(), getRun()]);
  return {
    ...getAvailability(),
    channels: entries.map(({ name, days }) => ({
      name,
      firstScanDays: days || DEFAULT_FIRST_DAYS,
      lastMessageId: states[name]?.lastId || 0,
      posts: states[name]?.posts || 0
    })),
    running: Boolean(run?.running),
    step: run?.step || '',
    log: run?.log || [],
    lastRun: run ? { startedAt: run.startedAt, finishedAt: run.finishedAt, ok: run.ok, error: run.error, summary: run.summary } : null
  };
};

const startCloudRunJob = async () => {
  const { access_token: accessToken } = await firebaseAdminApp.options.credential!.getAccessToken();
  const url = `https://run.googleapis.com/v2/projects/${firebaseConfig.projectId}/locations/${JOB_REGION}/jobs/${JOB_NAME}:run`;
  const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    const payload: any = await response.json().catch(() => null);
    throw new Error(payload?.error?.message || `Cloud Run job start failed (${response.status}).`);
  }
};

export const startImport = async () => {
  const availability = getAvailability();
  if (!JOB_NAME && !availability.available) throw new Error(availability.reason);
  if (!(await getChannelEntries()).length) throw new Error('Add at least one channel first.');
  if (!(await claimRun())) return false;
  if (JOB_NAME) {
    try {
      await startCloudRunJob();
    } catch (error: any) {
      await saveRun({ running: false, step: '', ok: false, error: error.message, finishedAt: new Date().toISOString() });
      throw error;
    }
  } else {
    void runImport().catch(error => console.error('[Telegram import] run failed:', error));
  }
  return true;
};
