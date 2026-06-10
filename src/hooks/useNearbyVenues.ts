import { useEffect, useMemo, useState } from 'react';

import { useFavorites } from '../state/FavoritesProvider';
import { useFilters } from '../state/FiltersProvider';
import { useLocationContext, type LocationStatus } from '../state/LocationProvider';
import { usePubs } from '../state/PubsProvider';
import { haversineMeters, initialBearingDeg, walkingMinutes } from '../services/geo';
import { isOpenNow } from '../utils/format';
import type { LatLng, Venue } from '../types/models';

export interface DecoratedVenue extends Venue {
  distanceMeters: number;
  bearingDeg: number;
  walkMinutes: number;
  isOpen: boolean;
  cheapestPriceCzk: number;
}

/** A venue resolved for a detail-style screen; `isLive` is false when it
 *  comes from a favorite snapshot outside the loaded surroundings. */
export interface ResolvedVenue extends DecoratedVenue {
  isLive: boolean;
}

export function decorateVenue(venue: Venue, from: LatLng, now: Date): DecoratedVenue {
  const distanceMeters = haversineMeters(from, venue.coordinate);
  return {
    ...venue,
    distanceMeters,
    bearingDeg: initialBearingDeg(from, venue.coordinate),
    walkMinutes: walkingMinutes(distanceMeters),
    isOpen: isOpenNow(venue.openingHours, now),
    cheapestPriceCzk:
      venue.tapBeers.length > 0
        ? Math.min(...venue.tapBeers.map((beer) => beer.priceCzk))
        : 0,
  };
}

interface NearbyVenuesResult {
  status: ReturnType<typeof usePubs>['status'];
  locationStatus: LocationStatus;
  error: string | null;
  /** Venues passing the active filters, nearest first. */
  venues: DecoratedVenue[];
  /** Loaded venue count before filtering — distinguishes "empty area" from "filtered out". */
  totalCount: number;
  refreshing: boolean;
  refresh: () => Promise<void>;
  isFallback: boolean;
}

/** Venues decorated with live distance/bearing, filtered and sorted. */
export function useNearbyVenues(): NearbyVenuesResult {
  const pubs = usePubs();
  const { venueMatches } = useFilters();
  const { effectiveCoords, isFallback, status: locationStatus } = useLocationContext();

  // Re-evaluate the open/closed flag every minute.
  const [minuteTick, setMinuteTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setMinuteTick((tick) => tick + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const decorated = useMemo(() => {
    const now = new Date();
    return pubs.venues
      .map((venue) => decorateVenue(venue, effectiveCoords, now))
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- minuteTick intentionally refreshes time-derived flags
  }, [pubs.venues, effectiveCoords, minuteTick]);

  const venues = useMemo(
    () => decorated.filter(venueMatches),
    [decorated, venueMatches],
  );

  return {
    status: pubs.status,
    locationStatus,
    error: pubs.error,
    venues,
    totalCount: decorated.length,
    refreshing: pubs.refreshing,
    refresh: pubs.refresh,
    isFallback,
  };
}

/**
 * A single venue for detail screens. Resolution order: the live store first,
 * then the persisted favorite snapshot — so a favorited pub opens anywhere,
 * flagged `isLive: false` when it's beyond the loaded surroundings.
 */
export function useVenue(venueId: string): ResolvedVenue | undefined {
  const { venues } = usePubs();
  const { favorites } = useFavorites();
  const { effectiveCoords } = useLocationContext();

  return useMemo(() => {
    const live = venues.find((candidate) => candidate.id === venueId);
    const source = live ?? favorites[venueId]?.venue;
    if (!source) return undefined;
    return {
      ...decorateVenue(source, effectiveCoords, new Date()),
      isLive: live !== undefined,
    };
  }, [venues, favorites, venueId, effectiveCoords]);
}
