import { firebaseAdminApp } from '../firebaseAdmin';
import firebaseConfig from '../../config/firebaseConfig';

// Real Google Maps Platform request counts for the current month, read from Cloud Monitoring.
// Free monthly caps are per SKU since March 2025 (Essentials 10,000 / Pro 5,000 / Enterprise 1,000);
// the mapping below is an estimate and should be checked against the Google billing console.

type UsageRule = { label: string; freeCap: number; match: (service: string, method: string) => boolean };

const USAGE_RULES: UsageRule[] = [
  { label: 'Maps JavaScript (map loads)', freeCap: 10000, match: service => service === 'maps-backend.googleapis.com' },
  // Investments search without `rating` (Pro, 5,000 free); housing still asks for it and bills
  // as Enterprise (1,000 free). Monitoring cannot tell them apart, so the Pro cap is shown.
  { label: 'Places: nearby search', freeCap: 5000, match: (service, method) => service.startsWith('places') && /searchnearby/i.test(method) },
  { label: 'Places: text search', freeCap: 1000, match: (service, method) => service.startsWith('places') && /searchtext|textsearch|findplace/i.test(method) },
  // Place details with reviews bill as Enterprise + Atmosphere.
  { label: 'Places: place details', freeCap: 1000, match: (service, method) => service.startsWith('places') && /getplace|details/i.test(method) },
  { label: 'Places: other', freeCap: 5000, match: service => service.startsWith('places') },
  { label: 'Directions', freeCap: 10000, match: service => service === 'directions-backend.googleapis.com' },
  { label: 'Distance Matrix', freeCap: 10000, match: service => service === 'distance-matrix-backend.googleapis.com' },
  { label: 'Routes', freeCap: 10000, match: service => service === 'routes.googleapis.com' },
  { label: 'Geocoding', freeCap: 10000, match: service => service === 'geocoding-backend.googleapis.com' }
];

export type GoogleUsageRow = { label: string; count: number; freeCap: number };

const monthStart = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

export const loadGoogleMapsUsage = async (now = new Date()) => {
  const { access_token: accessToken } = await firebaseAdminApp.options.credential!.getAccessToken();
  const start = monthStart(now);
  const params = new URLSearchParams({
    filter: 'metric.type="serviceruntime.googleapis.com/api/request_count" AND resource.type="consumed_api"',
    'interval.startTime': start.toISOString(),
    'interval.endTime': now.toISOString(),
    'aggregation.alignmentPeriod': `${Math.max(60, Math.ceil((now.getTime() - start.getTime()) / 1000))}s`,
    'aggregation.perSeriesAligner': 'ALIGN_SUM',
    'aggregation.crossSeriesReducer': 'REDUCE_SUM'
  });
  params.append('aggregation.groupByFields', 'resource.label.service');
  params.append('aggregation.groupByFields', 'resource.label.method');

  const response = await fetch(
    `https://monitoring.googleapis.com/v3/projects/${firebaseConfig.projectId}/timeSeries?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const payload: any = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error?.message || `Cloud Monitoring returned ${response.status}`);

  const counts = new Map<string, number>(USAGE_RULES.map(rule => [rule.label, 0]));
  for (const series of payload?.timeSeries || []) {
    const service = String(series.resource?.labels?.service || '');
    const method = String(series.resource?.labels?.method || '');
    const rule = USAGE_RULES.find(item => item.match(service, method));
    if (!rule) continue;
    const total = (series.points || []).reduce((sum: number, point: any) => sum + Number(point.value?.int64Value || 0), 0);
    counts.set(rule.label, (counts.get(rule.label) || 0) + total);
  }

  const rows: GoogleUsageRow[] = USAGE_RULES
    .map(rule => ({ label: rule.label, count: counts.get(rule.label) || 0, freeCap: rule.freeCap }))
    .filter(row => row.count > 0 || !row.label.endsWith('other'));
  return { monthStart: start.toISOString(), updatedAt: now.toISOString(), rows };
};
