import { auth } from '../firebase';

export type PhonePhotoTransferPayload = {
  photoUrls: string[];
  realPhotoUrls: string[];
  photoSlotAssignments: Record<string, string[]>;
};

type PhotoUploadSessionResponse = {
  ok?: boolean;
  sessionId?: string;
  status?: 'pending' | 'ready';
  payload?: PhonePhotoTransferPayload;
  expiresAtMs?: number;
  error?: string;
};

const getSessionEndpoint = (sessionId?: string) => {
  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.BALI_BASE_API_URL ||
    '';
  const base = `${String(apiBaseUrl).replace(/\/$/, '')}/api/photo-upload-sessions`;
  return sessionId ? `${base}/${encodeURIComponent(sessionId)}` : base;
};

const parseResponse = async (response: Response) => {
  const payload = await response.json().catch(() => null) as PhotoUploadSessionResponse | null;
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || response.statusText || 'Photo upload session request failed.');
  }
  return payload;
};

export const createPhonePhotoTransferSession = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sign in is required before connecting a phone.');
  const response = await fetch(getSessionEndpoint(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await parseResponse(response);
  if (!payload.sessionId) throw new Error('Photo upload session was not created.');
  return payload.sessionId;
};

export const readPhonePhotoTransferSession = async (sessionId: string) => {
  const response = await fetch(getSessionEndpoint(sessionId));
  return parseResponse(response);
};

export const completePhonePhotoTransferSession = async (
  sessionId: string,
  payload: PhonePhotoTransferPayload
) => {
  const response = await fetch(getSessionEndpoint(sessionId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  await parseResponse(response);
};

export const closePhonePhotoTransferSession = async (sessionId: string) => {
  await fetch(getSessionEndpoint(sessionId), { method: 'DELETE' });
};

