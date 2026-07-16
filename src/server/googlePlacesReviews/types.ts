import type { Review } from '../../types';

export type GooglePlacesRequestPurpose = 'listing_create' | 'manual' | 'background';

export type GooglePlaceReview = Review & {
  relativePublishTimeDescription?: string;
  originalText?: string;
};

export type GooglePlaceReviewCacheRecord = {
  id?: string;
  listingId: string;
  placeId: string;
  rating: number | null;
  reviews: GooglePlaceReview[];
  reviewsCount: number;
  updatedAt: string;
  staleAfter: string;
  source: 'google_places_new';
};

export type GooglePlacesUsageRecord = {
  id?: string;
  monthKey: string;
  successfulRequests: number;
  hardLimit: number;
  creationReserve: number;
  backgroundLimit: number;
  estimatedFreeRequests: number;
  updatedAt: string;
};

export type GooglePlacesQuotaSnapshot = GooglePlacesUsageRecord & {
  remainingBeforeHardLimit: number;
  remainingForBackground: number;
  remainingEstimatedFreeRequests: number;
};

export type GooglePlacesRefreshResult = {
  status: 'cache_hit' | 'refreshed' | 'blocked' | 'missing_place_id' | 'error';
  cache: GooglePlaceReviewCacheRecord | null;
  warning?: string;
};
