import fs from 'node:fs';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../config/firebaseConfig';
import type { Listing } from '../../types';

const DEFAULT_EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';
const DEFAULT_GROQ_WHISPER_MODEL = 'whisper-large-v3-turbo';
const DEFAULT_TOP_K = 10;
const REQUEST_TIMEOUT_MS = 12000;
const AI_USAGE_COLLECTION = 'ai_search_usage';
const AI_USAGE_DOC_ID = 'summary';
const AI_REQUEST_LOG_COLLECTION = 'ai_search_request_log';
const USAGE_TRACKING_TIMEOUT_MS = 3000;
const AI_SEARCH_DEBUG = process.env.AI_SEARCH_DEBUG === 'true';

const traceAiSearch = (message: string, details?: Record<string, unknown>) => {
  if (!AI_SEARCH_DEBUG) return;
  if (details) {
    console.info(message, details);
  } else {
    console.info(message);
  }
};

type ServiceAccountConfig = {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
};

export type AiSearchUsageStats = {
  totalRequests: number;
  voiceRequests: number;
  textRequests: number;
  vectorSearchRequests: number;
  indexUpserts: number;
  indexDeletes: number;
  failedRequests: number;
  lastRequestAt: string | null;
};

export type VectorSearchMatch = {
  id: string;
  score: number;
};

const parseServiceAccountJson = (value: string): ServiceAccountConfig => {
  const parsed = JSON.parse(value) as Record<string, string>;
  return {
    projectId: parsed.project_id || parsed.projectId,
    clientEmail: parsed.client_email || parsed.clientEmail,
    privateKey: (parsed.private_key || parsed.privateKey || '').replace(/\\n/g, '\n')
  };
};

const readServiceAccount = (): ServiceAccountConfig | null => {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson?.trim()) return parseServiceAccountJson(rawJson);

  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (filePath?.trim()) return parseServiceAccountJson(fs.readFileSync(filePath, 'utf8'));

  return null;
};

const getAiSearchDb = () => {
  const appName = 'ai-search-admin';
  const existing = getApps().find(item => item.name === appName);
  const serviceAccount = readServiceAccount();
  const app = existing || initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket
  }, appName);

  return getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
};

const getCloudflareConfig = () => ({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID?.trim() || '',
  apiToken: process.env.CLOUDFLARE_API_TOKEN?.trim() || '',
  embeddingModel: (process.env.CLOUDFLARE_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL).replace(/^\/+/, ''),
  vectorizeIndex: process.env.CLOUDFLARE_VECTORIZE_INDEX?.trim() || ''
});

const getGroqConfig = () => ({
  apiKey: process.env.GROQ_API_KEY?.trim() || '',
  model: process.env.GROQ_WHISPER_MODEL?.trim() || DEFAULT_GROQ_WHISPER_MODEL
});

const withTimeout = async <T>(task: (signal: AbortSignal) => Promise<T>) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await task(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
};

const withPromiseTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const trackAiUsage = async (
  type: 'voice' | 'text' | 'vector' | 'index_upsert' | 'index_delete' | 'failure',
  details: Record<string, unknown> = {}
) => {
  traceAiSearch('[AI voice trace] usage tracking start', { type });
  try {
    const db = getAiSearchDb();
    const now = new Date().toISOString();
    const summaryRef = db.collection(AI_USAGE_COLLECTION).doc(AI_USAGE_DOC_ID);
    const logRef = db.collection(AI_REQUEST_LOG_COLLECTION).doc();
    const increments: Record<string, FieldValue | string> = {
      updatedAt: now
    };

    if (type === 'voice') {
      increments.totalRequests = FieldValue.increment(1);
      increments.voiceRequests = FieldValue.increment(1);
      increments.lastRequestAt = now;
    } else if (type === 'text') {
      increments.totalRequests = FieldValue.increment(1);
      increments.textRequests = FieldValue.increment(1);
      increments.lastRequestAt = now;
    } else if (type === 'vector') {
      increments.vectorSearchRequests = FieldValue.increment(1);
    } else if (type === 'index_upsert') {
      increments.indexUpserts = FieldValue.increment(1);
    } else if (type === 'index_delete') {
      increments.indexDeletes = FieldValue.increment(1);
    } else {
      increments.failedRequests = FieldValue.increment(1);
    }

    await withPromiseTimeout(db.runTransaction(async transaction => {
      transaction.set(summaryRef, {
        totalRequests: 0,
        voiceRequests: 0,
        textRequests: 0,
        vectorSearchRequests: 0,
        indexUpserts: 0,
        indexDeletes: 0,
        failedRequests: 0,
        lastRequestAt: null,
        createdAt: now
      }, { merge: true });
      transaction.set(summaryRef, increments, { merge: true });
      transaction.set(logRef, {
        type,
        details,
        createdAt: now
      });
    }), USAGE_TRACKING_TIMEOUT_MS, 'AI usage tracking');
    traceAiSearch('[AI voice trace] usage tracking done', { type });
  } catch (error) {
    traceAiSearch('[AI voice trace] usage tracking failed or timed out', {
      type,
      error: error instanceof Error ? error.message : String(error)
    });
    if (AI_SEARCH_DEBUG) {
      console.warn('[AI search] usage tracking failed:', error);
    }
  }
};

