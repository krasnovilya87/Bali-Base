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
  getDocsFromServer,
  persistentLocalCache
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import firebaseConfig from './config/firebaseConfig';

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
    let snapshot;
    try {
      snapshot = await getDocsFromServer(colRef);
    } catch (serverErr) {
      console.warn(`Failed to fetch ${path} from server, falling back to local cache`, serverErr);
      snapshot = await getDocs(colRef);
    }
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

const LISTING_COORDINATE_FIELDS = [
  'coords',
  'coordinates',
  'location',
  'lat',
  'lng',
  'lon',
  'latitude',
  'longitude',
  'nearbySpotsOrigin'
];

const readFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const readLatLng = (value: any): { lat: number; lng: number } | undefined => {
  if (!value || typeof value !== 'object') return undefined;

  const lat = readFiniteNumber(value.lat ?? value.latitude ?? value._lat);
  const lng = readFiniteNumber(value.lng ?? value.lon ?? value.longitude ?? value._long);
  if (lat === undefined || lng === undefined) return undefined;

  return { lat, lng };
};

const hasOwn = (value: Record<string, any>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

export function hasLegacyListingCoordinates(data: any): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  return LISTING_COORDINATE_FIELDS.some(field => hasOwn(data, field));
}

export function sanitizeListingForFirestore<T = any>(data: T): T {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;

  const listing = { ...(data as Record<string, any>) };
  const locationCoords =
    readLatLng(listing.locationCoords) ||
    readLatLng(listing.coords) ||
    readLatLng(listing.coordinates) ||
    readLatLng(listing.location) ||
    (() => {
      const lat = readFiniteNumber(listing.lat ?? listing.latitude);
      const lng = readFiniteNumber(listing.lng ?? listing.lon ?? listing.longitude);
      return lat !== undefined && lng !== undefined ? { lat, lng } : undefined;
    })();

  LISTING_COORDINATE_FIELDS.forEach(field => {
    delete listing[field];
  });

  if (locationCoords) {
    listing.locationCoords = locationCoords;
  } else {
    delete listing.locationCoords;
  }

  return listing as T;
}

export async function setDocument<T = any>(path: string, docId: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, path, docId);
    const dataForWrite = path === LISTINGS_COLLECTION ? sanitizeListingForFirestore(data) : data;
    const sanitizedData = cleanUndefined(dataForWrite);
    await setDoc(docRef, sanitizedData);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${docId}`);
  }
}

export async function addDocument<T = any>(path: string, data: any): Promise<string> {
  try {
    const docRef = collection(db, path);
    const dataForWrite = path === LISTINGS_COLLECTION ? sanitizeListingForFirestore(data) : data;
    const sanitizedData = cleanUndefined(dataForWrite);
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
    const dataForWrite = path === LISTINGS_COLLECTION ? sanitizeListingForFirestore(data) : data;
    const sanitizedData = cleanUndefined(dataForWrite);
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

export async function syncWithFirebase(): Promise<{ listings: any[], bookings: any[] }> {
  let firebaseListings = await getCollection(LISTINGS_COLLECTION);
  const firebaseBookings = await getCollection('bookings');

  const listingsWithLegacyCoordinates = firebaseListings.filter(listing =>
    listing?.id && hasLegacyListingCoordinates(listing)
  );
  if (listingsWithLegacyCoordinates.length > 0) {
    console.log(`Sanitizing listing coordinates in Firestore: ${listingsWithLegacyCoordinates.length}`);
    for (const listing of listingsWithLegacyCoordinates) {
      await setDocument(LISTINGS_COLLECTION, listing.id, listing);
    }
    firebaseListings = firebaseListings.map(listing => sanitizeListingForFirestore(listing));
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

export async function getDailyAuthImageUrl(): Promise<string | null> {
  try {
    const folderRef = ref(storage, 'bali_img');
    const result = await listAll(folderRef);
    const images = result.items
      .filter(item => /\.(avif|webp|jpe?g|png)$/i.test(item.name))
      .sort((a, b) => a.fullPath.localeCompare(b.fullPath));

    if (images.length === 0) return null;

    const todayKey = new Date().toISOString().slice(0, 10);
    const daySeed = Array.from(todayKey).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const dailyImageRef = images[daySeed % images.length];

    return await getDownloadURL(dailyImageRef);
  } catch (error) {
    console.warn('Failed to load daily auth image from Firebase Storage.', error);
    return null;
  }
}

