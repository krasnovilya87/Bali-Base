import { getDocument } from '../firebase';

export type GooglePlacesQuotaAdminStats = {
  monthKey: string;
  successfulRequests: number;
  hardLimit: number;
  creationReserve: number;
  backgroundLimit: number;
  estimatedFreeRequests: number;
  remainingBeforeHardLimit: number;
  remainingForBackground: number;
  remainingEstimatedFreeRequests: number;
};

const getCurrentMonthKey = (date = new Date()) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

const buildDefaultStats = (monthKey = getCurrentMonthKey()): GooglePlacesQuotaAdminStats => {
  const hardLimit = 9500;
  const creationReserve = 500;
  const successfulRequests = 0;
  const estimatedFreeRequests = 10000;

  return {
    monthKey,
    successfulRequests,
    hardLimit,
    creationReserve,
    backgroundLimit: hardLimit - creationReserve,
    estimatedFreeRequests,
    remainingBeforeHardLimit: hardLimit - successfulRequests,
    remainingForBackground: hardLimit - creationReserve - successfulRequests,
    remainingEstimatedFreeRequests: estimatedFreeRequests - successfulRequests
  };
};

export const loadGooglePlacesQuotaAdminStats = async () => {
  const monthKey = getCurrentMonthKey();
  const stored = await getDocument<Partial<GooglePlacesQuotaAdminStats>>('google_places_api_usage', monthKey);
  const merged = { ...buildDefaultStats(monthKey), ...stored };

  return {
    ...merged,
    remainingBeforeHardLimit: Math.max(0, (merged.hardLimit || 0) - (merged.successfulRequests || 0)),
    remainingForBackground: Math.max(0, (merged.backgroundLimit || 0) - (merged.successfulRequests || 0)),
    remainingEstimatedFreeRequests: Math.max(0, (merged.estimatedFreeRequests || 0) - (merged.successfulRequests || 0))
  };
};
