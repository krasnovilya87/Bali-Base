import { getFirebaseRequestHeaders } from './firebaseRequestHeaders';

export type GoogleUsageRow = { label: string; count: number; freeCap: number };
export type GoogleUsageStats = { monthStart: string; updatedAt: string; rows: GoogleUsageRow[] };

const getEndpoint = () => {
  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.BALI_BASE_API_URL ||
    '';
  return `${String(apiBaseUrl).replace(/\/$/, '')}/api/admin/google-usage`;
};

export const loadGoogleUsageStats = async (): Promise<GoogleUsageStats> => {
  const response = await fetch(getEndpoint(), {
    headers: await getFirebaseRequestHeaders({ authError: 'Administrator authentication is required.' })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Could not load Google API usage.');
  return { monthStart: payload.monthStart, updatedAt: payload.updatedAt, rows: payload.rows || [] };
};
