import {
  BEER_CATALOG,
  FEATURE_CHANCES,
  NO_TAP_CHANCE,
  STREET_NAMES,
  TAP_COUNT_RANGE,
  TYPE_OPENING_HOURS,
  TYPE_PRICE_PREMIUM,
  TYPE_WEIGHTS,
  VENUE_NAMES,
  type CatalogBeer,
} from './czechData';
import { CZECH_REPUBLIC_BOUNDS } from './coverage';
import { boundsAround, boundsContain, boundsIntersection, haversineMeters } from './geo';
import { chance, createRng, pick, rngFloat, rngInt, type Rng } from './random';
import type { LatLng, LatLngBounds, TapBeer, Venue, VenueFeature, VenueType } from '../types/models';

/**
 * Deterministic world generator. The map is divided into a fixed global grid
 * (~500 m cells, calibrated for Czech latitudes); each cell deterministically
 * spawns 0–2 venues from its own seed. The same place on Earth therefore
 * always produces the same pubs, regardless of where you query from — a
 * stable, offline-friendly simulation of a real venue database.
 *
 * The world is geofenced to `CZECH_REPUBLIC_BOUNDS`: cells outside the
 * country's box are empty by definition, so a viewport over Milan or Tokyo
 * yields no venues — Czech mock pubs never leak onto foreign maps.
 */

const LAT_CELL = 0.0045; // ≈ 500 m
const LNG_CELL = 0.007; // ≈ 500 m at ~50° N
const DAY_MS = 24 * 60 * 60 * 1000;

function weightedType(rng: Rng): VenueType {
  const roll = rng();
  let acc = 0;
  for (const { type, weight } of TYPE_WEIGHTS) {
    acc += weight;
    if (roll < acc) return type;
  }
  return 'pub';
}

function buildTapBeers(rng: Rng, venueId: string, type: VenueType): TapBeer[] {
  if (chance(rng, NO_TAP_CHANCE[type])) {
    return []; // bottled-only venue — the on-tap guard will drop it
  }

  const [minTaps, maxTaps] = TAP_COUNT_RANGE[type];
  const count = rngInt(rng, minTaps, maxTaps);
  const pool = [...BEER_CATALOG];
  const beers: TapBeer[] = [];

  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const index = rngInt(rng, 0, pool.length - 1);
    const catalog: CatalogBeer = pool.splice(index, 1)[0];
    const isCraft = catalog.basePriceCzk > 70;
    const price = Math.max(
      35,
      Math.round(catalog.basePriceCzk + TYPE_PRICE_PREMIUM[type] + rngFloat(rng, -4, 9)),
    );

    beers.push({
      id: `${venueId}_${catalog.id}`,
      catalogId: catalog.id,
      name: catalog.name,
      brewery: catalog.brewery,
      style: catalog.style,
      degreesPlato: catalog.degreesPlato,
      abv: catalog.abv,
      volumeMl: isCraft && chance(rng, 0.3) ? 400 : 500,
      priceCzk: price,
      lastVerifiedAt: new Date(Date.now() - rngFloat(rng, 0.02, 14) * DAY_MS).toISOString(),
      confirmations: rngInt(rng, 0, 40),
      disputes: rngInt(rng, 0, 3),
    });
  }

  return beers;
}

function buildFeatures(rng: Rng, type: VenueType): VenueFeature[] {
  const features: VenueFeature[] = [];
  for (const [feature, probability] of Object.entries(FEATURE_CHANCES[type]) as [
    VenueFeature,
    number,
  ][]) {
    if (chance(rng, probability)) features.push(feature);
  }
  return features;
}

function buildVenue(cellX: number, cellY: number, index: number): Venue {
  const id = `v_${cellX}_${cellY}_${index}`;
  const rng = createRng(`nearestpub:${id}`);

  const type = weightedType(rng);
  const latitude = (cellY + rng()) * LAT_CELL;
  const longitude = (cellX + rng()) * LNG_CELL;
  const priceLevel = (rngInt(rng, 1, 3) as Venue['priceLevel']);

  return {
    id,
    name: pick(rng, VENUE_NAMES[type]),
    type,
    coordinate: { latitude, longitude },
    address: `${pick(rng, STREET_NAMES)} ${rngInt(rng, 1, 58)}`,
    openingHours: pick(rng, TYPE_OPENING_HOURS[type]),
    rating: Math.round(rngFloat(rng, 3.6, 4.9) * 10) / 10,
    ratingCount: rngInt(rng, 40, 900),
    priceLevel,
    features: buildFeatures(rng, type),
    tapBeers: buildTapBeers(rng, id, type),
  };
}

/**
 * Returns every venue (including ones without tap beer — filtering is the
 * API layer's job) inside `bounds`, geofenced to the covered country. A box
 * with no overlap with the coverage area yields `[]`.
 */
export function generateVenuesInBounds(bounds: LatLngBounds): Venue[] {
  const queryable = boundsIntersection(bounds, CZECH_REPUBLIC_BOUNDS);
  if (queryable === null) return [];

  const minCellY = Math.floor(queryable.southWest.latitude / LAT_CELL);
  const maxCellY = Math.floor(queryable.northEast.latitude / LAT_CELL);
  const minCellX = Math.floor(queryable.southWest.longitude / LNG_CELL);
  const maxCellX = Math.floor(queryable.northEast.longitude / LNG_CELL);

  const venues: Venue[] = [];
  for (let cy = minCellY; cy <= maxCellY; cy += 1) {
    for (let cx = minCellX; cx <= maxCellX; cx += 1) {
      const cellRng = createRng(`nearestpub:cell:${cx}:${cy}`);
      const roll = cellRng();
      // ~1.0 venue per ~500 m cell on average — dense, city-like coverage.
      const count = roll < 0.45 ? 1 : roll < 0.62 ? 2 : roll < 0.7 ? 3 : 0;
      for (let i = 0; i < count; i += 1) {
        const venue = buildVenue(cx, cy, i);
        if (boundsContain(queryable, venue.coordinate)) {
          venues.push(venue);
        }
      }
    }
  }
  return venues;
}

/**
 * Returns every venue within `radiusMeters` of `center` — the circular query
 * used for "around me" loads, built on the same geofenced bounds query.
 */
export function generateVenuesAround(center: LatLng, radiusMeters = 2500): Venue[] {
  return generateVenuesInBounds(boundsAround(center, radiusMeters)).filter(
    (venue) => haversineMeters(center, venue.coordinate) <= radiusMeters,
  );
}
