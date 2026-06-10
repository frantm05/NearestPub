import { boundsContain, boundsIntersect } from './geo';
import type { LatLng, LatLngBounds } from '../types/models';

/**
 * Geographic coverage of the simulated venue database. The mock world only
 * holds data for the Czech Republic — queried anywhere else (Milan, Tokyo, …)
 * the "backend" answers with no venues instead of leaking South Bohemian
 * pubs across the globe.
 *
 * Approximated as the country's bounding box (Aš to Bukovec, Vyšší Brod to
 * Lobendava); border-precise polygons buy nothing in a simulation.
 */
export const CZECH_REPUBLIC_BOUNDS: LatLngBounds = {
  southWest: { latitude: 48.55, longitude: 12.09 },
  northEast: { latitude: 51.06, longitude: 18.87 },
};

/** True when the point lies inside the covered region. */
export function isWithinCoverage(point: LatLng): boolean {
  return boundsContain(CZECH_REPUBLIC_BOUNDS, point);
}

/** True when any part of the box overlaps the covered region. */
export function intersectsCoverage(bounds: LatLngBounds): boolean {
  return boundsIntersect(bounds, CZECH_REPUBLIC_BOUNDS);
}
