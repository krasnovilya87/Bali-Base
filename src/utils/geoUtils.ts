import { Listing } from '../types';

export const DISTRICT_COORDS: { [key: string]: { lat: number; lng: number } } = {
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

export const getDistrictCoords = (districtName: string): { lat: number; lng: number } => {
  if (!districtName) return { lat: -8.4095, lng: 115.1889 };
  const normalized = districtName.trim().toLowerCase();
  for (const [key, coords] of Object.entries(DISTRICT_COORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }
  return { lat: -8.4095, lng: 115.1889 }; // default center of Bali
};

export const getListingCoords = (item: Listing): { lat: number; lng: number } => {
  const base = getDistrictCoords(item.district);
  
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
