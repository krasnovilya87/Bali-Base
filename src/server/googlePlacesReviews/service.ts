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
  userRatingCount,
  reviews
}: {
  listingId: string;
  placeId: string;
  rating: number | null;
  userRatingCount?: number;
  reviews: GooglePlaceReview[];
}): GooglePlaceReviewCacheRecord => {
  const now = new Date();
  return {
    listingId,
    placeId,
    rating,
    reviews: reviews.slice(0, 5),
    reviewsCount: typeof userRatingCount === 'number' ? userRatingCount : reviews.length,
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
  const existingCache = await readReviewCache(listingId);

  if (existingCache) {
    return {
      status: 'cache_hit',
      cache: existingCache,
      warning: 'Google reviews were already captured for this listing; no new Google API request was made'
    } satisfies GooglePlacesRefreshResult;
  }

  if (purpose !== 'listing_create') {
    return {
      status: 'blocked',
      cache: null,
      warning: 'Google reviews can only be requested once during listing creation'
    } satisfies GooglePlacesRefreshResult;
  }

  const quotaCheck = await canSpendGooglePlacesRequest(purpose);

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
    userRatingCount: data.userRatingCount,
    reviews: (data.reviews || []).slice(0, 5).map(mapGoogleReview)
  });

  await writeReviewCache(cache);
  await updateListingWithReviewCache(cache);
  return { status: 'refreshed', cache } satisfies GooglePlacesRefreshResult;
};

export const getGooglePlaceReviewsForListing = async ({
  listingId,
  placeId,
  purpose = 'background'
}: {
  listingId: string;
  placeId?: string;
  purpose?: GooglePlacesRequestPurpose;
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

  if (purpose !== 'listing_create') {
    return {
      status: cache ? 'cache_hit' : 'blocked',
      cache,
      warning: 'Automatic Google reviews refresh is disabled; reviews are captured only once during listing creation'
    };
  }

  return refreshGooglePlaceReviews({ listingId, placeId, purpose });
};
