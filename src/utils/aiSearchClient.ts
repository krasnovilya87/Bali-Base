export type AiSearchIntent = {
  category: 'housing' | 'transport' | 'services' | 'investments' | 'ads' | 'afisha' | 'life' | 'useful' | 'unknown';
  supported: boolean;
  shouldFallback: boolean;
  subCategory: string | null;
  district: string | null;
  priceMin: number | null;
  priceMax: number | null;
  housingType: string[];
  roomsMin: number | null;
  areaMin: number | null;
  interiorStyle: string[];
  territoryType: string[];
  densityType: string[];
  bedType: string[];
  kitchenType: string[];
  poolType: string[];
  internetSpeedMin: number | null;
  bathroomOptions: string[];
  amenities: string[];
  cleaningFrequency: string[];
  viewType: string[];
  extraOptions: string[];
  distanceToSeaMax: number | null;
  searchText: string | null;
  confidence: number;
  reason?: string;
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

export type AiVectorSearchResult = {
  transcript?: string;
  listingIds: string[];
  matches: { id: string; score: number }[];
};

export type AiVoiceTranscriptionResult = {
  transcript: string;
  fallback?: boolean;
  reason?: string;
};

const getAiSearchEndpoint = () => {
  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.BALI_BASE_API_URL ||
    '';
  return `${String(apiBaseUrl).replace(/\/$/, '')}/api/ai-search`;
};

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const value = String(reader.result || '');
    resolve(value.includes(',') ? value.split(',').pop() || '' : value);
  };
  reader.onerror = () => reject(reader.error || new Error('Could not read audio.'));
  reader.readAsDataURL(blob);
});

export const requestAiSearchIntent = async (query: string): Promise<AiSearchIntent> => {
  const response = await fetch(getAiSearchEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok || !payload?.intent) {
    throw new Error(payload?.error || response.statusText || 'AI search request failed');
  }

  return payload.intent as AiSearchIntent;
};

export const requestAiVectorSearch = async (query: string, topK = 10): Promise<AiVectorSearchResult> => {
  const response = await fetch(`${getAiSearchEndpoint()}/vector-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, topK })
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || response.statusText || 'AI vector search request failed');
  }

  return {
    listingIds: Array.isArray(payload.listingIds) ? payload.listingIds.map(String) : [],
    matches: Array.isArray(payload.matches) ? payload.matches : []
  };
};

export const requestAiVoiceVectorSearch = async (
  audio: Blob,
  topK = 10
): Promise<AiVectorSearchResult> => {
  const response = await fetch(`${getAiSearchEndpoint()}/voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio: await blobToBase64(audio),
      mimeType: audio.type || 'audio/webm',
      topK
    })
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || response.statusText || 'AI voice search request failed');
  }

  return {
    transcript: String(payload.transcript || ''),
    listingIds: Array.isArray(payload.listingIds) ? payload.listingIds.map(String) : [],
    matches: Array.isArray(payload.matches) ? payload.matches : []
  };
};

export const requestAiVoiceTranscription = async (audio: Blob): Promise<AiVoiceTranscriptionResult> => {
  const response = await fetch(`${getAiSearchEndpoint()}/voice/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio: await blobToBase64(audio),
      mimeType: audio.type || 'audio/webm'
    })
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || response.statusText || 'AI voice transcription request failed');
  }

  return {
    transcript: String(payload.transcript || ''),
    fallback: Boolean(payload.fallback),
    reason: typeof payload.reason === 'string' ? payload.reason : undefined
  };
};

export const indexListingForAiSearch = async (listing: unknown) => {
  const response = await fetch(`${getAiSearchEndpoint()}/index-listing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listing })
  });
  if (!response.ok) throw new Error('AI listing indexing request failed');
};

export const deleteListingFromAiSearch = async (listingId: string) => {
  const response = await fetch(`${getAiSearchEndpoint()}/delete-listing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId })
  });
  if (!response.ok) throw new Error('AI listing vector delete request failed');
};

export const loadAiSearchUsageStats = async (): Promise<AiSearchUsageStats> => {
  const response = await fetch(`${getAiSearchEndpoint()}/stats`);
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok || !payload?.stats) {
    throw new Error(payload?.error || response.statusText || 'AI usage stats request failed');
  }
  return payload.stats as AiSearchUsageStats;
};
