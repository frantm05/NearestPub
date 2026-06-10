import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { BeerStyle, PriceBucket, Venue, VenueFilters } from '../types/models';

/**
 * Session-scoped venue filtering: price bucket (by cheapest pint), beer
 * style, and brewery. A venue matches when, for each active dimension, at
 * least one of its tap beers satisfies it.
 */

const DEFAULT_FILTERS: VenueFilters = { price: 'any', styles: [], breweries: [] };

export const PRICE_BUCKET_LIMITS = {
  budget: { max: 49 },
  moderate: { min: 50, max: 69 },
  premium: { min: 70 },
} as const;

function cheapestPint(venue: Venue): number {
  return venue.tapBeers.length > 0
    ? Math.min(...venue.tapBeers.map((beer) => beer.priceCzk))
    : 0;
}

function priceMatches(bucket: PriceBucket, venue: Venue): boolean {
  if (bucket === 'any') return true;
  const cheapest = cheapestPint(venue);
  switch (bucket) {
    case 'budget':
      return cheapest <= PRICE_BUCKET_LIMITS.budget.max;
    case 'moderate':
      return (
        cheapest >= PRICE_BUCKET_LIMITS.moderate.min &&
        cheapest <= PRICE_BUCKET_LIMITS.moderate.max
      );
    case 'premium':
      return cheapest >= PRICE_BUCKET_LIMITS.premium.min;
    default:
      return true;
  }
}

interface FiltersContextValue {
  filters: VenueFilters;
  activeCount: number;
  setPriceBucket: (bucket: PriceBucket) => void;
  toggleStyle: (style: BeerStyle) => void;
  toggleBrewery: (brewery: string) => void;
  clearFilters: () => void;
  venueMatches: (venue: Venue) => boolean;
}

const FiltersContext = createContext<FiltersContextValue | undefined>(undefined);

function toggleInList<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<VenueFilters>(DEFAULT_FILTERS);

  const setPriceBucket = useCallback((price: PriceBucket) => {
    setFilters((previous) => ({ ...previous, price }));
  }, []);

  const toggleStyle = useCallback((style: BeerStyle) => {
    setFilters((previous) => ({ ...previous, styles: toggleInList(previous.styles, style) }));
  }, []);

  const toggleBrewery = useCallback((brewery: string) => {
    setFilters((previous) => ({
      ...previous,
      breweries: toggleInList(previous.breweries, brewery),
    }));
  }, []);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const venueMatches = useCallback(
    (venue: Venue): boolean => {
      if (!priceMatches(filters.price, venue)) return false;
      if (
        filters.styles.length > 0 &&
        !venue.tapBeers.some((beer) => filters.styles.includes(beer.style))
      ) {
        return false;
      }
      if (
        filters.breweries.length > 0 &&
        !venue.tapBeers.some((beer) => filters.breweries.includes(beer.brewery))
      ) {
        return false;
      }
      return true;
    },
    [filters],
  );

  const value = useMemo<FiltersContextValue>(
    () => ({
      filters,
      activeCount:
        (filters.price !== 'any' ? 1 : 0) + filters.styles.length + filters.breweries.length,
      setPriceBucket,
      toggleStyle,
      toggleBrewery,
      clearFilters,
      venueMatches,
    }),
    [filters, setPriceBucket, toggleStyle, toggleBrewery, clearFilters, venueMatches],
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters(): FiltersContextValue {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error('useFilters must be used within FiltersProvider');
  }
  return context;
}
