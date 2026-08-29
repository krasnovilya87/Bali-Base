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

const getAiSearchEndpoint = () => {
  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.BALI_BASE_API_URL ||
    '';
  return `${String(apiBaseUrl).replace(/\/$/, '')}/api/ai-search`;
};

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
