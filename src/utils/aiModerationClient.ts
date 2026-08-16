import type { AiModerationResult, Listing } from '../types';

const getModerationEndpoint = () => {
  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.BALI_BASE_API_URL ||
    '';
  return `${String(apiBaseUrl).replace(/\/$/, '')}/api/ai/moderate-listing`;
};

export const moderateListing = async (listing: Listing): Promise<AiModerationResult> => {
  const response = await fetch(getModerationEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listing })
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok || !payload?.result) {
    throw new Error(payload?.error || response.statusText || 'AI moderation request failed');
  }

  return payload.result as AiModerationResult;
};
