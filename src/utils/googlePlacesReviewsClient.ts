import type { Listing } from '../types';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db, getDocument } from '../firebase';
import { ensureGoogleMapsLibraries } from './googleMapsLoader';

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

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
    const maps = await ensureGoogleMapsLibraries(GOOGLE_MAPS_API_KEY, ['places']);
    if (!maps.places?.Place) return null;

    const place = new maps.places.Place({ id: placeId });
    await place.fetchFields({
      fields: ['id', 'rating', 'userRatingCount', 'reviews']
    });

    const updatedAt = new Date().toISOString();
    const reviews = (place.reviews || []).slice(0, 5).map((review: any, index: number) => ({
      id: review.name || `google-review-${listingId}-${index}`,
      authorName: review.authorAttribution?.displayName || 'Google user',
      avatar: review.authorAttribution?.photoURI || '',
      rating: Number(review.rating || 0),
      date: review.publishTime instanceof Date
        ? review.publishTime.toISOString()
        : String(review.publishTime || updatedAt),
      text: typeof review.text === 'string' ? review.text : '',
      textLanguageCode: review.textLanguageCode,
      originalText: typeof review.originalText === 'string' ? review.originalText : undefined,
      originalLanguageCode: review.originalTextLanguageCode,
      relativePublishTimeDescription: review.relativePublishTimeDescription
    }));

    return {
      status: purpose === 'listing_update' ? 'updated' : 'refreshed',
      cache: {
        rating: typeof place.rating === 'number' ? place.rating : null,
        reviews,
        reviewsCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : reviews.length,
        updatedAt,
        placeId: place.id || placeId
      }
    };
  } catch (error) {
    console.warn('Google Places reviews refresh failed:', error);
    return null;
  }
};
