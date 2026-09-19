/**
 * Pixel sprites are drawn with rectangles on a small grid, outlined automatically and
 * converted into one SVG path per colour slot. Everything is cached, so a sprite costs a
 * handful of <path> elements no matter how many pixels it has.
 */

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

const { OUT, SKIN, SKIN2, HAIR, SHIRT, SHIRT2, TRIM, SHORTS, SHORTS2, SOCKS, BOOTS, GLOVES, EYE, WHITE, ALT, NUM, DARK } =
  SLOT;

/** Run-length encode a grid into [[value, pathData], …]. Works for slots and colour strings. */
export function toPaths(data, w, h) {
  const map = new Map();
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      const v = data[y * w + x];
      if (!v) {
        x++;
        continue;
      }
      let n = 1;
      while (x + n < w && data[y * w + x + n] === v) n++;
      map.set(v, (map.get(v) ?? '') + `M${x} ${y}h${n}v1h-${n}z`);
      x += n;
    }
  }
  return [...map.entries()];
}

/** Draw a figure of fw×fh pixels with a 1px margin for the outline. */
function figure(fw, fh, draw) {
  const w = fw + 2;
  const h = fh + 2;
  const d = new Uint8Array(w * h);
  const set = (x, y, v) => {
    const px = x + 1;
    const py = y + 1;
    if (px >= 0 && py >= 0 && px < w && py < h) d[py * w + px] = v;
  };
  const c = {
    set,
    rect(x, y, rw, rh, v) {
      for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) set(i, j, v);
    },
  };
  draw(c);
  return outline({ w, h, d });
}

function outline(g) {
  const { w, h, d } = g;
  const out = Uint8Array.from(d);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[y * w + x]) continue;
      const near =
        (x > 0 && d[y * w + x - 1]) ||
        (x < w - 1 && d[y * w + x + 1]) ||
        (y > 0 && d[(y - 1) * w + x]) ||
        (y < h - 1 && d[(y + 1) * w + x]);
      if (near) out[y * w + x] = OUT;
    }
  }
  return { w, h, d: out };
}

function mirror(g) {
  const { w, h, d } = g;
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + (w - 1 - x)] = d[y * w + x];
  return { w, h, d: out };
}

// ─── Kicker (seen from behind) ──────────────────────────────────────────────

function head(c, dx = 0, dy = 0, nape = true) {
  c.rect(4 + dx, 0 + dy, 6, 4, HAIR);
  if (nape) c.rect(5 + dx, 4 + dy, 4, 1, SKIN2);
  c.set(3 + dx, 2 + dy, SKIN);
  c.set(10 + dx, 2 + dy, SKIN);
  c.rect(6 + dx, 5, 2, 1, SKIN);
}

function torso(c, dx = 0) {
  c.rect(2 + dx, 6, 10, 7, SHIRT);
  c.rect(11 + dx, 6, 1, 7, SHIRT2);
  c.rect(5 + dx, 6, 4, 1, TRIM);
}

function shorts(c, dx = 0) {
  c.rect(3 + dx, 13, 8, 3, SHORTS);
  c.rect(10 + dx, 13, 1, 3, SHORTS2);
  c.rect(6 + dx, 15, 2, 1, 0);
}

function leg(c, x, lift = 0) {
  const bottom = 24 - lift;
  c.rect(x, 16, 3, 2, SKIN);
  c.rect(x, 18, 3, 1, TRIM);
  c.rect(x, 19, 3, bottom - 21, SOCKS);
  c.rect(x, bottom - 2, 3, 2, BOOTS);
}

function arm(c, x, top, len, cuff = true) {
  c.rect(x, top, 2, 2, SHIRT);
  if (cuff) c.rect(x, top + 2, 2, 1, TRIM);
  c.rect(x, top + 3, 2, len, SKIN);
  c.rect(x, top + 3 + len, 2, 1, SKIN2);
}

const kickerIdle = () =>
  figure(14, 24, (c) => {
    head(c);
    torso(c);
    arm(c, 0, 6, 3);
    arm(c, 12, 6, 3);
    shorts(c);
    leg(c, 3);
    leg(c, 8);
  });

const kickerRun = () =>
  figure(14, 24, (c) => {
    head(c);
    torso(c);
    arm(c, 0, 6, 2);
    arm(c, 12, 7, 3);
    shorts(c);
    leg(c, 3, 3);
    leg(c, 8);
  });

