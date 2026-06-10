import { buildSimulatedRoute, fetchWalkingRoute } from '../directions';
import { haversineMeters } from '../geo';
import type { LatLng } from '../../types/models';

const FROM: LatLng = { latitude: 48.9745, longitude: 14.4743 }; // CB main square
const TO: LatLng = { latitude: 48.9789, longitude: 14.48 }; // a few blocks away

/** Minimal OSRM payload: a two-leg road geometry between FROM and TO. */
function osrmPayload() {
  return {
    code: 'Ok',
    routes: [
      {
        distance: 820,
        geometry: {
          coordinates: [
            [FROM.longitude, FROM.latitude],
            [14.477, 48.976],
            [TO.longitude, TO.latitude],
          ] as [number, number][],
        },
      },
    ],
  };
}

function mockFetchOnce(payload: unknown, ok = true, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: async () => payload,
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('fetchWalkingRoute — real road routing', () => {
  it('returns the OSRM road geometry when the router responds', async () => {
    mockFetchOnce(osrmPayload());

    const route = await fetchWalkingRoute(FROM, TO);

    expect(route.source).toBe('network');
    expect(route.points[0]).toEqual(FROM);
    expect(route.points[route.points.length - 1]).toEqual(TO);
    expect(route.distanceMeters).toBe(820);
    expect(route.durationMinutes).toBeGreaterThanOrEqual(1);

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('router.project-osrm.org/route/v1');
    expect(url).toContain(`${FROM.longitude},${FROM.latitude};${TO.longitude},${TO.latitude}`);
  });

  it('stitches the polyline back to the true origin and doorstep when OSRM snaps away', async () => {
    const snapped = osrmPayload();
    // Pretend OSRM snapped both endpoints ~50 m onto the road network.
    snapped.routes[0].geometry.coordinates[0] = [14.475, 48.975];
    snapped.routes[0].geometry.coordinates[2] = [14.4795, 48.9785];
    mockFetchOnce(snapped);

    const route = await fetchWalkingRoute(FROM, TO);

    expect(route.points[0]).toEqual(FROM);
    expect(route.points[route.points.length - 1]).toEqual(TO);
    expect(route.distanceMeters).toBeGreaterThan(820);
  });

  it('falls back to the simulated route when the network fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'));

    const route = await fetchWalkingRoute(FROM, TO);

    expect(route.source).toBe('simulated');
    expect(route.points[0]).toEqual(FROM);
    expect(route.points[route.points.length - 1]).toEqual(TO);
    // A street walk is never shorter than the crow-flies distance.
    expect(route.distanceMeters).toBeGreaterThanOrEqual(
      Math.floor(haversineMeters(FROM, TO)),
    );
  });

  it('falls back when OSRM cannot find a route', async () => {
    mockFetchOnce({ code: 'NoRoute', routes: [] });

    const route = await fetchWalkingRoute(FROM, TO);

    expect(route.source).toBe('simulated');
  });

  it('falls back on HTTP errors (rate limiting etc.)', async () => {
    mockFetchOnce({}, false, 429);

    const route = await fetchWalkingRoute(FROM, TO);

    expect(route.source).toBe('simulated');
  });
});

describe('buildSimulatedRoute — offline fallback', () => {
  it('is deterministic for the same origin/destination pair', () => {
    const a = buildSimulatedRoute(FROM, TO);
    const b = buildSimulatedRoute(FROM, TO);
    expect(a.points).toEqual(b.points);
    expect(a.distanceMeters).toBe(b.distanceMeters);
  });

  it('produces a multi-leg, street-like path for non-trivial distances', () => {
    const route = buildSimulatedRoute(FROM, TO);
    expect(route.points.length).toBeGreaterThan(2);
    expect(route.source).toBe('simulated');
  });
});
