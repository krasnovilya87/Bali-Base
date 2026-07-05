import 'dotenv/config';
import { refreshOldGooglePlaceReviewsBatch } from '../src/server/googlePlacesReviews';

const dailyLimit = Number(process.argv[2] || process.env.GOOGLE_PLACES_MAX_DAILY_CRON_REQUESTS || 300);

refreshOldGooglePlaceReviewsBatch(dailyLimit)
  .then(result => {
    console.log(`[Google Places Reviews Cron] refreshed=${result.refreshed} blocked=${result.blocked} ${result.reason || ''}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('[Google Places Reviews Cron] failed', error);
    process.exit(1);
  });
