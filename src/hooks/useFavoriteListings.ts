import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

const FAVORITES_STORAGE_KEY = 'bali_base_favorites';
const FAVORITES_CHANGED_EVENT = 'bali_base_favorites_changed';

const getFavoritesStorageKey = (userId?: string | null) =>
  userId ? `${FAVORITES_STORAGE_KEY}:${userId}` : FAVORITES_STORAGE_KEY;

const readFavoriteIds = (userId?: string | null): Set<string> => {
  if (typeof window === 'undefined') return new Set<string>();

  try {
    const raw = localStorage.getItem(getFavoritesStorageKey(userId));
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : []);
  } catch {
    return new Set<string>();
  }
};

export const useFavoriteListings = () => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => readFavoriteIds(user?.uid));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFavoriteIds = () => setFavoriteIds(readFavoriteIds(user?.uid));
    syncFavoriteIds();

    window.addEventListener(FAVORITES_CHANGED_EVENT, syncFavoriteIds);
    window.addEventListener('storage', syncFavoriteIds);

    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, syncFavoriteIds);
      window.removeEventListener('storage', syncFavoriteIds);
    };
  }, [user?.uid]);

  const toggleFavorite = (listingId: string) => {
    const next = new Set(typeof window === 'undefined' ? favoriteIds : readFavoriteIds(user?.uid));
    if (next.has(listingId)) {
      next.delete(listingId);
    } else {
      next.add(listingId);
    }

    setFavoriteIds(next);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(getFavoritesStorageKey(user?.uid), JSON.stringify(Array.from(next)));
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
