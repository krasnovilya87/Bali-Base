import fs from 'node:fs';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../config/firebaseConfig';
import type { Listing } from '../../types';
import { getCurrentMonthKey, GOOGLE_PLACES_REVIEWS_CONFIG } from './config';
import type { GooglePlaceReviewCacheRecord, GooglePlacesQuotaSnapshot, GooglePlacesRequestPurpose } from './types';

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

const adminApp = getApps().find(item => item.name === 'google-places-reviews-admin') ||
  initializeApp({
    credential: serviceAccount
      ? cert(serviceAccount)
      : applicationDefault(),
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket
  }, 'google-places-reviews-admin');

const db = getFirestore(adminApp, (firebaseConfig as any).firestoreDatabaseId);

export const GOOGLE_PLACES_CACHE_COLLECTION = 'google_places_review_cache';
export const GOOGLE_PLACES_USAGE_COLLECTION = 'google_places_api_usage';
export const GOOGLE_PLACES_REQUEST_LOG_COLLECTION = 'google_places_api_request_log';
const LISTINGS_COLLECTION = 'housing_for_rent_listing';

const getUsageDocRef = (monthKey = getCurrentMonthKey()) =>
  db.collection(GOOGLE_PLACES_USAGE_COLLECTION).doc(monthKey);

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
  const snapshot = await ref.get();
  const usage = snapshot.exists
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
  const logRef = db.collection(GOOGLE_PLACES_REQUEST_LOG_COLLECTION).doc();
  const now = new Date().toISOString();

  await db.runTransaction(async transaction => {
    const usageSnapshot = await transaction.get(usageRef);
    if (!usageSnapshot.exists) {
      transaction.set(usageRef, buildDefaultUsage(monthKey));
    }

    transaction.set(logRef, {
      monthKey,
      listingId,
      placeId,
      purpose,
      fieldMask: 'id,rating,userRatingCount,reviews',
      createdAt: now
    });
    transaction.set(usageRef, {
      ...buildDefaultUsage(monthKey),
      successfulRequests: FieldValue.increment(1),
      updatedAt: now
    }, { merge: true });
  });
};

export const readReviewCache = async (listingId: string) => {
  const snapshot = await db.collection(GOOGLE_PLACES_CACHE_COLLECTION).doc(listingId).get();
  return snapshot.exists
    ? ({ id: snapshot.id, ...snapshot.data() } as GooglePlaceReviewCacheRecord)
    : null;
};

export const writeReviewCache = async (record: GooglePlaceReviewCacheRecord) => {
  await db.collection(GOOGLE_PLACES_CACHE_COLLECTION).doc(record.listingId).set(record, { merge: true });
};

export const updateListingWithReviewCache = async (record: GooglePlaceReviewCacheRecord) => {
  await db.collection(LISTINGS_COLLECTION).doc(record.listingId).set({
    googlePlaceId: record.placeId,
    placeId: record.placeId,
    rating: record.rating ?? 0,
    reviews: record.reviews,
    reviewsCount: record.reviewsCount,
    googleReviewsUpdatedAt: record.updatedAt
  }, { merge: true });
};

export const readListingsForReviewsRefresh = async (maxCount: number) => {
  const listingsSnapshot = await db.collection(LISTINGS_COLLECTION)
    .where('category', '==', 'housing')
    .where('status', '==', 'active')
    .limit(maxCount * 4)
    .get();

  return listingsSnapshot.docs
    .map(item => ({ id: item.id, ...item.data() } as Listing))
    .filter(listing => Boolean(listing.googlePlaceId || listing.placeId || listing.nearbySpots?.[0]?.placeId))
    .slice(0, maxCount);
};

export const readOldestReviewCaches = async (maxCount: number) => {
  const snapshot = await db.collection(GOOGLE_PLACES_CACHE_COLLECTION)
    .orderBy('updatedAt', 'asc')
    .limit(maxCount)
    .get();

  return snapshot.docs.map(item => ({ id: item.id, ...item.data() } as GooglePlaceReviewCacheRecord));
};
