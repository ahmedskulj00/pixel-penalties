/** Figures are drawn with rectangles on a small grid of colour slots and outlined automatically. */

/** Colour slots: each is filled from a palette (see pixel/palettes.ts). 0 is transparent. */
export const SLOT = {
  OUT: 1,
  SKIN: 2,
  SKIN2: 3,
  HAIR: 4,
  SHIRT: 5,
  SHIRT2: 6,
  TRIM: 7,
  SHORTS: 8,
  SHORTS2: 9,
  SOCKS: 10,
  BOOTS: 11,
  GLOVES: 12,
  EYE: 13,
  WHITE: 14,
  ALT: 15,
  NUM: 16,
  DARK: 17,
};

/** A grid of colour slots, row by row. */
export interface Grid {
  w: number;
  h: number;
  d: Uint8Array;
}

/** What a figure is drawn with. */
export interface Canvas {
  set(x: number, y: number, v: number): void;
  rect(x: number, y: number, rw: number, rh: number, v: number): void;
}

/** Draw a figure of fw×fh pixels with a 1px margin for the outline. */
export function figure(fw: number, fh: number, draw: (c: Canvas) => void): Grid {
  const w = fw + 2;
  const h = fh + 2;
  const d = new Uint8Array(w * h);
  const set = (x: number, y: number, v: number) => {
    const px = x + 1;
    const py = y + 1;
    if (px >= 0 && py >= 0 && px < w && py < h) d[py * w + px] = v;
  };
  const c: Canvas = {
    set,
    rect(x, y, rw, rh, v) {
      for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) set(i, j, v);
    },
  };
  draw(c);
  return outline({ w, h, d });
}

function outline(g: Grid): Grid {
  const { w, h, d } = g;
  const out = Uint8Array.from(d);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[y * w + x]) continue;
      const near = (x > 0 && d[y * w + x - 1]) || (x < w - 1 && d[y * w + x + 1]) || (y > 0 && d[(y - 1) * w + x]) || (y < h - 1 && d[(y + 1) * w + x]);
      if (near) out[y * w + x] = SLOT.OUT;
    }
  }
  return { w, h, d: out };
}

export function mirror(g: Grid): Grid {
  const { w, h, d } = g;
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + (w - 1 - x)] = d[y * w + x];
  return { w, h, d: out };
}
