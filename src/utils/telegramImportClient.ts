import { getFirebaseRequestHeaders } from './firebaseRequestHeaders';

export type TelegramImportSection = 'ads' | 'services' | 'afisha' | 'life';
export type TelegramImportSummary = {
  created: Record<TelegramImportSection, number>;
  reposts: number;
  removed?: number;
  skipped: number;
  photoErrors: number;
  failed: number;
};
export type TelegramImportRun = {
  startedAt: string;
  finishedAt?: string;
  ok?: boolean;
  error?: string;
  summary?: TelegramImportSummary;
};
export type TelegramImportStatus = {
  available: boolean;
  reason?: string;
  channels: Array<{ name: string; firstScanDays: number; lastMessageId: number; posts: number }>;
  running: boolean;
  stopping?: boolean;
  step: string;
  log: string[];
  lastRun: TelegramImportRun | null;
};

const getEndpoint = (suffix = '') => {
  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.BALI_BASE_API_URL ||
    '';
  return `${String(apiBaseUrl).replace(/\/$/, '')}/api/admin/telegram-import${suffix}`;
};

const request = async (suffix: string, init: RequestInit = {}) => {
  const response = await fetch(getEndpoint(suffix), {
    ...init,
    headers: await getFirebaseRequestHeaders({
      authError: 'Administrator authentication is required.',
      contentType: init.body ? 'application/json' : undefined
    })
  });
  const payload = await response.json().catch(() => null);
  // The production API (Cloud Run) has no parser and answers 404/405 or an HTML page.
  if (!payload && [404, 405, 501].includes(response.status)) throw new Error(TELEGRAM_IMPORT_API_UNAVAILABLE);
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Telegram import request failed.');
  return payload;
};

export const TELEGRAM_IMPORT_API_UNAVAILABLE = 'TELEGRAM_IMPORT_API_UNAVAILABLE';

export const loadTelegramImportStatus = async (): Promise<TelegramImportStatus> => request('');

export const addTelegramImportChannel = async (channel: string, days: number): Promise<string[]> =>
  (await request('/channels', { method: 'POST', body: JSON.stringify({ channel, days }) })).channels;

export const removeTelegramImportChannel = async (channel: string): Promise<string[]> =>
  (await request(`/channels/${encodeURIComponent(channel)}`, { method: 'DELETE' })).channels;

export const startTelegramImport = async () => {
  await request('/run', { method: 'POST' });
};

export const stopTelegramImport = async () => {
  await request('/stop', { method: 'POST' });
};
