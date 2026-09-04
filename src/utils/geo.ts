import { Listing } from '../types';
import areaGeoJSONSource from '../../area.geojson?raw';

type MapPoint = { x: number; y: number };
type GeoPoint = { lat: number; lng: number };
type GeoRing = GeoPoint[];
type GeoPolygon = GeoRing[];
type GeoFeatureAccumulator = { lat: number; lng: number; count: number };
type GeoBounds = { south: number; west: number; north: number; east: number };
type GeoFeature = {
  name: string;
  polygons: GeoPolygon[];
  centroid: GeoPoint;
  bounds: GeoBounds;
};

export type DistrictCoordMap = Record<string, MapPoint>;

export const isPointInPolygon = (point: MapPoint, polygon: MapPoint[]) => {
  let inside = false;
  const x = point.x;
  const y = point.y;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

export const DEFAULT_BALI_CENTER: GeoPoint = { lat: -8.4095, lng: 115.1889 };
const latLngToSvgPoint = (coords: GeoPoint): MapPoint => ({
  x: Math.round(446.688 * coords.lng - 51241.25),
  y: Math.round(-515.132 * coords.lat - 4214.91)
});

export const svgPointToLatLng = (point: MapPoint): GeoPoint => ({
  lat: -((point.y + 4214.91) / 515.132),
  lng: (point.x + 51241.25) / 446.688
});

const normalizeDistrictKey = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const POPULAR_DISTRICT_ORDER = [
  'Canggu',
  'Seminyak',
  'Kuta',
  'Ubud',
  'Sanur',
  'Uluwatu',
  'Jimbaran',
  'Nusa Dua',
  'Ungasan',
  'Denpasar',
  'Seseh',
  'Amed',
  'Kintamani',
  'Lovina',
  'Nusa Penida',
  'Lembongan',
  'Ceningan',
  'Gili Trawangan',
  'Gili Air',
  'Gili Meno',
  'Kerobokan'
];

const districtPopularityRank = (district: string) => {
  const normalizedDistrict = normalizeDistrictKey(district);
  const rank = POPULAR_DISTRICT_ORDER.findIndex(item => normalizeDistrictKey(item) === normalizedDistrict);
  return rank === -1 ? POPULAR_DISTRICT_ORDER.length : rank;
};

export const sortDistrictsByPopularity = (districts: string[]) =>
  [...districts].sort((a, b) => {
    const rankDiff = districtPopularityRank(a) - districtPopularityRank(b);
    return rankDiff || a.localeCompare(b);
  });

const formatDistrictName = (value: string) =>
  (value.trim().toLowerCase() === 'jimburan' ? 'jimbaran' : value)
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const toGeoPolygon = (coordinates: number[][][]): GeoPolygon => {
  return coordinates.map(ring =>
    ring.map(([lng, lat]) => ({
      lat,
      lng
    }))
  );
};

const readPolygonRings = (coordinates: any): GeoPolygon[] => {
  if (!Array.isArray(coordinates)) return [];
  if (!Array.isArray(coordinates[0])) return [];

  // Polygon: [ring, ring...], MultiPolygon: [[ring...], [ring...]]
  if (Array.isArray(coordinates[0][0]) && Array.isArray(coordinates[0][0][0])) {
    return (coordinates as number[][][][]).map(polygon => toGeoPolygon(polygon));
  }

  return [toGeoPolygon(coordinates as number[][][])];
};

const pointInRing = (point: GeoPoint, ring: GeoRing): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = [ring[i].lng, ring[i].lat];
    const [xj, yj] = [ring[j].lng, ring[j].lat];
    const intersect =
      ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < ((xj - xi) * (point.lat - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const pointInPolygon = (point: GeoPoint, polygon: GeoPolygon): boolean => {
  if (!polygon.length || !polygon[0].length) return false;
  if (!pointInRing(point, polygon[0])) return false;

  // Treat subsequent rings as holes if present.
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(point, polygon[i])) return false;
  }
  return true;
};

const boundsFromPolygons = (polygons: GeoPolygon[]): GeoBounds => {
  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;

  polygons.forEach(polygon => {
    polygon.forEach(ring => {
      ring.forEach(point => {
        south = Math.min(south, point.lat);
        west = Math.min(west, point.lng);
        north = Math.max(north, point.lat);
        east = Math.max(east, point.lng);
      });
    });
  });

  if (!Number.isFinite(south) || !Number.isFinite(west) || !Number.isFinite(north) || !Number.isFinite(east)) {
    return {
      south: DEFAULT_BALI_CENTER.lat - 0.01,
      west: DEFAULT_BALI_CENTER.lng - 0.01,
      north: DEFAULT_BALI_CENTER.lat + 0.01,
      east: DEFAULT_BALI_CENTER.lng + 0.01
    };
  }

  return { south, west, north, east };
};

const districtFeaturesCache: GeoFeature[] = [];
let districtCoordMapCache: DistrictCoordMap = {};
let districtCentroidCache: Record<string, GeoPoint> = {};
let districtFeaturesLoadingPromise: Promise<GeoFeature[]> | null = null;

const readAreaGeoJSON = () => {
  if (typeof areaGeoJSONSource === 'string') {
    return JSON.parse(areaGeoJSONSource) as any;
  }
  return areaGeoJSONSource as any;
};

const buildDistrictFeaturesFromGeoJSON = async (): Promise<GeoFeature[]> => {
  try {
    const geoJSON = readAreaGeoJSON();
    const features: GeoFeature[] = [];
    const coordMap: DistrictCoordMap = {};
    const centroidMap: Record<string, GeoPoint> = {};

    if (geoJSON.features && Array.isArray(geoJSON.features)) {
      geoJSON.features.forEach((feature: any) => {
        const rawName = feature.properties?.name;
        const polygons = readPolygonRings(feature.geometry?.coordinates);
        if (!rawName || polygons.length === 0) return;

        const centroids = polygons.map((polygon: GeoPolygon) => {
          const outerRing = polygon[0];
          if (!outerRing?.length) return null;
          const sum = outerRing.reduce<GeoFeatureAccumulator>(
            (acc, point) => {
              acc.lat += point.lat;
              acc.lng += point.lng;
              acc.count += 1;
              return acc;
            },
            { lat: 0, lng: 0, count: 0 }
          );

          if (sum.count === 0) return null;
          return { lat: sum.lat / sum.count, lng: sum.lng / sum.count };
        }).filter(Boolean) as GeoPoint[];

        const centroid = centroids.length > 0
          ? centroids.reduce(
              (acc, item) => ({ lat: acc.lat + item.lat, lng: acc.lng + item.lng }),
              { lat: 0, lng: 0 }
            )
          : DEFAULT_BALI_CENTER;

        const normalizedCentroid = centroids.length > 0
          ? { lat: centroid.lat / centroids.length, lng: centroid.lng / centroids.length }
          : DEFAULT_BALI_CENTER;

        const name = formatDistrictName(rawName);
        coordMap[name] = latLngToSvgPoint(normalizedCentroid);
        centroidMap[name] = normalizedCentroid;
        features.push({
          name,
          polygons,
          centroid: normalizedCentroid,
          bounds: boundsFromPolygons(polygons)
        });
      });
    }

    districtCoordMapCache = coordMap;
    districtCentroidCache = centroidMap;
    return features;
  } catch (error) {
    console.warn('Failed to load GeoJSON:', error);
    return [];
  }
};

const ensureDistrictFeatures = async (): Promise<GeoFeature[]> => {
  if (districtFeaturesCache.length > 0) return districtFeaturesCache;
  if (!districtFeaturesLoadingPromise) {
    districtFeaturesLoadingPromise = buildDistrictFeaturesFromGeoJSON();
  }
  const features = await districtFeaturesLoadingPromise;
  districtFeaturesCache.splice(0, districtFeaturesCache.length, ...features);
  return districtFeaturesCache;
};

const ensureDistrictFeaturesSync = (): GeoFeature[] => {
  if (districtFeaturesCache.length > 0) return districtFeaturesCache;

  try {
    const geoJSON = readAreaGeoJSON();
    const features: GeoFeature[] = [];
    const coordMap: DistrictCoordMap = {};
    const centroidMap: Record<string, GeoPoint> = {};

    if (geoJSON.features && Array.isArray(geoJSON.features)) {
      geoJSON.features.forEach((feature: any) => {
        const rawName = feature.properties?.name;
        const polygons = readPolygonRings(feature.geometry?.coordinates);
        if (!rawName || polygons.length === 0) return;

        const centroids = polygons.map((polygon: GeoPolygon) => {
          const outerRing = polygon[0];
          if (!outerRing?.length) return null;
          const sum = outerRing.reduce<GeoFeatureAccumulator>(
            (acc, point) => {
              acc.lat += point.lat;
              acc.lng += point.lng;
              acc.count += 1;
              return acc;
            },
            { lat: 0, lng: 0, count: 0 }
          );

          if (sum.count === 0) return null;
          return { lat: sum.lat / sum.count, lng: sum.lng / sum.count };
        }).filter(Boolean) as GeoPoint[];

        const centroid = centroids.length > 0
          ? centroids.reduce(
              (acc, item) => ({ lat: acc.lat + item.lat, lng: acc.lng + item.lng }),
              { lat: 0, lng: 0 }
            )
          : DEFAULT_BALI_CENTER;

        const normalizedCentroid = centroids.length > 0
          ? { lat: centroid.lat / centroids.length, lng: centroid.lng / centroids.length }
          : DEFAULT_BALI_CENTER;

        const name = formatDistrictName(rawName);
        coordMap[name] = latLngToSvgPoint(normalizedCentroid);
        centroidMap[name] = normalizedCentroid;
        features.push({
          name,
          polygons,
          centroid: normalizedCentroid,
          bounds: boundsFromPolygons(polygons)
        });
      });
    }

    districtCoordMapCache = coordMap;
    districtCentroidCache = centroidMap;
    districtFeaturesCache.splice(0, districtFeaturesCache.length, ...features);
  } catch (error) {
    console.warn('Failed to load GeoJSON:', error);
  }

  return districtFeaturesCache;
};

const getCachedDistrictFeatures = () => ensureDistrictFeaturesSync();

const findFeatureByDistrictName = (districtName: string) => {
  const features = ensureDistrictFeaturesSync();
  const normalized = normalizeDistrictKey(districtName);
  return features.find(feature => {
    const key = normalizeDistrictKey(feature.name);
    return normalized === key || normalized.includes(key) || key.includes(normalized);
  }) || null;
};

export const getDistrictNamesFromGeoJSON = async (): Promise<string[]> => {
  const features = await ensureDistrictFeatures();
  return features.map(feature => feature.name);
};

export const getDistrictNamesFromGeoJSONSync = (): string[] => {
  return ensureDistrictFeaturesSync().map(feature => feature.name);
};

export const getDefaultDistrictNameSync = (): string => {
  return ensureDistrictFeaturesSync()[0]?.name || '';
};

export const getDefaultDistrictCoordsSync = (): GeoPoint => {
  return ensureDistrictFeaturesSync()[0]?.centroid || DEFAULT_BALI_CENTER;
};

export const getDistrictCoordMap = async (): Promise<DistrictCoordMap> => {
  await ensureDistrictFeatures();
  return districtCoordMapCache;
};

export const getDistrictCoordMapSync = (): DistrictCoordMap => {
  ensureDistrictFeaturesSync();
  return districtCoordMapCache;
};

export const findDistrictByCoords = async (lat: number, lng: number): Promise<string | null> => {
  const features = await ensureDistrictFeatures();
  const point = { lat, lng };

  for (const feature of features) {
    if (feature.polygons.some(polygon => pointInPolygon(point, polygon))) {
      return feature.name;
    }
  }

  return null;
};

export const findDistrictByCoordsSync = (lat: number, lng: number): string | null => {
  const features = getCachedDistrictFeatures();
  if (features.length === 0) return null;

  const point = { lat, lng };
  for (const feature of features) {
    if (feature.polygons.some(polygon => pointInPolygon(point, polygon))) {
      return feature.name;
    }
  }

  return null;
};

export const findDistrictByMapPointSync = (point: MapPoint): string | null => {
  const coords = svgPointToLatLng(point);
  return findDistrictByCoordsSync(coords.lat, coords.lng);
};

export const getDistrictBoundsSync = (districtName: string): GeoBounds | null => {
  if (!districtName) return null;
  const feature = findFeatureByDistrictName(districtName);
  return feature?.bounds || null;
};

export const getDistrictBounds = async (districtName: string): Promise<GeoBounds | null> => {
  if (!districtName) return null;
  const features = await ensureDistrictFeatures();
  const normalized = normalizeDistrictKey(districtName);
  const feature = features.find(item => {
    const key = normalizeDistrictKey(item.name);
    return normalized === key || normalized.includes(key) || key.includes(normalized);
  });
  return feature?.bounds || null;
};

export const getDistrictCoords = async (districtName: string): Promise<GeoPoint> => {
  if (!districtName) return DEFAULT_BALI_CENTER;
  const normalized = normalizeDistrictKey(districtName);

  const features = await ensureDistrictFeatures();
  const feature = features.find(item => {
    const key = normalizeDistrictKey(item.name);
    return normalized === key || normalized.includes(key) || key.includes(normalized);
  });
  if (feature) {
    return feature.centroid;
  }

  return DEFAULT_BALI_CENTER;
};

export const getDistrictCoordsSync = (districtName: string): GeoPoint => {
  if (!districtName) return DEFAULT_BALI_CENTER;
  ensureDistrictFeaturesSync();
  const normalized = normalizeDistrictKey(districtName);

  for (const [key, coords] of Object.entries(districtCentroidCache)) {
    if (normalized === key || normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }

  return DEFAULT_BALI_CENTER;
};

export const getListingCoords = (item: Listing): { lat: number; lng: number } => {
  const readNumber = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };

  const readCoords = (value: any): { lat: number; lng: number } | undefined => {
    if (!value || typeof value !== 'object') return undefined;

    const lat = readNumber(value.lat ?? value.latitude ?? value._lat);
    const lng = readNumber(value.lng ?? value.lon ?? value.longitude ?? value._long);
    if (lat === undefined || lng === undefined) return undefined;
    return { lat, lng };
  };

  const directCoords = readCoords((item as any).locationCoords);
  if (directCoords) {
    return directCoords;
  }

  const alternateCoords =
    readCoords((item as any).coords) ||
    readCoords((item as any).coordinates) ||
    readCoords((item as any).location);
  if (alternateCoords) {
    return alternateCoords;
  }

  const topLevelLat = readNumber((item as any).lat ?? (item as any).latitude);
  const topLevelLng = readNumber((item as any).lng ?? (item as any).lon ?? (item as any).longitude);
  if (topLevelLat !== undefined && topLevelLng !== undefined) {
    return { lat: topLevelLat, lng: topLevelLng };
  }

  const base = getDistrictCoordsSync(item.district);

  // Create repeatable, deterministic layout jitter so pins are spread in the area
  const hash = (str: string) => {
    let t = 0;
    for (let i = 0; i < str.length; i++) {
      t = (t << 5) - t + str.charCodeAt(i);
      t |= 0;
    }
    return Math.abs(t);
  };

  const hId = hash(item.id);
  const jitterLat = ((hId % 41) / 1100) - 0.018; // range: approx -0.018 to +0.018
  const jitterLng = (((hId >> 2) % 41) / 1100) - 0.018;
  return {
    lat: base.lat + jitterLat,
    lng: base.lng + jitterLng
  };
};

void ensureDistrictFeatures();

export const getHaversineDistance = (
  c1: { lat: number; lng: number },
  c2: { lat: number; lng: number }
): number => {
  const R = 6371; // radius of Earth in km
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
    Math.cos((c2.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