const kickerStrike = () =>
  figure(18, 24, (c) => {
    head(c, 2);
    torso(c, 2);
    c.rect(2, 6, 2, 2, SHIRT);
    c.rect(0, 7, 2, 2, SKIN);
    c.rect(14, 6, 2, 3, SHIRT);
    c.rect(16, 8, 2, 2, SKIN);
    shorts(c, 2);
    leg(c, 5);
    c.rect(10, 16, 3, 1, SKIN);
    c.rect(11, 17, 3, 1, SKIN);
    c.rect(12, 18, 3, 1, TRIM);
    c.rect(13, 19, 3, 1, SOCKS);
    c.rect(14, 20, 3, 1, SOCKS);
    c.rect(15, 21, 3, 2, BOOTS);
  });

const kickerCheer = () =>
  figure(14, 24, (c) => {
    head(c);
    torso(c);
    c.rect(0, 4, 2, 3, SHIRT);
    c.rect(12, 4, 2, 3, SHIRT);
    c.rect(0, 1, 2, 3, SKIN);
    c.rect(12, 1, 2, 3, SKIN);
    c.rect(0, 0, 2, 1, SKIN2);
    c.rect(12, 0, 2, 1, SKIN2);
    shorts(c);
    leg(c, 2);
    leg(c, 9);
  });

const kickerSad = () =>
  figure(14, 24, (c) => {
    head(c, 0, 1, false);
    torso(c);
    arm(c, 1, 7, 4, false);
    arm(c, 11, 7, 4, false);
    shorts(c);
    leg(c, 3);
    leg(c, 8);
  });

// ─── Goalkeeper (seen from the front) ────────────────────────────────────────

function face(c, x, y) {
  c.rect(x, y, 6, 2, HAIR);
  c.rect(x, y + 2, 6, 4, SKIN);
  c.set(x, y + 2, HAIR);
  c.set(x + 5, y + 2, HAIR);
  c.set(x + 1, y + 3, EYE);
  c.set(x + 4, y + 3, EYE);
  c.rect(x + 1, y + 5, 4, 1, SKIN2);
}

const keeperReady = () =>
  figure(16, 24, (c) => {
    face(c, 5, 0);
    c.rect(7, 6, 2, 1, SKIN);
    c.rect(4, 7, 8, 7, SHIRT);
    c.rect(11, 7, 1, 7, SHIRT2);
    c.rect(6, 7, 4, 1, TRIM);
    c.rect(2, 7, 2, 3, SHIRT);
    c.rect(12, 7, 2, 3, SHIRT);
    c.rect(1, 9, 2, 3, SHIRT);
    c.rect(13, 9, 2, 3, SHIRT);
    c.rect(0, 12, 3, 2, GLOVES);
    c.rect(13, 12, 3, 2, GLOVES);
    c.rect(5, 14, 6, 2, SHORTS);
    c.rect(10, 14, 1, 2, SHORTS2);
    c.rect(4, 16, 2, 2, SKIN);
    c.rect(10, 16, 2, 2, SKIN);
    c.rect(3, 18, 3, 4, SOCKS);
    c.rect(10, 18, 3, 4, SOCKS);
    c.rect(2, 22, 4, 2, BOOTS);
    c.rect(10, 22, 4, 2, BOOTS);
  });

const keeperStretch = () =>
  figure(16, 26, (c) => {
    c.rect(0, 0, 3, 2, GLOVES);
    c.rect(13, 0, 3, 2, GLOVES);
    c.rect(1, 2, 2, 5, SHIRT);
    c.rect(13, 2, 2, 5, SHIRT);
    face(c, 5, 2);
    c.rect(7, 8, 2, 1, SKIN);
    c.rect(3, 7, 10, 2, SHIRT);
    c.rect(4, 9, 8, 7, SHIRT);
    c.rect(11, 9, 1, 7, SHIRT2);
    c.rect(6, 9, 4, 1, TRIM);
    c.rect(5, 16, 6, 2, SHORTS);
    c.rect(5, 18, 2, 2, SKIN);
    c.rect(9, 18, 2, 2, SKIN);
    c.rect(5, 20, 2, 4, SOCKS);
    c.rect(9, 20, 2, 4, SOCKS);
    c.rect(4, 24, 3, 2, BOOTS);
    c.rect(9, 24, 3, 2, BOOTS);
  });

