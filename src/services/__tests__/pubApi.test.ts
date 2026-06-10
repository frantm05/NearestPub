import { CZECH_REPUBLIC_BOUNDS, isWithinCoverage } from '../coverage';
import { boundsContain, haversineMeters } from '../geo';
import { fetchNearbyVenues, fetchVenuesInBounds } from '../pubApi';
import type { LatLng, LatLngBounds } from '../../types/models';

/** Náměstí Přemysla Otakara II, České Budějovice (Budweis). */
const BUDWEIS: LatLng = { latitude: 48.9745, longitude: 14.4743 };
/** Old Town Square, Prague. */
const PRAGUE: LatLng = { latitude: 50.0875, longitude: 14.4213 };
/** Piazza del Duomo, Milan — far outside the covered country. */
const MILAN: LatLng = { latitude: 45.4642, longitude: 9.19 };

function viewport(center: LatLng, latDelta: number, lngDelta: number): LatLngBounds {
  return {
    southWest: {
      latitude: center.latitude - latDelta / 2,
      longitude: center.longitude - lngDelta / 2,
    },
    northEast: {
      latitude: center.latitude + latDelta / 2,
      longitude: center.longitude + lngDelta / 2,
    },
  };
}

/** Awaits a fetch while fast-forwarding through the simulated network delay. */
async function settle<T>(promise: Promise<T>): Promise<T> {
  await jest.advanceTimersByTimeAsync(1000);
  return promise;
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('fetchVenuesInBounds — viewport-driven, geofenced lookups', () => {
  it('returns venues for a České Budějovice viewport, all inside the queried bounds', async () => {
    const bounds = viewport(BUDWEIS, 0.018, 0.018);
    const venues = await settle(fetchVenuesInBounds(bounds));

    expect(venues.length).toBeGreaterThan(0);
    for (const venue of venues) {
      expect(boundsContain(bounds, venue.coordinate)).toBe(true);
      expect(venue.tapBeers.length).toBeGreaterThan(0); // beer-on-tap guard
    }
  });

  it('sorts results by distance from the viewport center', async () => {
    const venues = await settle(fetchVenuesInBounds(viewport(BUDWEIS, 0.018, 0.018)));

    const distances = venues.map((venue) => haversineMeters(BUDWEIS, venue.coordinate));
    for (let i = 1; i < distances.length; i += 1) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
    }
  });

  it('returns [] for a viewport over Milan — Czech pubs never leak abroad', async () => {
    const venues = await settle(fetchVenuesInBounds(viewport(MILAN, 0.05, 0.05)));
    expect(venues).toEqual([]);
  });

  it('is deterministic: the same viewport always yields the same venues', async () => {
    const bounds = viewport(BUDWEIS, 0.018, 0.018);
    const first = await settle(fetchVenuesInBounds(bounds));
    const second = await settle(fetchVenuesInBounds(bounds));

    expect(second.map((venue) => venue.id)).toEqual(first.map((venue) => venue.id));
  });

  it('clamps an oversized viewport to the area around its center', async () => {
    // A whole-country viewport centered on Prague still searches Prague.
    const venues = await settle(fetchVenuesInBounds(viewport(PRAGUE, 3, 3)));

    expect(venues.length).toBeGreaterThan(0);
    for (const venue of venues) {
      // 12 km × 12 km cap → nothing farther than the box corner (~8.5 km).
      expect(haversineMeters(PRAGUE, venue.coordinate)).toBeLessThan(9000);
      expect(isWithinCoverage(venue.coordinate)).toBe(true);
    }
  });

  it('clips a viewport straddling the border to the covered side only', async () => {
    const borderLat = CZECH_REPUBLIC_BOUNDS.southWest.latitude;
    const straddling = viewport(
      { latitude: borderLat, longitude: 14.4743 },
      0.1,
      0.1,
    );
    const venues = await settle(fetchVenuesInBounds(straddling));

    for (const venue of venues) {
      expect(venue.coordinate.latitude).toBeGreaterThanOrEqual(borderLat);
    }
  });
});

describe('fetchNearbyVenues — "around me" lookups share the geofence', () => {
  it('returns venues with beer on tap around Budweis, nearest first', async () => {
    const venues = await settle(fetchNearbyVenues(BUDWEIS));

    expect(venues.length).toBeGreaterThan(0);
    let previous = 0;
    for (const venue of venues) {
      const distance = haversineMeters(BUDWEIS, venue.coordinate);
      expect(distance).toBeLessThanOrEqual(2500);
      expect(distance).toBeGreaterThanOrEqual(previous);
      expect(venue.tapBeers.length).toBeGreaterThan(0);
      previous = distance;
    }
  });

  it('returns [] when the user is in Milan', async () => {
    const venues = await settle(fetchNearbyVenues(MILAN));
    expect(venues).toEqual([]);
  });
});
