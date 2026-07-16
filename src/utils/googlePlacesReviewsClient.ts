import type { Listing } from '../types';

type GooglePlacesRefreshResponse = {
  status: string;
  cache?: {
    rating: number | null;
    reviews: Listing['reviews'];
    reviewsCount: number;
    updatedAt: string;
    placeId: string;
  } | null;
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

export const requestListingCreateGoogleReviewsRefresh = async ({
  listingId,
  placeId,
  googleReviewsUpdatedAt
}: {
  listingId: string;
  placeId?: string;
  googleReviewsUpdatedAt?: string;
}): Promise<GooglePlacesRefreshResponse | null> => {
  if (!placeId || googleReviewsUpdatedAt) return null;

  try {
    const response = await fetch('/api/google-places/reviews/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listingId,
        placeId,
        purpose: 'listing_create'
      })
    });

    if (!response.ok) {
      const message = await response.text();
      console.warn('Google Places reviews refresh failed:', message);
      return null;
    }
    return response.json() as Promise<GooglePlacesRefreshResponse>;
  } catch (error) {
    console.warn('Google Places reviews refresh request was skipped:', error);
    return null;
  }
};