/** Full-stretch dive to the keeper's left (screen right). Mirrored for the other side. */
const keeperDive = () =>
  figure(27, 11, (c) => {
    c.rect(0, 1, 2, 3, BOOTS);
    c.rect(0, 6, 2, 3, BOOTS);
    c.rect(2, 1, 4, 3, SOCKS);
    c.rect(2, 6, 4, 3, SOCKS);
    c.rect(6, 2, 1, 2, SKIN);
    c.rect(6, 6, 1, 2, SKIN);
    c.rect(7, 2, 3, 6, SHORTS);
    c.rect(10, 2, 8, 7, SHIRT);
    c.rect(10, 8, 8, 1, SHIRT2);
    c.rect(18, 4, 1, 3, SKIN);
    c.rect(19, 3, 3, 5, SKIN);
    c.rect(22, 3, 2, 5, HAIR);
    c.set(20, 4, EYE);
    c.set(20, 6, EYE);
    c.rect(18, 1, 6, 2, SHIRT);
    c.rect(18, 8, 6, 2, SHIRT);
    c.rect(24, 0, 3, 3, GLOVES);
    c.rect(24, 8, 3, 3, GLOVES);
  });

// ─── Props ──────────────────────────────────────────────────────────────────

const ball = () =>
  figure(7, 7, (c) => {
    c.rect(2, 0, 3, 1, WHITE);
    c.rect(1, 1, 5, 1, WHITE);
    c.rect(0, 2, 7, 3, WHITE);
    c.rect(1, 5, 5, 1, WHITE);
    c.rect(2, 6, 3, 1, WHITE);
    // centre pentagon
    c.rect(2, 1, 3, 2, DARK);
    c.set(3, 3, DARK);
    // edge patches
    c.rect(0, 3, 1, 2, DARK);
    c.rect(6, 3, 1, 2, DARK);
    c.set(2, 5, DARK);
    c.set(4, 5, DARK);
  });

const trophy = () =>
  figure(12, 20, (c) => {
    c.rect(2, 0, 8, 1, WHITE);
    c.rect(2, 1, 8, 6, SHIRT);
    c.rect(3, 7, 6, 1, SHIRT);
    c.rect(4, 8, 4, 1, SHIRT);
    c.rect(5, 9, 2, 4, SHIRT);
    c.rect(3, 13, 6, 2, SHIRT);
    c.rect(2, 15, 8, 3, SHORTS);
    c.rect(0, 1, 2, 1, SHIRT);
    c.rect(0, 2, 1, 3, SHIRT);
    c.rect(0, 5, 2, 1, SHIRT);
    c.rect(10, 1, 2, 1, SHIRT);
    c.rect(11, 2, 1, 3, SHIRT);
    c.rect(10, 5, 2, 1, SHIRT);
    c.rect(8, 1, 2, 6, SHIRT2);
    c.rect(6, 9, 1, 4, SHIRT2);
    c.rect(3, 1, 1, 4, WHITE);
    c.rect(3, 16, 6, 1, SHIRT);
  });

// ─── Kit patterns and shirt numbers ─────────────────────────────────────────

function applyPattern(g, pattern) {
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

const DIGITS = [
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

function stampNumber(g, number, centerX, top) {
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

// ─── Public API ─────────────────────────────────────────────────────────────

const BASE = {
  idle: { build: kickerIdle, anchor: 'feet', back: 7.5 },
  runA: { build: kickerRun, anchor: 'feet', back: 7.5 },
  runB: { build: () => mirror(kickerRun()), anchor: 'feet', back: 7.5 },
  strike: { build: kickerStrike, anchor: 'feet', back: 9.5 },
  cheer: { build: kickerCheer, anchor: 'feet', back: 7.5 },
  sad: { build: kickerSad, anchor: 'feet', back: 7.5 },
  ready: { build: keeperReady, anchor: 'feet' },
  stretch: { build: keeperStretch, anchor: 'feet' },
  dive: { build: keeperDive, anchor: 'center' },
  ball: { build: ball, anchor: 'center' },
  trophy: { build: trophy, anchor: 'feet' },
};

const baseCache = new Map();
const artCache = new Map();

function baseGrid(pose) {
  let g = baseCache.get(pose);
  if (!g) {
    g = BASE[pose].build();
    baseCache.set(pose, g);
  }
  return g;
}

/**
 * Get renderable pixel art for a pose.
 * @returns {{w:number, h:number, paths:[number,string][], anchor:'feet'|'center'}}
 */
export function getArt(pose, { pattern, number } = {}) {
  const key = `${pose}|${pattern ?? ''}|${number ?? ''}`;
  let art = artCache.get(key);
  if (art) return art;
  let g = applyPattern(baseGrid(pose), pattern);
  const def = BASE[pose];
  if (number != null && def.back) g = stampNumber(g, number, def.back + 0.5, 8);
  art = { w: g.w, h: g.h, paths: toPaths(g.d, g.w, g.h), anchor: def.anchor };
  artCache.set(key, art);
  return art;
}

export const POSES = Object.keys(BASE);
