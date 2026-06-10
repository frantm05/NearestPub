import type { LatLng, LatLngBounds } from '../types/models';

const EARTH_RADIUS_M = 6371000;
const METERS_PER_DEG_LAT = 111320;

const toRad = (deg: number): number => (deg * Math.PI) / 180;
const toDeg = (rad: number): number => (rad * 180) / Math.PI;

/** Great-circle distance in meters between two coordinates. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from `from` to `to`, in degrees clockwise from true north [0, 360). */
export function initialBearingDeg(from: LatLng, to: LatLng): number {
  const phi1 = toRad(from.latitude);
  const phi2 = toRad(to.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const y = Math.sin(dLng) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
  return normalizeDeg(toDeg(Math.atan2(y, x)));
}

/** Destination point given a start, bearing (degrees) and distance (meters). */
export function destinationPoint(origin: LatLng, bearingDeg: number, distanceM: number): LatLng {
  const delta = distanceM / EARTH_RADIUS_M;
  const theta = toRad(bearingDeg);
  const phi1 = toRad(origin.latitude);
  const lambda1 = toRad(origin.longitude);

  const sinPhi2 =
    Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta);
  const phi2 = Math.asin(sinPhi2);
  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
      Math.cos(delta) - Math.sin(phi1) * sinPhi2,
    );

  return { latitude: toDeg(phi2), longitude: toDeg(lambda2) };
}

/** Normalizes any angle to [0, 360). */
export function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Signed shortest rotation from one angle to another, in (-180, 180]. */
export function shortestAngleDelta(fromDeg: number, toDeg2: number): number {
  let delta = normalizeDeg(toDeg2) - normalizeDeg(fromDeg);
  if (delta > 180) delta -= 360;
  if (delta <= -180) delta += 360;
  return delta;
}

/** Walking time estimate at a comfortable city pace (~4.5 km/h). */
export function walkingMinutes(meters: number): number {
  return Math.max(1, Math.ceil(meters / 75));
}

/**
 * Bounding box of the circle around `center` with the given radius.
 * Longitude span is corrected for latitude (degrees shrink toward the poles).
 * No antimeridian handling — this app's world is nowhere near ±180°.
 */
export function boundsAround(center: LatLng, radiusMeters: number): LatLngBounds {
  const dLat = radiusMeters / METERS_PER_DEG_LAT;
  const metersPerDegLng = Math.max(
    1,
    Math.cos(toRad(center.latitude)) * METERS_PER_DEG_LAT,
  );
  const dLng = radiusMeters / metersPerDegLng;
  return {
    southWest: { latitude: center.latitude - dLat, longitude: center.longitude - dLng },
    northEast: { latitude: center.latitude + dLat, longitude: center.longitude + dLng },
  };
}

export function boundsContain(bounds: LatLngBounds, point: LatLng): boolean {
  return (
    point.latitude >= bounds.southWest.latitude &&
    point.latitude <= bounds.northEast.latitude &&
    point.longitude >= bounds.southWest.longitude &&
    point.longitude <= bounds.northEast.longitude
  );
}

export function boundsIntersect(a: LatLngBounds, b: LatLngBounds): boolean {
  return (
    a.southWest.latitude <= b.northEast.latitude &&
    a.northEast.latitude >= b.southWest.latitude &&
    a.southWest.longitude <= b.northEast.longitude &&
    a.northEast.longitude >= b.southWest.longitude
  );
}

export function boundsCenter(bounds: LatLngBounds): LatLng {
  return {
    latitude: (bounds.southWest.latitude + bounds.northEast.latitude) / 2,
    longitude: (bounds.southWest.longitude + bounds.northEast.longitude) / 2,
  };
}

/** The intersection of two boxes, or null when they don't overlap. */
export function boundsIntersection(
  a: LatLngBounds,
  b: LatLngBounds,
): LatLngBounds | null {
  if (!boundsIntersect(a, b)) return null;
  return {
    southWest: {
      latitude: Math.max(a.southWest.latitude, b.southWest.latitude),
      longitude: Math.max(a.southWest.longitude, b.southWest.longitude),
    },
    northEast: {
      latitude: Math.min(a.northEast.latitude, b.northEast.latitude),
      longitude: Math.min(a.northEast.longitude, b.northEast.longitude),
    },
  };
}
