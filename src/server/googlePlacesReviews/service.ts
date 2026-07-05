import { addDays, GOOGLE_PLACES_REVIEWS_CONFIG } from './config';
import { fetchGooglePlaceReviews } from './placesClient';
import {
  canSpendGooglePlacesRequest,
  logSuccessfulGooglePlacesRequest,
  readReviewCache,
  updateListingWithReviewCache,
  writeReviewCache
} from './firestoreStore';
import type {
  GooglePlaceReview,
  GooglePlaceReviewCacheRecord,
  GooglePlacesRefreshResult,
  GooglePlacesRequestPurpose
} from './types';

const isFresh = (updatedAt: string, now = new Date()) => {
  const updated = new Date(updatedAt);
  if (Number.isNaN(updated.getTime())) return false;
  const ageMs = now.getTime() - updated.getTime();
  return ageMs < GOOGLE_PLACES_REVIEWS_CONFIG.cacheTtlDays * 24 * 60 * 60 * 1000;
};

const mapGoogleReview = (review: any, index: number): GooglePlaceReview => ({
  id: review.name || `google-review-${index}`,
  authorName: review.authorAttribution?.displayName || 'Google user',
  avatar: review.authorAttribution?.photoUri || '',
  rating: Number(review.rating || 0),
  date: review.publishTime || new Date().toISOString(),
  text: review.text?.text || review.originalText?.text || '',
  originalText: review.originalText?.text,
  relativePublishTimeDescription: review.relativePublishTimeDescription
});

const buildCacheRecord = ({
  listingId,
  placeId,
  rating,
  reviews
}: {
  listingId: string;
  placeId: string;
  rating: number | null;
  reviews: GooglePlaceReview[];
}): GooglePlaceReviewCacheRecord => {
  const now = new Date();
  return {
    listingId,
    placeId,
    rating,
    reviews: reviews.slice(0, 5),
    reviewsCount: reviews.length,
    updatedAt: now.toISOString(),
    staleAfter: addDays(now, GOOGLE_PLACES_REVIEWS_CONFIG.cacheTtlDays).toISOString(),
    source: 'google_places_new'
  };
};

export const refreshGooglePlaceReviews = async ({
  listingId,
  placeId,
  purpose
}: {
  listingId: string;
  placeId: string;
  purpose: GooglePlacesRequestPurpose;
}) => {
  const quotaCheck = await canSpendGooglePlacesRequest(purpose);
  const existingCache = await readReviewCache(listingId);

  if (!quotaCheck.allowed) {
    console.warn(`[Google Places Reviews] blocked ${purpose} request for ${listingId}: ${quotaCheck.reason}`);
    return {
      status: 'blocked',
      cache: existingCache,
      warning: quotaCheck.reason
    } satisfies GooglePlacesRefreshResult;
  }

  const data = await fetchGooglePlaceReviews(placeId);
  await logSuccessfulGooglePlacesRequest({ listingId, placeId, purpose });

  const cache = buildCacheRecord({
    listingId,
    placeId: data.id || placeId,
    rating: typeof data.rating === 'number' ? data.rating : null,
    reviews: (data.reviews || []).slice(0, 5).map(mapGoogleReview)
  });

  await writeReviewCache(cache);
  await updateListingWithReviewCache(cache);
  return { status: 'refreshed', cache } satisfies GooglePlacesRefreshResult;
};

export const getGooglePlaceReviewsForListing = async ({
  listingId,
  placeId,
  purpose = 'background',
  allowBackgroundRefresh = true
}: {
  listingId: string;
  placeId?: string;
  purpose?: GooglePlacesRequestPurpose;
  allowBackgroundRefresh?: boolean;
}): Promise<GooglePlacesRefreshResult> => {
  const cache = await readReviewCache(listingId);

  if (cache && isFresh(cache.updatedAt)) {
    return { status: 'cache_hit', cache };
  }

  if (!placeId) {
    return {
      status: 'missing_place_id',
      cache,
      warning: 'Listing has no Google place_id, so Google API was not called'
    };
  }

  if (cache && allowBackgroundRefresh && purpose === 'background') {
    refreshGooglePlaceReviews({ listingId, placeId, purpose }).catch(error => {
      console.error(`[Google Places Reviews] background refresh failed for ${listingId}`, error);
    });
    return { status: 'scheduled', cache };
  }

  return refreshGooglePlaceReviews({ listingId, placeId, purpose });
};
