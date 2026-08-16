import type { Listing } from '../types';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db, getDocument } from '../firebase';

type GooglePlacesRefreshResponse = {
  status: string;
  cache?: {
    rating: number | null;
    reviews: Listing['reviews'];
    reviewsCount: number;
    updatedAt: string;
    placeId: string;
  } | null;
  warning?: string;
  error?: string;
};

const getGooglePlacesReviewsApiUrl = () => {
  const apiBaseUrl =
    (import.meta as any).env?.VITE_API_BASE_URL ||
    (globalThis as any).BALI_BASE_API_URL ||
    '';

  return `${String(apiBaseUrl).replace(/\/$/, '')}/api/google-places/reviews/refresh`;
};

export const applyGoogleReviewsCacheToListing = (
  listing: Listing,
  response: GooglePlacesRefreshResponse | null
): Listing => {
  const cache = response?.cache;
  if (!cache || response?.status === 'blocked') return listing;

  return {
    ...listing,
    googlePlaceId: cache.placeId,
    placeId: cache.placeId,
    rating: typeof cache.rating === 'number' ? cache.rating : listing.rating,
    reviews: Array.isArray(cache.reviews) ? cache.reviews : listing.reviews,
    reviewsCount: typeof cache.reviewsCount === 'number' ? cache.reviewsCount : listing.reviewsCount,
    googleReviewsUpdatedAt: cache.updatedAt
  };
};

export const readGoogleReviewsCacheForListing = async (listingId: string): Promise<GooglePlacesRefreshResponse | null> => {
  if (!listingId) return null;
  const cache = await getDocument<NonNullable<GooglePlacesRefreshResponse['cache']>>('google_places_review_cache', listingId);
  if (!cache) return null;

  return {
    status: 'cache_hit',
    cache
  };
};

export const readGoogleReviewsCacheForPlace = async (placeId: string): Promise<GooglePlacesRefreshResponse | null> => {
  if (!placeId) return null;

  const cacheQuery = query(
    collection(db, 'google_places_review_cache'),
    where('placeId', '==', placeId),
    limit(1)
  );
  const snapshot = await getDocs(cacheQuery);
  const cacheDoc = snapshot.docs[0];
  if (!cacheDoc) return null;

  return {
    status: 'cache_hit',
    cache: cacheDoc.data() as NonNullable<GooglePlacesRefreshResponse['cache']>
  };
};

export const readGoogleReviewsCacheForListingOrPlace = async (listing: Listing): Promise<GooglePlacesRefreshResponse | null> => {
  const listingCache = await readGoogleReviewsCacheForListing(listing.id);
  if (listingCache?.cache) return listingCache;

  const placeId = listing.googlePlaceId || listing.placeId;
  return placeId ? readGoogleReviewsCacheForPlace(placeId) : null;
};

export const requestListingCreateGoogleReviewsRefresh = async ({
  listingId,
  placeId,
  googleReviewsUpdatedAt,
  purpose = 'listing_create'
}: {
  listingId: string;
  placeId?: string;
  googleReviewsUpdatedAt?: string;
  purpose?: 'listing_create' | 'listing_update';
}): Promise<GooglePlacesRefreshResponse | null> => {
  if (!placeId || (googleReviewsUpdatedAt && purpose === 'listing_create')) return null;

  try {
    const response = await fetch(getGooglePlacesReviewsApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listingId,
        placeId,
        purpose
      })
    });

    if (!response.ok) {
      const message = await response.text();
      console.warn('Google Places reviews refresh failed:', response.status, message);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const message = await response.text();
      console.warn('Google Places reviews refresh returned a non-JSON response:', message.slice(0, 300));
      return null;
    }

    const result = await response.json() as GooglePlacesRefreshResponse;
    if (result.warning || result.error) {
      console.warn('Google Places reviews refresh warning:', result.warning || result.error);
    }
    return result;
  } catch (error) {
    console.warn('Google Places reviews refresh request was skipped:', error);
    return null;
  }
};
