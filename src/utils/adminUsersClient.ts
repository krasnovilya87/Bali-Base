import { getFirebaseRequestHeaders } from './firebaseRequestHeaders';

const getAdminEndpoint = () => {
  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.BALI_BASE_API_URL ||
    '';
  return `${String(apiBaseUrl).replace(/\/$/, '')}/api/admin/users`;
};

const requestAdminUsers = async (path: string, init: RequestInit) => {
  const response = await fetch(`${getAdminEndpoint()}${path}`, {
    ...init,
    headers: {
      ...(await getFirebaseRequestHeaders({
        authError: 'Administrator authentication is required.',
        contentType: 'application/json'
      })),
      ...init.headers
    }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Administrator request failed.');
  return payload;
};

export const createFirebaseAdminUser = async (input: {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'moderator' | 'host' | 'guest';
}) => (await requestAdminUsers('', { method: 'POST', body: JSON.stringify(input) })).user;

export const setFirebaseUserStatus = (uid: string, status: 'active' | 'banned') =>
  requestAdminUsers(`/${encodeURIComponent(uid)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });

export const deleteFirebaseAdminUser = (uid: string) =>
  requestAdminUsers(`/${encodeURIComponent(uid)}`, { method: 'DELETE' });
