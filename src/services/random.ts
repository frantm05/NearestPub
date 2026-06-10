/**
 * Deterministic pseudo-randomness for the mock world. Seeding by stable keys
 * (grid cells, venue ids) keeps the generated pub landscape identical across
 * app restarts — the local-first backbone of the simulation.
 */

export type Rng = () => number;

/** xmur3 string hash → 32-bit seed. */
function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 — small, fast, good-enough PRNG returning [0, 1). */
export function createRng(seed: string): Rng {
  let a = hashSeed(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('pick() requires a non-empty array');
  }
  return items[Math.floor(rng() * items.length) % items.length];
}

/** Integer in [min, max], inclusive on both ends. */
export function rngInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function rngFloat(rng: Rng, min: number, max: number): number {
  return rng() * (max - min) + min;
}

export function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}