const buildListingIndexText = (listing: Listing) => [
  listing.title,
  listing.description,
  `category: ${listing.category}`,
  `subcategory: ${listing.subCategory}`,
  `district: ${listing.district}`,
  `address: ${listing.address}`,
  `price per day: ${listing.pricePerDay}`,
  listing.pricePerMonth ? `price per month: ${listing.pricePerMonth}` : '',
  listing.housingType ? `housing type: ${listing.housingType}` : '',
  listing.roomsTotal ? `rooms: ${listing.roomsTotal}` : '',
  listing.bedroomsCount ? `bedrooms: ${listing.bedroomsCount}` : '',
  listing.area ? `area: ${listing.area}` : '',
  listing.interiorStyle ? `style: ${listing.interiorStyle}` : '',
  listing.poolType ? `pool: ${listing.poolType}` : '',
  listing.kitchenType ? `kitchen: ${listing.kitchenType}` : '',
  listing.amenities?.length ? `amenities: ${listing.amenities.join(', ')}` : '',
  listing.extraOptions?.length ? `options: ${listing.extraOptions.join(', ')}` : '',
  listing.vehicleBrand ? `vehicle brand: ${listing.vehicleBrand}` : '',
  listing.vehicleModel ? `vehicle model: ${listing.vehicleModel}` : '',
  listing.vehicleColor ? `vehicle color: ${listing.vehicleColor}` : ''
].filter(Boolean).join('\n').slice(0, 4000);

const readEmbedding = async (text: string): Promise<number[]> => {
  const { accountId, apiToken, embeddingModel } = getCloudflareConfig();
  if (!accountId || !apiToken) throw new Error('Cloudflare AI is not configured.');

  return withTimeout(async signal => {
    traceAiSearch('[AI voice trace] Cloudflare embedding fetch start', { model: embeddingModel, textLength: text.length });
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${embeddingModel}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: [text] }),
        signal
      }
    );
    traceAiSearch('[AI voice trace] Cloudflare embedding fetch response', { status: response.status, ok: response.ok });

    const payload = await response.json().catch(() => null);
    traceAiSearch('[AI voice trace] Cloudflare embedding json parsed', { success: Boolean(payload?.success) });
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.errors?.[0]?.message || 'Cloudflare embedding request failed.');
    }

    const vector = payload?.result?.data?.[0];
    if (!Array.isArray(vector)) throw new Error('Cloudflare embedding response has no vector.');

    return vector.map(Number).filter(Number.isFinite);
  });
};

const callVectorize = async (path: 'upsert' | 'query' | 'delete_by_ids', body: BodyInit, contentType: string) => {
  const { accountId, apiToken, vectorizeIndex } = getCloudflareConfig();
  if (!accountId || !apiToken || !vectorizeIndex) throw new Error('Cloudflare Vectorize is not configured.');

  return withTimeout(async signal => {
    traceAiSearch('[AI voice trace] Vectorize fetch start', { path, index: vectorizeIndex });
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/vectorize/v2/indexes/${encodeURIComponent(vectorizeIndex)}/${path}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': contentType
        },
        body,
        signal
      }
    );
    traceAiSearch('[AI voice trace] Vectorize fetch response', { path, status: response.status, ok: response.ok });

    const payload = await response.json().catch(() => null);
    traceAiSearch('[AI voice trace] Vectorize json parsed', { path, success: Boolean(payload?.success) });
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.errors?.[0]?.message || `Vectorize ${path} request failed.`);
    }

    return payload;
  });
};

export const upsertListingVector = async (listing: Listing) => {
  if (listing.status !== 'active') return { skipped: true, reason: 'listing_not_active' };

  const values = await readEmbedding(buildListingIndexText(listing));
  const vector = {
    id: listing.id,
    values,
    metadata: {
      category: listing.category,
      subCategory: listing.subCategory,
      district: listing.district,
      title: listing.title
    }
  };

  const payload = await callVectorize('upsert', `${JSON.stringify(vector)}\n`, 'application/x-ndjson');
  await trackAiUsage('index_upsert', { listingId: listing.id, category: listing.category });
  return { skipped: false, mutationId: payload?.result?.mutationId || null };
};

