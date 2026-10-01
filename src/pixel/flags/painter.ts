/**
 * The flag painter: a tiny vocabulary of operations on a 27×18 grid of colours (3:2).
 * Each operation returns a function that paints the grid in place.
 */
import { PLUS, STAR5, STAR7 } from './emblems';

/** A W×H grid of colours, row by row. */
export type Pixels = string[];
/** One painting step. */
export type PaintOp = (px: Pixels) => void;
/** Is the point (x, y), in pixel units, inside the shape? */
export type Test = (x: number, y: number) => boolean;
/** A pixel mask: one string per row, '.' for empty. */
export type Mask = readonly string[];
/** A colour, or a colour per mask cell. */
export type CellColor = string | ((i: number, j: number) => string | null);

export const FLAG_W = 27;

export const FLAG_H = 18;

const W = FLAG_W;

const H = FLAG_H;

const inside = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < W && y < H;

export const fill =
  (c: string): PaintOp =>
  (px) =>
    px.fill(c);

function edges(weights: readonly number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  return weights.map((w) => Math.round(((acc += w) / sum) * total));
}

export const hs =
  (colors: readonly string[], weights: readonly number[] = colors.map(() => 1)): PaintOp =>
  (px) => {
    const e = edges(weights, H);
    for (let y = 0; y < H; y++) {
      const i = e.findIndex((edge) => y < edge);
      for (let x = 0; x < W; x++) px[y * W + x] = colors[i];
    }
  };

export const vs =
  (colors: readonly string[], weights: readonly number[] = colors.map(() => 1)): PaintOp =>
  (px) => {
    const e = edges(weights, W);
    for (let x = 0; x < W; x++) {
      const i = e.findIndex((edge) => x < edge);
      for (let y = 0; y < H; y++) px[y * W + x] = colors[i];
    }
  };

export const rect =
  (c: string, x: number, y: number, w: number, h: number): PaintOp =>
  (px) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (inside(i, j)) px[j * W + i] = c;
  };

/** Upright cross; x0 = left edge of the vertical bar (Nordic crosses sit towards the hoist). */
export const cross =
  (c: string, t = 4, x0 = Math.round(W / 2 - t / 2)): PaintOp =>
  (px) => {
    const y0 = Math.round(H / 2 - t / 2);
    rect(c, x0, 0, t, H)(px);
    rect(c, 0, y0, W, t)(px);
  };

export const nordic = (c: string, t = 4, x0 = 8): PaintOp => cross(c, t, x0);

export const each =
  (test: Test) =>
  (c: string): PaintOp =>
  (px) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (test(x + 0.5, y + 0.5)) px[y * W + x] = c;
  };

export const saltire = (c: string, t: number): PaintOp =>
  each((x, y) => {
    const n = Math.hypot(W, H);
    return Math.abs(H * x - W * y) / n < t / 2 || Math.abs(H * x - W * (H - y)) / n < t / 2;
  })(c);

