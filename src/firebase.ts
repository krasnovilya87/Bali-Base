import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where,
  getDocFromServer,
  persistentLocalCache
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({})
}, (firebaseConfig as any).firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();
export const storage = getStorage(app);
export const LISTINGS_COLLECTION = 'housing_for_rent_listing';

// Test connection on boot as mandated in guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline') || error.message.includes('unavailable') || error.message.includes('permissions') || (error as any).code === 'unavailable') {
        console.warn("Firestore is operating in offline mode. Local persistent caching is active.");
      }
    }
  }
}

// Error handling types and function as mandated in guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRUD wrappers with built-in error handling
export async function getDocument<T = any>(path: string, docId: string): Promise<T | null> {
  try {
    const docRef = doc(db, path, docId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as unknown as T;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${path}/${docId}`);
    return null;
  }
}

export async function getCollection<T = any>(path: string): Promise<T[]> {
  try {
    const colRef = collection(db, path);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as T[];
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item));
  }
  if (typeof obj === 'object') {
    // If it's a specific class like Date, we don't want to convert it to a plain object
    if (obj instanceof Date) {
      return obj;
    }
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        cleaned[key] = cleanUndefined(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
}

export async function setDocument<T = any>(path: string, docId: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, path, docId);
    const sanitizedData = cleanUndefined(data);
    await setDoc(docRef, sanitizedData);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${docId}`);
  }
}

export async function addDocument<T = any>(path: string, data: any): Promise<string> {
  try {
    const docRef = collection(db, path);
    const sanitizedData = cleanUndefined(data);
    const addedDoc = await addDoc(docRef, sanitizedData);
    return addedDoc.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function updateDocument(path: string, docId: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, path, docId);
    const sanitizedData = cleanUndefined(data);
    await updateDoc(docRef, sanitizedData);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${path}/${docId}`);
  }
}

export async function deleteDocument(path: string, docId: string): Promise<void> {
  try {
    const docRef = doc(db, path, docId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${docId}`);
  }
}

export async function syncWithFirebase(defaultListings: any[], defaultBookings: any[]): Promise<{ listings: any[], bookings: any[] }> {
  let firebaseListings = await getCollection(LISTINGS_COLLECTION);
  let firebaseBookings = await getCollection('bookings');

  if (firebaseListings.length === 0) {
    console.log('Seeding listings to Firestore...');
    for (const listing of defaultListings) {
      await setDocument(LISTINGS_COLLECTION, listing.id, listing);
    }
    firebaseListings = await getCollection(LISTINGS_COLLECTION);
  }

  if (firebaseBookings.length === 0) {
    console.log('Seeding bookings to Firestore...');
    for (const booking of defaultBookings) {
      await setDocument('bookings', booking.id, booking);
    }
    firebaseBookings = await getCollection('bookings');
  }

  return {
    listings: firebaseListings,
    bookings: firebaseBookings
  };
}

export async function uploadFileToStorage(file: File | Blob, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