export const deleteListingVector = async (listingId: string) => {
  const payload = await callVectorize('delete_by_ids', JSON.stringify({ ids: [listingId] }), 'application/json');
  await trackAiUsage('index_delete', { listingId });
  return { mutationId: payload?.result?.mutationId || null };
};

export const searchListingVectors = async (query: string, topK = DEFAULT_TOP_K): Promise<VectorSearchMatch[]> => {
  traceAiSearch('[AI voice trace] searchListingVectors start', { queryLength: query.length, topK });
  const values = await readEmbedding(query);
  traceAiSearch('[AI voice trace] searchListingVectors embedding ready', { dimensions: values.length });
  const payload = await callVectorize(
    'query',
    JSON.stringify({
      vector: values,
      topK: Math.min(Math.max(topK, 1), 10),
      returnMetadata: 'none',
      returnValues: false
    }),
    'application/json'
  );

  await trackAiUsage('vector', { topK });
  traceAiSearch('[AI voice trace] searchListingVectors done', { matches: payload?.result?.matches?.length || 0 });
  return (payload?.result?.matches || [])
    .map((match: any) => ({
      id: String(match.id || ''),
      score: Number(match.score || 0)
    }))
    .filter((match: VectorSearchMatch) => match.id);
};

export const transcribeAudioWithGroq = async ({
  base64Audio,
  mimeType
}: {
  base64Audio: string;
  mimeType: string;
}) => {
  traceAiSearch('[AI voice trace] Groq transcription start', { mimeType });
  const { apiKey, model } = getGroqConfig();
  if (!apiKey) throw new Error('Groq API is not configured.');

  const audioBuffer = Buffer.from(base64Audio, 'base64');
  traceAiSearch('[AI voice trace] audio decoded', { bytes: audioBuffer.length });
  if (audioBuffer.length > 25 * 1024 * 1024) throw new Error('Audio file is too large.');

  const extension = mimeType.includes('wav') ? 'wav' : 'webm';
  const form = new FormData();
  form.append('model', model);
  form.append('response_format', 'json');
  form.append('temperature', '0');
  form.append('file', new Blob([audioBuffer], { type: mimeType || 'audio/webm' }), `voice-search.${extension}`);

  return withTimeout(async signal => {
    traceAiSearch('[AI voice trace] Groq fetch start', { model, bytes: audioBuffer.length });
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: form,
      signal
    });
    traceAiSearch('[AI voice trace] Groq fetch response', { status: response.status, ok: response.ok });

    const payload = await response.json().catch(() => null);
    traceAiSearch('[AI voice trace] Groq json parsed', { hasText: Boolean(payload?.text), hasError: Boolean(payload?.error) });
    if (!response.ok) {
      throw new Error(payload?.error?.message || 'Groq transcription request failed.');
    }

    const text = String(payload?.text || '').trim();
    if (!text) throw new Error('Groq transcription returned empty text.');

    await trackAiUsage('voice', { durationBytes: audioBuffer.length });
    traceAiSearch('[AI voice trace] Groq transcription done', { textLength: text.length });
    return text;
  });
};

export const trackTextAiSearchRequest = async (query: string) => {
  await trackAiUsage('text', { queryLength: query.length });
};

export const trackFailedAiSearchRequest = async (reason: string) => {
  await trackAiUsage('failure', { reason });
};

export const readAiSearchUsageStats = async (): Promise<AiSearchUsageStats> => {
  try {
    const snapshot = await withPromiseTimeout(
      getAiSearchDb().collection(AI_USAGE_COLLECTION).doc(AI_USAGE_DOC_ID).get(),
      USAGE_TRACKING_TIMEOUT_MS,
      'AI usage stats read'
    );
    const data = snapshot.exists ? snapshot.data() || {} : {};
    return {
      totalRequests: Number(data.totalRequests || 0),
      voiceRequests: Number(data.voiceRequests || 0),
      textRequests: Number(data.textRequests || 0),
      vectorSearchRequests: Number(data.vectorSearchRequests || 0),
      indexUpserts: Number(data.indexUpserts || 0),
      indexDeletes: Number(data.indexDeletes || 0),
      failedRequests: Number(data.failedRequests || 0),
      lastRequestAt: typeof data.lastRequestAt === 'string' ? data.lastRequestAt : null
    };
  } catch (error) {
    if (AI_SEARCH_DEBUG) {
      console.warn('[AI search] usage stats read failed:', error);
    }
    return {
      totalRequests: 0,
      voiceRequests: 0,
      textRequests: 0,
      vectorSearchRequests: 0,
      indexUpserts: 0,
      indexDeletes: 0,
      failedRequests: 0,
      lastRequestAt: null
    };
  }
};
