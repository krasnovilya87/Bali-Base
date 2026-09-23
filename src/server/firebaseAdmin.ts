import fs from 'node:fs';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../config/firebaseConfig';

type ServiceAccountConfig = {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
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
  if (rawJson?.trim()) {
    return parseServiceAccountJson(rawJson);
  }

  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (filePath?.trim()) {
    return parseServiceAccountJson(fs.readFileSync(filePath, 'utf8'));
  }

  return null;
};

const serviceAccount = readServiceAccount();

export const firebaseAdminApp = getApps().find(item => item.name === 'bali-base-api-admin') ||
  initializeApp({
    credential: serviceAccount
      ? cert(serviceAccount)
      : applicationDefault(),
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket
  }, 'bali-base-api-admin');

export const adminAuth = getAuth(firebaseAdminApp);
export const adminDb = getFirestore(firebaseAdminApp, (firebaseConfig as any).firestoreDatabaseId);
