import { destinationPoint, haversineMeters, initialBearingDeg, normalizeDeg, shortestAngleDelta } from './geo';
import { chance, createRng, rngFloat, rngInt, type Rng } from './random';
import type { LatLng, WalkingRoute } from '../types/models';

/**
 * Walking directions with real road routing.
 *
 * Primary: the public OSRM router, which returns genuine road-network
 * geometry. Walking time is derived from route distance at a steady pace,
 * so it stays a *walking* ETA even though the demo router is car-profiled.
 *
 * Fallback: when the router is unreachable (offline, rate-limited, no route),
 * a seeded street-grid simulation takes over. Every neighborhood gets a
 * stable grid orientation; the route walks block-length legs along the grid
 * axes with occasional detours — right-angle city turns instead of a smooth
 * "as the crow flies" arc. Deterministic per origin/destination pair.
 */

const WALK_SPEED_M_PER_MIN = 75;
const SNAP_DISTANCE_M = 45;
const MAX_LEGS = 48;

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/foot';
const OSRM_TIMEOUT_MS = 6000;
/** Endpoint gaps larger than this get stitched to the true origin/doorstep. */
const ENDPOINT_STITCH_M = 15;

function walkMinutes(distanceMeters: number): number {
  return Math.max(1, Math.ceil(distanceMeters / WALK_SPEED_M_PER_MIN));
}

// ---------------------------------------------------------------------------
// Real routing (OSRM)
// ---------------------------------------------------------------------------

interface OsrmRouteResponse {
  code: string;
  routes?: {
    distance: number;
    geometry: { coordinates: [number, number][] };
  }[];
}

async function fetchRoadRoute(from: LatLng, to: LatLng): Promise<WalkingRoute> {
  const coords =
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const url =
    `${OSRM_BASE_URL}/${coords}?overview=full&geometries=geojson&steps=false&alternatives=false`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`osrm-http-${response.status}`);
    }
    const payload = (await response.json()) as OsrmRouteResponse;
    const route = payload.routes?.[0];
    if (payload.code !== 'Ok' || !route || route.geometry.coordinates.length < 2) {
      throw new Error(`osrm-${payload.code ?? 'empty'}`);
    }

    const points: LatLng[] = route.geometry.coordinates.map(
      ([longitude, latitude]) => ({ latitude, longitude }),
    );

    // OSRM snaps endpoints to the road network; stitch the polyline back to
    // the walker's true position and the pub's doorstep when the snap left
    // a visible gap.
    let distanceMeters = route.distance;
    const startGap = haversineMeters(from, points[0]);
    if (startGap > ENDPOINT_STITCH_M) {
      points.unshift(from);
      distanceMeters += startGap;
    }
    const endGap = haversineMeters(points[points.length - 1], to);
    if (endGap > ENDPOINT_STITCH_M) {
      points.push(to);
      distanceMeters += endGap;
    }

    distanceMeters = Math.round(distanceMeters);
    return {
      points,
      distanceMeters,
      durationMinutes: walkMinutes(distanceMeters),
      source: 'network',
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Simulated fallback (seeded street grid)
// ---------------------------------------------------------------------------

function quantize(value: number): number {
  return Math.round(value * 3000); // ~37 m buckets — stable seeds while standing still
}

/** Street-grid orientation for the destination's neighborhood, in [0, 90). */
function gridOrientation(anchor: LatLng): number {
  const cellRng = createRng(
    `grid:${Math.round(anchor.latitude * 200)}:${Math.round(anchor.longitude * 200)}`,
  );
  return cellRng() * 90;
}

/** The four cardinal directions of the local grid, nearest-to-target first. */
function gridDirections(orientation: number, targetBearing: number): number[] {
  return [orientation, orientation + 90, orientation + 180, orientation + 270]
    .map(normalizeDeg)
    .sort(
      (a, b) =>
        Math.abs(shortestAngleDelta(a, targetBearing)) -
        Math.abs(shortestAngleDelta(b, targetBearing)),
    );
}

function buildGridPath(from: LatLng, to: LatLng, rng: Rng): LatLng[] {
  const totalMeters = haversineMeters(from, to);
  const orientation = gridOrientation(to);
  // Block length scales with trip length so cross-town (or cross-country,
  // for a favorited pub) routes stay within the leg budget.
  const blockBase = Math.min(2500, Math.max(70, totalMeters / 18));

  const points: LatLng[] = [from];
  let current = from;

  for (let leg = 0; leg < MAX_LEGS; leg += 1) {
    const remaining = haversineMeters(current, to);
    if (remaining <= SNAP_DISTANCE_M) break;

    const targetBearing = initialBearingDeg(current, to);
    const directions = gridDirections(orientation, targetBearing);

    // Mostly walk the best grid axis; occasionally take the perpendicular
    // one for a block — the "wrong way around the corner" feel.
    const detour = remaining > blockBase * 2.5 && chance(rng, 0.18);
    const bearing = detour ? directions[1] : directions[0];

    const blocks = detour ? 1 : rngInt(rng, 1, 3);
    const legLength = Math.min(
      blockBase * blocks * rngFloat(rng, 0.7, 1.15),
      Math.max(SNAP_DISTANCE_M, remaining * (detour ? 0.4 : 0.92)),
    );

    current = destinationPoint(current, bearing, legLength);
    points.push(current);
  }

  points.push(to); // final doorstep snap (≤ SNAP_DISTANCE_M diagonal)
  return points;
}

export function buildSimulatedRoute(from: LatLng, to: LatLng): WalkingRoute {
  const rng = createRng(
    `route:${quantize(from.latitude)}:${quantize(from.longitude)}:${quantize(to.latitude)}:${quantize(to.longitude)}`,
  );

  const directMeters = haversineMeters(from, to);
  const points = directMeters < 30 ? [from, to] : buildGridPath(from, to, rng);

  let distanceMeters = 0;
  for (let i = 1; i < points.length; i += 1) {
    distanceMeters += haversineMeters(points[i - 1], points[i]);
  }
  distanceMeters = Math.round(distanceMeters);

  return {
    points,
    distanceMeters,
    durationMinutes: walkMinutes(distanceMeters),
    source: 'simulated',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchWalkingRoute(from: LatLng, to: LatLng): Promise<WalkingRoute> {
  try {
    return await fetchRoadRoute(from, to);
  } catch (error) {
    console.warn('[directions] road routing unavailable, using simulation', error);
    return buildSimulatedRoute(from, to);
  }
}
