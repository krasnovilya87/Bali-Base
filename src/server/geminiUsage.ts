import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './firebaseAdmin';

// Our own count of Gemini API requests per day. The Gemini key lives in a different Google project,
// so Cloud Monitoring of this project cannot see its usage. Gemini daily quotas reset at midnight
// Pacific time, so the day key uses that time zone.
const COLLECTION = 'admin_stats';

// Free tier daily request limits are per model; Flash and Flash-Lite differ a lot.
// They change over time: check Google AI Studio and override with the env variables.
const MODEL_FAMILIES = [
  { id: 'flash_lite', label: 'Gemini Flash-Lite', limitEnv: 'GEMINI_DAILY_LIMIT_FLASH_LITE', defaultLimit: 1000 },
  { id: 'flash', label: 'Gemini Flash', limitEnv: 'GEMINI_DAILY_LIMIT_FLASH', defaultLimit: 250 }
] as const;
type ModelFamily = typeof MODEL_FAMILIES[number]['id'];

export type GeminiCallStats = { requests: number; errors?: number; rateLimited?: number };

const pacificDay = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(date);

const familyOf = (model: string): ModelFamily => (/lite/i.test(model) ? 'flash_lite' : 'flash');

export const recordGeminiCalls = async (model: string, { requests, errors = 0, rateLimited = 0 }: GeminiCallStats) => {
  if (!requests) return;
  const day = pacificDay();
  await adminDb.collection(COLLECTION).doc(`gemini-${day}`).set({
    day,
    models: {
      [familyOf(model)]: {
        requests: FieldValue.increment(requests),
        errors: FieldValue.increment(errors),
        rateLimited: FieldValue.increment(rateLimited)
      }
    },
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

const recordQuietly = (model: string, stats: GeminiCallStats) => {
  recordGeminiCalls(model, stats).catch(error => console.error('[Gemini usage] Could not record a call:', error));
};

// Wraps one Gemini request and counts it (and a 429 "quota exceeded" answer separately).
export const trackGeminiCall = async <T>(model: string, call: () => Promise<T>): Promise<T> => {
  try {
    const result = await call();
    recordQuietly(model, { requests: 1 });
    return result;
  } catch (error: any) {
    const status = Number(error?.status ?? error?.code);
    recordQuietly(model, { requests: 1, errors: 1, rateLimited: status === 429 ? 1 : 0 });
    throw error;
  }
};

export const loadGeminiUsageRows = async () => {
  const snapshot = await adminDb.collection(COLLECTION).doc(`gemini-${pacificDay()}`).get();
  return MODEL_FAMILIES.map(family => {
    const stats = snapshot.get(`models.${family.id}`) || {};
    const rateLimited = Number(stats.rateLimited || 0);
    return {
      label: `${family.label}: requests today${rateLimited ? ` (limit hit ${rateLimited}×)` : ''}`,
      count: Number(stats.requests || 0),
      freeCap: Number(process.env[family.limitEnv]) || family.defaultLimit
    };
  });
};
