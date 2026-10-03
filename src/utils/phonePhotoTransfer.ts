import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type PhonePhotoTransferPayload = {
  photoUrls: string[];
  realPhotoUrls: string[];
  photoSlotAssignments: Record<string, string[]>;
};

type PhotoUploadSessionDocument = {
  ownerId: string;
  transferSecret: string;
  status: 'pending' | 'ready';
  createdAtMs: number;
  expiresAtMs: number;
  completedAtMs?: number;
  submittedSecret?: string;
  payload?: PhonePhotoTransferPayload;
};

const COLLECTION = 'photo_upload_sessions';
const SESSION_TTL_MS = 30 * 60 * 1000;

const randomBase64Url = (byteLength: number) => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const splitSessionToken = (sessionToken: string) => {
  const separatorIndex = sessionToken.indexOf('.');
  if (separatorIndex < 1) throw new Error('Invalid photo upload session.');

  const sessionId = sessionToken.slice(0, separatorIndex);
  const transferSecret = sessionToken.slice(separatorIndex + 1);
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(sessionId) || !/^[A-Za-z0-9_-]{32,128}$/.test(transferSecret)) {
    throw new Error('Invalid photo upload session.');
  }

  return { sessionId, transferSecret };
};

export const createPhonePhotoTransferSession = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in is required before connecting a phone.');

  const sessionId = randomBase64Url(32);
  const transferSecret = randomBase64Url(32);
  const now = Date.now();
  await setDoc(doc(db, COLLECTION, sessionId), {
    ownerId: user.uid,
    transferSecret,
    status: 'pending',
    createdAtMs: now,
    expiresAtMs: now + SESSION_TTL_MS
  } satisfies PhotoUploadSessionDocument);

  return `${sessionId}.${transferSecret}`;
};

export const readPhonePhotoTransferSession = async (sessionToken: string) => {
  const { sessionId } = splitSessionToken(sessionToken);
  const snapshot = await getDoc(doc(db, COLLECTION, sessionId));
  if (!snapshot.exists()) throw new Error('Photo upload session not found.');

  const data = snapshot.data() as PhotoUploadSessionDocument;
  if (data.expiresAtMs <= Date.now()) throw new Error('Photo upload session expired.');
  return {
    status: data.status,
    payload: data.status === 'ready' ? data.payload : undefined,
    expiresAtMs: data.expiresAtMs
  };
};

export const completePhonePhotoTransferSession = async (
  sessionToken: string,
  payload: PhonePhotoTransferPayload
) => {
  const { sessionId, transferSecret } = splitSessionToken(sessionToken);
  await updateDoc(doc(db, COLLECTION, sessionId), {
    status: 'ready',
    payload,
    submittedSecret: transferSecret,
    completedAtMs: Date.now()
  });
};

export const closePhonePhotoTransferSession = async (sessionToken: string) => {
  const { sessionId } = splitSessionToken(sessionToken);
  await deleteDoc(doc(db, COLLECTION, sessionId));
};
