import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../config/firebaseConfig';

export const firebaseAdminApp = getApps().find(item => item.name === 'bali-base-api-admin') ||
  initializeApp({
    credential: applicationDefault(),
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket
  }, 'bali-base-api-admin');

export const adminAuth = getAuth(firebaseAdminApp);
export const adminDb = getFirestore(firebaseAdminApp, (firebaseConfig as any).firestoreDatabaseId);
