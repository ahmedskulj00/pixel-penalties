/** A seeded random number generator, so tournaments are reproducible and testable. */
export interface Rng {
  /** A number in [0, 1). */
  next(): number;
  /** An integer in [0, n). */
  int(n: number): number;
  chance(p: number): boolean;
  pick<T>(list: readonly T[]): T;
  /** Index chosen with probability proportional to its weight. */
  weighted(weights: readonly number[]): number;
  shuffle<T>(list: readonly T[]): T[];
}

/** Small, fast, seedable PRNG (mulberry32). */
export function createRng(seed = 1): Rng {
  let s = seed >>> 0 || 0x9e3779b9;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (n) => Math.floor(next() * n),
    chance: (p) => next() < p,
    pick: <T>(list: readonly T[]) => list[Math.floor(next() * list.length)],
    weighted(weights) {
      const total = weights.reduce((a, b) => a + b, 0);
      let r = next() * total;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r < 0) return i;
      }
      return weights.length - 1;
    },
    shuffle<T>(list: readonly T[]) {
      const out = [...list];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}

export function newSeed(): number {
  if (globalThis.crypto?.getRandomValues) return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  return (Math.random() * 2 ** 32) >>> 0;
}

/** Derive a stable sub-seed, e.g. one per bracket match. */
export function deriveSeed(seed: number, ...parts: number[]): number {
  let h = seed >>> 0;
  for (const p of parts) h = Math.imul(h ^ (p + 0x9e3779b9 + (h << 6) + (h >>> 2)), 2654435761) >>> 0;
  return h;
}

/** Index picked by weight from a seed (the same seed always gives the same index). */
export function pickWeighted(seed: number, weights: readonly number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = ((seed % 10007) / 10007) * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}
