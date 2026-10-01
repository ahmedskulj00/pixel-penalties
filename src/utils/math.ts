export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** The smallest power of two that holds `n` (at least 2). */
export const nextPow2 = (n: number): number => 2 ** Math.ceil(Math.log2(Math.max(2, n)));
