import { initializeApp, getApps } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import firebaseConfig from '../../config/firebaseConfig';
import type { Listing } from '../../types';
import { getCurrentMonthKey, GOOGLE_PLACES_REVIEWS_CONFIG } from './config';
import type { GooglePlaceReviewCacheRecord, GooglePlacesQuotaSnapshot, GooglePlacesRequestPurpose } from './types';

const app = getApps().find(item => item.name === 'google-places-reviews-server') ||
  initializeApp(firebaseConfig, 'google-places-reviews-server');

const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

export const GOOGLE_PLACES_CACHE_COLLECTION = 'google_places_review_cache';
export const GOOGLE_PLACES_USAGE_COLLECTION = 'google_places_api_usage';
export const GOOGLE_PLACES_REQUEST_LOG_COLLECTION = 'google_places_api_request_log';
const LISTINGS_COLLECTION = 'housing_for_rent_listing';

const getUsageDocRef = (monthKey = getCurrentMonthKey()) =>
  doc(db, GOOGLE_PLACES_USAGE_COLLECTION, monthKey);

const buildDefaultUsage = (monthKey = getCurrentMonthKey()) => {
  const hardLimit = GOOGLE_PLACES_REVIEWS_CONFIG.maxMonthlyRequests;
  const creationReserve = GOOGLE_PLACES_REVIEWS_CONFIG.creationRequestReserve;
  return {
    monthKey,
    successfulRequests: 0,
    hardLimit,
    creationReserve,
    backgroundLimit: Math.max(0, hardLimit - creationReserve),
    estimatedFreeRequests: GOOGLE_PLACES_REVIEWS_CONFIG.estimatedFreeMonthlyRequests,
    updatedAt: new Date().toISOString()
  };
};

export const readQuotaSnapshot = async (monthKey = getCurrentMonthKey()): Promise<GooglePlacesQuotaSnapshot> => {
  const ref = getUsageDocRef(monthKey);
  const snapshot = await getDoc(ref);
  const usage = snapshot.exists()
    ? { ...buildDefaultUsage(monthKey), ...snapshot.data() }
    : buildDefaultUsage(monthKey);

  return {
    ...usage,
    id: monthKey,
    remainingBeforeHardLimit: Math.max(0, usage.hardLimit - usage.successfulRequests),
    remainingForBackground: Math.max(0, usage.backgroundLimit - usage.successfulRequests),
    remainingEstimatedFreeRequests: Math.max(0, usage.estimatedFreeRequests - usage.successfulRequests)
  };
};

export const canSpendGooglePlacesRequest = async (
  purpose: GooglePlacesRequestPurpose,
  monthKey = getCurrentMonthKey()
) => {
  const quota = await readQuotaSnapshot(monthKey);
  if (quota.successfulRequests >= quota.hardLimit) {
    return { allowed: false, quota, reason: 'Monthly hard limit exhausted' };
  }
  if (purpose === 'background' && quota.successfulRequests >= quota.backgroundLimit) {
    return { allowed: false, quota, reason: 'Background limit reached; creation reserve is protected' };
  }
  return { allowed: true, quota, reason: '' };
};

export const logSuccessfulGooglePlacesRequest = async ({
  listingId,
  placeId,
  purpose
}: {
  listingId: string;
  placeId: string;
  purpose: GooglePlacesRequestPurpose;
}) => {
  const monthKey = getCurrentMonthKey();
  const usageRef = getUsageDocRef(monthKey);
  const logRef = doc(collection(db, GOOGLE_PLACES_REQUEST_LOG_COLLECTION));
  const now = new Date().toISOString();

  await runTransaction(db, async transaction => {
    const usageSnapshot = await transaction.get(usageRef);
    if (!usageSnapshot.exists()) {
      transaction.set(usageRef, buildDefaultUsage(monthKey));
    }

    transaction.set(logRef, {
      monthKey,
      listingId,
      placeId,
      purpose,
      fieldMask: 'id,rating,reviews',
      createdAt: now
    });
    transaction.set(usageRef, {
      ...buildDefaultUsage(monthKey),
      successfulRequests: increment(1),
      updatedAt: now
    }, { merge: true });
  });
};

export const readReviewCache = async (listingId: string) => {
  const snapshot = await getDoc(doc(db, GOOGLE_PLACES_CACHE_COLLECTION, listingId));
  return snapshot.exists()
    ? ({ id: snapshot.id, ...snapshot.data() } as GooglePlaceReviewCacheRecord)
    : null;
};

export const writeReviewCache = async (record: GooglePlaceReviewCacheRecord) => {
  await setDoc(doc(db, GOOGLE_PLACES_CACHE_COLLECTION, record.listingId), record, { merge: true });
};

export const updateListingWithReviewCache = async (record: GooglePlaceReviewCacheRecord) => {
  await setDoc(doc(db, LISTINGS_COLLECTION, record.listingId), {
    googlePlaceId: record.placeId,
    placeId: record.placeId,
    rating: record.rating ?? 0,
    reviews: record.reviews,
    reviewsCount: record.reviewsCount,
    googleReviewsUpdatedAt: record.updatedAt
  }, { merge: true });
};

export const readListingsForReviewsRefresh = async (maxCount: number) => {
  const listingsSnapshot = await getDocs(query(
    collection(db, LISTINGS_COLLECTION),
    where('category', '==', 'housing'),
    where('status', '==', 'active'),
    limit(maxCount * 4)
  ));

  return listingsSnapshot.docs
    .map(item => ({ id: item.id, ...item.data() } as Listing))
    .filter(listing => Boolean(listing.googlePlaceId || listing.placeId || listing.nearbySpots?.[0]?.placeId))
    .slice(0, maxCount);
};

export const readOldestReviewCaches = async (maxCount: number) => {
  const snapshot = await getDocs(query(
    collection(db, GOOGLE_PLACES_CACHE_COLLECTION),
    orderBy('updatedAt', 'asc'),
    limit(maxCount)
  ));

  return snapshot.docs.map(item => ({ id: item.id, ...item.data() } as GooglePlaceReviewCacheRecord));
};