export const disc = (c: string, cx: number, cy: number, r: number): PaintOp => each((x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r)(c);

export const ring = (c: string, cx: number, cy: number, r1: number, r2: number): PaintOp =>
  each((x, y) => {
    const d = (x - cx) ** 2 + (y - cy) ** 2;
    return d <= r1 * r1 && d > r2 * r2;
  })(c);

export const crescent = (c: string, cx: number, cy: number, r: number, dx: number, r2: number): PaintOp =>
  each((x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r && (x - cx - dx) ** 2 + (y - cy) ** 2 > r2 * r2)(c);

export const hoistTriangle = (c: string, depth: number): PaintOp => each((x, y) => x < depth * (1 - Math.abs(y - H / 2) / (H / 2)))(c);

/** Paint a string mask. `map` gives colours per character; '#' uses `c`. `outline` rings it. */
export const mask =
  (
    rows: Mask,
    c: CellColor,
    x0: number,
    y0: number,
    { map = {}, outline }: { map?: Readonly<Record<string, string | null>>; outline?: string } = {},
  ): PaintOp =>
  (px) => {
    const colorOf = (ch: string, i: number, j: number): string | null | undefined => (ch === '#' ? (typeof c === 'function' ? c(i, j) : c) : map[ch]);
    if (outline) {
      rows.forEach((row, j) =>
        [...row].forEach((ch, i) => {
          if (ch === '.') return;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (inside(x0 + i + dx, y0 + j + dy)) px[(y0 + j + dy) * W + x0 + i + dx] = outline;
        }),
      );
    }
    rows.forEach((row, j) =>
      [...row].forEach((ch, i) => {
        const col = ch === '.' ? null : colorOf(ch, i, j);
        if (col && inside(x0 + i, y0 + j)) px[(y0 + j) * W + x0 + i] = col;
      }),
    );
  };

export const dots =
  (c: string, points: readonly (readonly [number, number])[]): PaintOp =>
  (px) =>
    points.forEach(([x, y]) => inside(x, y) && (px[y * W + x] = c));

/** Scalable five-pointed star: point-in-polygon on its ten vertices. */
function inStar(x: number, y: number, cx: number, cy: number, r: number): boolean {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.5 : r;
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  let hit = false;
  for (let i = 0, j = 9; i < 10; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** Stars: hand-drawn sprites while small (polygons alias into stick figures), true geometry when large. */
export const star = (c: string, cx: number, cy: number, r: number): PaintOp =>
  r < 1.6
    ? mask(PLUS, c, Math.round(cx - 1.5), Math.round(cy - 1.5))
    : r < 2.8
      ? mask(STAR5, c, Math.round(cx - 2.5), Math.round(cy - 2.5))
      : r < 4
        ? mask(STAR7, c, Math.round(cx - 3.5), Math.round(cy - 3.5))
        : each((x, y) => inStar(x, y, cx, cy, r))(c);

/** Diagonal band of full width t: dir 1 runs bottom-left → top-right, dir -1 top-left → bottom-right. */
export const band = (c: string, t: number, dir = 1, offset = 0): PaintOp => {
  const n = Math.hypot(W, H);
  return each((x, y) => Math.abs((dir === 1 ? H * x + W * y - W * H : H * x - W * y) / n - offset) < t / 2)(c);
};

/** Area above the bottom-left → top-right diagonal (k moves the split towards the corners). */
export const upperLeft = (c: string, k = 1): PaintOp => each((x, y) => H * x + W * y < W * H * k)(c);

export const lowerRight = (c: string, k = 1): PaintOp => each((x, y) => H * x + W * y > W * H * k)(c);

/** Area below the top-left → bottom-right diagonal. */
export const lowerLeft = (c: string): PaintOp => each((x, y) => H * x < W * y)(c);

/** Serrated hoist (Bahrain, Qatar). */
export const serrated = (c: string, base: number, amp: number, teeth: number): PaintOp =>
  each((x, y) => {
    const f = ((y / H) * teeth) % 1;
    return x < base + amp * (1 - Math.abs(f - 0.5) * 2);
  })(c);

/** A miniature Union Jack in the canton of the British ensigns. */
export const unionCanton =
  (cw = 13, ch = 9): PaintOp =>
  (px) => {
    const n = Math.hypot(cw, ch);
    for (let y = 0; y < ch; y++)
      for (let x = 0; x < cw; x++) {
        const fx = x + 0.5;
        const fy = y + 0.5;
        const d1 = Math.abs(ch * fx - cw * fy) / n;
        const d2 = Math.abs(ch * fx - cw * (ch - fy)) / n;
        let col = '#012169';
        if (d1 < 1.2 || d2 < 1.2) col = '#ffffff';
        if (d1 < 0.45 || d2 < 0.45) col = '#c8102e';
        if (Math.abs(fx - cw / 2) < 1.7 || Math.abs(fy - ch / 2) < 1.7) col = '#ffffff';
        if (Math.abs(fx - cw / 2) < 0.9 || Math.abs(fy - ch / 2) < 0.9) col = '#c8102e';
        px[y * W + x] = col;
      }
  };

/** Nepal's double pennant (pad grows it for the blue border). */
export const nepal =
  (pad: number): Test =>
  (x, y) =>
    (y < 9.5 + pad && x < 1.5 + pad + 13.5 * (1 - y / 9.5)) || (y > 7.5 - pad && x < 1.5 + pad + 12.5 * ((y - 7.5) / 10.5));

/** North Macedonia's sun rays. */
export const MKD_RAYS = (c: string): PaintOp =>
  each((x, y) => {
    const cx = W / 2;
    const cy = H / 2;
    const a = Math.atan2(y - cy, x - cx);
    const targets = [0, Math.PI, Math.PI / 2, -Math.PI / 2, Math.atan2(cy, cx), Math.atan2(cy, -cx), Math.atan2(-cy, cx), Math.atan2(-cy, -cx)];
    return targets.some((t) => {
      let d = Math.abs(a - t);
      if (d > Math.PI) d = 2 * Math.PI - d;
      return d < 0.17;
    });
  })(c);
