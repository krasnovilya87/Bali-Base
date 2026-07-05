import { Listing } from '../types';

// Compute centroid of a polygon
const computePolygonCentroid = (coordinates: number[][][]): { lat: number; lng: number } => {
  let sumLat = 0, sumLng = 0, count = 0;
  coordinates[0].forEach(([lng, lat]) => {
    sumLng += lng;
    sumLat += lat;
    count++;
  });
  return {
    lat: sumLat / count,
    lng: sumLng / count
  };
};

// Build DISTRICT_COORDS from area.geojson
const buildDistrictCoordsFromGeoJSON = async (): Promise<{ [key: string]: { lat: number; lng: number } }> => {
  const coords: { [key: string]: { lat: number; lng: number } } = {};
  try {
    const response = await fetch('/area.geojson');
    const geoJSON = await response.json();
    if (geoJSON.features && Array.isArray(geoJSON.features)) {
      geoJSON.features.forEach((feature: any) => {
        if (feature.properties?.name && feature.geometry?.type === 'Polygon') {
          const key = feature.properties.name.toLowerCase();
          coords[key] = computePolygonCentroid(feature.geometry.coordinates);
        }
      });
    }
  } catch (error) {
    console.warn('Failed to load GeoJSON:', error);
  }
  return coords;
};

// Fallback coordinates for immediate loading
const FALLBACK_COORDS: { [key: string]: { lat: number; lng: number } } = {
  'canggu': { lat: -8.6481, lng: 115.1385 },
  'ubud': { lat: -8.5069, lng: 115.2625 },
  'seminyak': { lat: -8.6913, lng: 115.1582 },
  'uluwatu': { lat: -8.8290, lng: 115.0860 },
  'sanur': { lat: -8.6806, lng: 115.2635 },
  'nusa dua': { lat: -8.8028, lng: 115.2155 },
  'kuta': { lat: -8.7228, lng: 115.1772 },
  'jimbaran': { lat: -8.7758, lng: 115.1764 },
  'amed': { lat: -8.3375, lng: 115.6534 },
  'lovina': { lat: -8.1574, lng: 115.0258 }
};

// Cache for loaded coordinates
let districtCoordsCache: { [key: string]: { lat: number; lng: number } } | null = null;
let coordsLoadingPromise: Promise<{ [key: string]: { lat: number; lng: number } }> | null = null;

export const getDistrictCoords = async (districtName: string): Promise<{ lat: number; lng: number }> => {
  if (!districtName) return { lat: -8.4095, lng: 115.1889 };
  const normalized = districtName.trim().toLowerCase();

  // Use cache if available
  if (districtCoordsCache !== null) {
    for (const [key, coords] of Object.entries(districtCoordsCache)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return coords;
      }
    }
  }

  // Load if not loading and no cache
  if (coordsLoadingPromise === null) {
    coordsLoadingPromise = buildDistrictCoordsFromGeoJSON();
  }

  districtCoordsCache = await coordsLoadingPromise;

  // Check loaded coordinates
  for (const [key, coords] of Object.entries(districtCoordsCache)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }

  // Fallback to hardcoded
  for (const [key, coords] of Object.entries(FALLBACK_COORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }

  return { lat: -8.4095, lng: 115.1889 }; // default center of Bali
};

// Synchronous version for backwards compatibility - returns fallback
export const getDistrictCoordsSync = (districtName: string): { lat: number; lng: number } => {
  if (!districtName) return { lat: -8.4095, lng: 115.1889 };
  const normalized = districtName.trim().toLowerCase();

  // Use cache if available
  if (districtCoordsCache !== null) {
    for (const [key, coords] of Object.entries(districtCoordsCache)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return coords;
      }
    }
  }

  // Use fallback
  for (const [key, coords] of Object.entries(FALLBACK_COORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }

  return { lat: -8.4095, lng: 115.1889 };
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
