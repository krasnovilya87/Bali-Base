import { useEffect, useState } from 'react';

const FAVORITES_STORAGE_KEY = 'bali_base_favorites';
const FAVORITES_CHANGED_EVENT = 'bali_base_favorites_changed';

const readFavoriteIds = (): Set<string> => {
  if (typeof window === 'undefined') return new Set<string>();

  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : []);
  } catch {
    return new Set<string>();
  }
};

export const useFavoriteListings = () => {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => readFavoriteIds());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFavoriteIds = () => setFavoriteIds(readFavoriteIds());

    window.addEventListener(FAVORITES_CHANGED_EVENT, syncFavoriteIds);
    window.addEventListener('storage', syncFavoriteIds);

    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, syncFavoriteIds);
      window.removeEventListener('storage', syncFavoriteIds);
    };
  }, []);

  const toggleFavorite = (listingId: string) => {
    const next = new Set(typeof window === 'undefined' ? favoriteIds : readFavoriteIds());
    if (next.has(listingId)) {
      next.delete(listingId);
    } else {
      next.add(listingId);
    }

    setFavoriteIds(next);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(next)));
        window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
      } catch {
        // Ignore storage failures and keep in-memory favorites working.
      }
    }
  };

  return {
    favoriteIds,
    toggleFavorite
  };
};
