import { intersectsCoverage } from './coverage';
import {
  boundsAround,
  boundsCenter,
  boundsIntersection,
  haversineMeters,
} from './geo';
import { createRng, pick, rngInt } from './random';
import { generateVenuesAround, generateVenuesInBounds } from './venueGenerator';
import type {
  LatLng,
  LatLngBounds,
  LiveUpdateEvent,
  PriceVote,
  TapBeer,
  Venue,
} from '../types/models';

/**
 * Mock backend for Czech venues. Simulates network latency, enforces the
 * beer-on-tap guard server-side, and periodically emits "community activity"
 * events that merge silently into app state.
 *
 * Every fetch is geofenced: the database only covers the Czech Republic, so
 * queries anywhere else on Earth resolve to an empty result set.
 */

const MAX_RESULTS = 60;
export const DEFAULT_SEARCH_RADIUS_M = 2500;
/** Server-side cap on the queried viewport, like a real API's bbox limit. */
const MAX_QUERY_SPAN_M = 12000;
const LIVE_TICK_MS = 18000;
const LIVE_EVENT_PROBABILITY = 0.65;

function delay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * THE BEER-ON-TAP GUARD. Every venue surfaced by the API must pour at least
 * one draught beer; bottle-only and coffee-only places never reach the UI.
 */
export function hasBeerOnTap(venue: Venue): boolean {
  return venue.tapBeers.length > 0;
}

/**
 * When a viewport is wider than the server allows, search the part of it the
 * user is actually looking at: the max-span box around the same center.
 */
function clampToMaxSpan(bounds: LatLngBounds): LatLngBounds {
  const cap = boundsAround(boundsCenter(bounds), MAX_QUERY_SPAN_M / 2);
  return boundsIntersection(bounds, cap) ?? cap;
}

/**
 * Venues with beer on tap inside the visible map bounds, nearest to the
 * viewport center first. Outside the covered country this resolves to `[]`.
 */
export async function fetchVenuesInBounds(bounds: LatLngBounds): Promise<Venue[]> {
  await delay(450, 900);
  if (!intersectsCoverage(bounds)) return [];

  const queried = clampToMaxSpan(bounds);
  const center = boundsCenter(queried);
  return generateVenuesInBounds(queried)
    .filter(hasBeerOnTap)
    .sort(
      (a, b) =>
        haversineMeters(center, a.coordinate) - haversineMeters(center, b.coordinate),
    )
    .slice(0, MAX_RESULTS);
}

/**
 * Venues with beer on tap around `center`, nearest first — the "around me"
 * query. Geofenced like the bounds query: a center outside the covered
 * country (whose search circle doesn't even touch it) resolves to `[]`.
 */
export async function fetchNearbyVenues(
  center: LatLng,
  radiusMeters: number = DEFAULT_SEARCH_RADIUS_M,
): Promise<Venue[]> {
  await delay(450, 900);
  if (!intersectsCoverage(boundsAround(center, radiusMeters))) return [];

  return generateVenuesAround(center, radiusMeters)
    .filter(hasBeerOnTap)
    .sort(
      (a, b) =>
        haversineMeters(center, a.coordinate) - haversineMeters(center, b.coordinate),
    )
    .slice(0, MAX_RESULTS);
}

export async function submitPriceVote(
  _venueId: string,
  _beerId: string,
  _vote: PriceVote,
): Promise<void> {
  await delay(180, 420);
}

/** Persists a manual tap-list edit (price change, beer added or removed). */
export async function submitBeerListUpdate(
  _venueId: string,
  _tapBeers: readonly TapBeer[],
): Promise<void> {
  await delay(220, 500);
}

export type LiveUpdateListener = (event: LiveUpdateEvent) => void;

/**
 * Simulated live feed: every ~18 s another "user" either nudges a price by a
 * few crowns or confirms one. Reads the freshest venue snapshot through
 * `getVenues` so events always reference data the app actually shows.
 */
export function subscribeToLiveUpdates(
  getVenues: () => readonly Venue[],
  listener: LiveUpdateListener,
): () => void {
  const interval = setInterval(() => {
    if (Math.random() > LIVE_EVENT_PROBABILITY) return;

    const venues = getVenues().filter(hasBeerOnTap);
    if (venues.length === 0) return;

    const rng = createRng(`live:${Date.now()}`);
    const venue = pick(rng, venues);
    const beer = pick(rng, venue.tapBeers);

    if (rng() < 0.5) {
      const nudge = pick(rng, [-3, -2, -1, 1, 1, 2, 2, 3] as const);
      listener({
        kind: 'price',
        venueId: venue.id,
        venueName: venue.name,
        beerId: beer.id,
        beerName: beer.name,
        newPriceCzk: Math.max(35, beer.priceCzk + nudge),
      });
    } else {
      listener({
        kind: 'confirmation',
        venueId: venue.id,
        venueName: venue.name,
        beerId: beer.id,
        beerName: beer.name,
      });
    }
  }, LIVE_TICK_MS + rngInt(createRng(`jitter:${Math.random()}`), -2000, 2000));

  return () => clearInterval(interval);
}
