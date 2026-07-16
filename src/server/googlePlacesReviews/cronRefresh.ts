export const refreshOldGooglePlaceReviewsBatch = async (_maxRequests = 0) => {
  console.warn('[Google Places Reviews Cron] disabled: reviews are captured only once during listing creation');
  return {
    refreshed: 0,
    blocked: true,
    reason: 'Automatic Google reviews refresh is disabled'
  };
};
