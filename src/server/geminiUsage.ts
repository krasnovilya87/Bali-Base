import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './firebaseAdmin';

// Our own count of Gemini API requests per day. The Gemini key lives in a different Google project,
// so Cloud Monitoring of this project cannot see its usage. Gemini daily quotas reset at midnight
// Pacific time, so the day key uses that time zone.
const COLLECTION = 'admin_stats';
// Requests per day per model on the key's tier (free tier Flash is about 250); set GEMINI_DAILY_LIMIT for the real value.
const DEFAULT_DAILY_LIMIT = 250;

export type GeminiCallStats = { requests: number; errors?: number; rateLimited?: number };

const pacificDay = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(date);

export const recordGeminiCalls = async ({ requests, errors = 0, rateLimited = 0 }: GeminiCallStats) => {
  if (!requests) return;
  const day = pacificDay();
  await adminDb.collection(COLLECTION).doc(`gemini-${day}`).set({
    day,
    requests: FieldValue.increment(requests),
    errors: FieldValue.increment(errors),
    rateLimited: FieldValue.increment(rateLimited),
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

const recordQuietly = (stats: GeminiCallStats) => {
  recordGeminiCalls(stats).catch(error => console.error('[Gemini usage] Could not record a call:', error));
};

// Wraps one Gemini request and counts it (and a 429 "quota exceeded" answer separately).
export const trackGeminiCall = async <T>(call: () => Promise<T>): Promise<T> => {
  try {
    const result = await call();
    recordQuietly({ requests: 1 });
    return result;
  } catch (error: any) {
    const status = Number(error?.status ?? error?.code);
    recordQuietly({ requests: 1, errors: 1, rateLimited: status === 429 ? 1 : 0 });
    throw error;
  }
};

export const loadGeminiUsageRows = async () => {
  const day = pacificDay();
  const snapshot = await adminDb.collection(COLLECTION).doc(`gemini-${day}`).get();
  const requests = Number(snapshot.get('requests') || 0);
  const rateLimited = Number(snapshot.get('rateLimited') || 0);
  const limit = Number(process.env.GEMINI_DAILY_LIMIT) || DEFAULT_DAILY_LIMIT;
  return [{
    label: rateLimited ? `Gemini: requests today (limit hit ${rateLimited}×)` : 'Gemini: requests today',
    count: requests,
    freeCap: limit
  }];
};
