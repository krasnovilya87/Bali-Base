import { GOOGLE_PLACES_REVIEWS_CONFIG } from './config';
import { canSpendGooglePlacesRequest, readListingsForReviewsRefresh, readOldestReviewCaches } from './firestoreStore';
import { refreshGooglePlaceReviews } from './service';

const getListingPlaceId = (listing: any) =>
  listing.googlePlaceId || listing.placeId || listing.nearbySpots?.[0]?.placeId || '';

export const refreshOldGooglePlaceReviewsBatch = async (
  maxRequests = GOOGLE_PLACES_REVIEWS_CONFIG.maxDailyCronRequests
) => {
  const quota = await canSpendGooglePlacesRequest('background');
  if (!quota.allowed) {
    console.warn(`[Google Places Reviews Cron] blocked: ${quota.reason}`);
    return { refreshed: 0, blocked: true, reason: quota.reason };
  }

  const budget = Math.min(maxRequests, quota.quota.remainingForBackground);
  const cached = await readOldestReviewCaches(budget);
  const listings = await readListingsForReviewsRefresh(Math.max(0, budget - cached.length));

  const candidates = [
    ...cached.map(item => ({ listingId: item.listingId, placeId: item.placeId })),
    ...listings.map(listing => ({ listingId: listing.id, placeId: getListingPlaceId(listing) }))
  ]
    .filter(item => item.placeId)
    .slice(0, budget);

  let refreshed = 0;
  for (const candidate of candidates) {
    const currentQuota = await canSpendGooglePlacesRequest('background');
    if (!currentQuota.allowed) break;

    const result = await refreshGooglePlaceReviews({
      listingId: candidate.listingId,
      placeId: candidate.placeId,
      purpose: 'background'
    });

    if (result.status === 'refreshed') refreshed += 1;
  }

  return { refreshed, blocked: false, reason: '' };
};
