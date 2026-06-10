import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { usePubs } from './PubsProvider';
import { loadJson, saveJson, STORAGE_KEYS } from '../services/storage';
import type { FavoritesMap, FavoriteVenue, Venue } from '../types/models';

/**
 * Persistent favorites. Each favorite stores a full venue snapshot so the
 * pub remains openable (read-only) even when you're a hundred kilometres
 * away and it is no longer part of the loaded surroundings. Snapshots are
 * refreshed automatically whenever the live store has newer data.
 */

interface FavoritesContextValue {
  favorites: FavoritesMap;
  hydrated: boolean;
  isFavorite: (venueId: string) => boolean;
  toggleFavorite: (venue: Venue) => void;
  /** Favorited venues, most recently added first. */
  favoritesList: FavoriteVenue[];
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

/** Strips decoration (distance, bearing…) so storage holds pure Venue data. */
function toPlainVenue(venue: Venue): Venue {
  return {
    id: venue.id,
    name: venue.name,
    type: venue.type,
    coordinate: venue.coordinate,
    address: venue.address,
    openingHours: venue.openingHours,
    rating: venue.rating,
    ratingCount: venue.ratingCount,
    priceLevel: venue.priceLevel,
    features: venue.features,
    tapBeers: venue.tapBeers,
  };
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { venues } = usePubs();
  const [favorites, setFavorites] = useState<FavoritesMap>({});
  const [hydrated, setHydrated] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    void loadJson<FavoritesMap>(STORAGE_KEYS.favorites).then((stored) => {
      if (!mountedRef.current) return;
      if (stored) setFavorites(stored);
      setHydrated(true);
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Keep snapshots fresh: when a favorited venue is present in live data
  // with a different reference (price edits, live merges), re-snapshot it.
  useEffect(() => {
    if (!hydrated) return;
    setFavorites((previous) => {
      let changed = false;
      const next: FavoritesMap = { ...previous };
      for (const venue of venues) {
        const existing = next[venue.id];
        if (existing && existing.venue !== venue) {
          next[venue.id] = { ...existing, venue: toPlainVenue(venue) };
          changed = true;
        }
      }
      if (changed) void saveJson(STORAGE_KEYS.favorites, next);
      return changed ? next : previous;
    });
  }, [venues, hydrated]);

  const toggleFavorite = useCallback((venue: Venue) => {
    setFavorites((previous) => {
      const next: FavoritesMap = { ...previous };
      if (next[venue.id]) {
        delete next[venue.id];
      } else {
        next[venue.id] = {
          venue: toPlainVenue(venue),
          favoritedAt: new Date().toISOString(),
        };
      }
      void saveJson(STORAGE_KEYS.favorites, next);
      return next;
    });
  }, []);

  const value = useMemo<FavoritesContextValue>(() => {
    const favoritesList = Object.values(favorites).sort((a, b) =>
      b.favoritedAt.localeCompare(a.favoritedAt),
    );
    return {
      favorites,
      hydrated,
      isFavorite: (venueId) => venueId in favorites,
      toggleFavorite,
      favoritesList,
    };
  }, [favorites, hydrated, toggleFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
