/** Kit patterns and shirt numbers, stamped onto a figure's grid. */
import type { KitPattern } from '@/types';
import { SLOT, type Grid } from './grid';

const { SHIRT, SHIRT2, ALT, NUM } = SLOT;

export function applyPattern(g: Grid, pattern?: KitPattern): Grid {
  if (!pattern) return g;
  const { w, h, d } = g;
  const out = Uint8Array.from(d);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = d[y * w + x];
      if (v !== SHIRT && v !== SHIRT2) continue;
      const on =
        pattern === 'checks'
          ? ((x >> 1) + (y >> 1)) % 2 === 0
          : pattern === 'sash'
            ? Math.abs(x - (w - 1 - y * 0.6)) < 2.2
            : pattern === 'stripes'
              ? (x >> 1) % 2 === 0
              : x < w / 2;
      if (on) out[y * w + x] = ALT;
    }
  }
  return { w, h, d: out };
}

const DIGITS: readonly (readonly string[])[] = [
  ['###', '#.#', '#.#', '#.#', '###'],
  ['.#.', '##.', '.#.', '.#.', '###'],
  ['###', '..#', '###', '#..', '###'],
  ['###', '..#', '.##', '..#', '###'],
  ['#.#', '#.#', '###', '..#', '..#'],
  ['###', '#..', '###', '..#', '###'],
  ['###', '#..', '###', '#.#', '###'],
  ['###', '..#', '..#', '.#.', '.#.'],
  ['###', '#.#', '###', '#.#', '###'],
  ['###', '#.#', '###', '..#', '###'],
];

export function stampNumber(g: Grid, number: number, centerX: number, top: number): Grid {
  const { w, d } = g;
  const out = Uint8Array.from(d);
  const digits = String(number).split('').map(Number);
  const width = digits.length * 3 + (digits.length - 1);
  let x0 = Math.floor(centerX - width / 2);
  for (const n of digits) {
    DIGITS[n].forEach((row, j) => {
      for (let i = 0; i < 3; i++) if (row[i] === '#') out[(top + j) * w + x0 + i] = NUM;
    });
    x0 += 4;
  }
  return { ...g, d: out };
}
