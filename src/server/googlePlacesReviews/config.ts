export const GOOGLE_PLACES_REVIEWS_FIELD_MASK = 'id,rating,userRatingCount,reviews';

export const GOOGLE_PLACES_REVIEWS_CONFIG = {
  cacheTtlDays: Number(process.env.GOOGLE_PLACES_REVIEWS_CACHE_TTL_DAYS || 14),
  maxMonthlyRequests: Number(process.env.GOOGLE_PLACES_MAX_MONTHLY_REQUESTS || 9500),
  creationRequestReserve: Number(process.env.GOOGLE_PLACES_CREATION_REQUEST_RESERVE || 500),
  estimatedFreeMonthlyRequests: Number(process.env.GOOGLE_PLACES_ESTIMATED_FREE_REQUESTS || 10000),
  maxDailyCronRequests: Number(process.env.GOOGLE_PLACES_MAX_DAILY_CRON_REQUESTS || 300)
} as const;

export const getCurrentMonthKey = (date = new Date()) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};
