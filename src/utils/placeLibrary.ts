import { getHaversineDistance } from './geoUtils';

export type PlaceLibraryCategory = 'restaurants' | 'sport' | 'supermarkets' | 'attractions' | 'beaches';

export type PlaceLibraryItem = {
  id: string;
  name: string;
  category: PlaceLibraryCategory;
  position: {
    lat: number;
    lng: number;
  };
  rating?: number;
  address?: string;
  placeId?: string;
  updatedAt: string;
  source: 'google' | 'manual';
};

export type PlaceLibraryState = Record<PlaceLibraryCategory, {
  updatedAt?: string;
  items: PlaceLibraryItem[];
}>;

export const PLACE_LIBRARY_STORAGE_KEY = 'bali_base_places_library';
export const PLACE_LIBRARY_TTL_MS = 1000 * 60 * 60 * 24 * 90;

export const PLACE_LIBRARY_CATEGORIES: Array<{ id: PlaceLibraryCategory; label: string }> = [
  { id: 'restaurants', label: 'Рестораны' },
  { id: 'sport', label: 'Спорт' },
  { id: 'supermarkets', label: 'Супермаркеты' },
  { id: 'attractions', label: 'Достопримечательности' },
  { id: 'beaches', label: 'Пляжи' }
];

const createEmptyState = (): PlaceLibraryState => ({
  restaurants: { items: [] },
  sport: { items: [] },
  supermarkets: { items: [] },
  attractions: { items: [] },
  beaches: { items: [] }
});

export const loadPlaceLibrary = (): PlaceLibraryState => {
  if (typeof localStorage === 'undefined') return createEmptyState();

  try {
    const stored = localStorage.getItem(PLACE_LIBRARY_STORAGE_KEY);
    if (!stored) return createEmptyState();
    const parsed = JSON.parse(stored);
    return {
      ...createEmptyState(),
      ...parsed
    };
  } catch {
    return createEmptyState();
  }
};

export const savePlaceLibrary = (library: PlaceLibraryState) => {
  localStorage.setItem(PLACE_LIBRARY_STORAGE_KEY, JSON.stringify(library));
};

export const isPlaceLibraryFresh = (updatedAt?: string) => {
  if (!updatedAt) return false;
  const timestamp = new Date(updatedAt).getTime();
  return Number.isFinite(timestamp) && Date.now() - timestamp < PLACE_LIBRARY_TTL_MS;
};

export const upsertPlaceLibraryItems = (
  category: PlaceLibraryCategory,
  items: PlaceLibraryItem[]
) => {
  const library = loadPlaceLibrary();
  const existing = library[category]?.items || [];
  const byId = new Map<string, PlaceLibraryItem>();

  existing.forEach(item => byId.set(item.placeId || item.id, item));
  items.forEach(item => byId.set(item.placeId || item.id, item));

  library[category] = {
    updatedAt: new Date().toISOString(),
    items: Array.from(byId.values())
  };

  savePlaceLibrary(library);
  return library[category].items;
};

export const getNearbyLibraryItems = (
  items: PlaceLibraryItem[],
  origin: { lat: number; lng: number },
  radiusKm = 25
) => items
  .filter(item => getHaversineDistance(origin, item.position) <= radiusKm)
  .sort((a, b) => getHaversineDistance(origin, a.position) - getHaversineDistance(origin, b.position));

export const createManualPlace = (
  category: PlaceLibraryCategory,
  name: string,
  lat: number,
  lng: number,
  rating?: number,
  address?: string
): PlaceLibraryItem => ({
  id: `manual-${category}-${Date.now()}`,
  name,
  category,
  position: { lat, lng },
  rating,
  address,
  updatedAt: new Date().toISOString(),
  source: 'manual'
});
