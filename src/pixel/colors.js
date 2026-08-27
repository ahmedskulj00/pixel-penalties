import { hashString } from '../engine/rng.js';

export const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const rgbToHex = (r, g, b) =>
  `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;

export function shade(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const f = amount < 0 ? 1 + amount : 1;
  const add = amount > 0 ? 255 * amount : 0;
  return rgbToHex(r * f + add * (1 - r / 255), g * f + add * (1 - g / 255), b * f + add * (1 - b / 255));
}

export function colorDistance(a, b) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const rm = (r1 + r2) / 2;
  return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2);
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Readable ink colour on top of a background colour. */
export const inkOn = (hex) => (luminance(hex) > 0.4 ? '#1a1c2c' : '#ffffff');

const SKINS = [
  ['#f3cfb3', '#d9a988'],
  ['#e8b992', '#c98f68'],
  ['#c98c5c', '#a66c40'],
  ['#8f5b3b', '#70432a'],
  ['#5e3b27', '#442a1b'],
];
const SKIN_WEIGHTS = [3, 3, 2, 1.3, 1];
const HAIR = ['#2a1c14', '#4b3021', '#7a4a26', '#c9a24f', '#a3522a', '#151515', '#8a8a8a'];
const KEEPER_SHIRTS = ['#39d353', '#ffd23f', '#ff7a2f', '#9b6bff', '#19c3d6', '#ff5fa2', '#27293d'];

export const OUTLINE = '#1a1c2c';

function pickWeighted(seed, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = ((seed % 10007) / 10007) * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

/** Deterministic look for a player, so number 9 of Spain always looks the same. */
export function playerLook(nationId, number) {
  const h = hashString(`${nationId}:${number}`);
  const skin = SKINS[pickWeighted(h, SKIN_WEIGHTS)];
  const hair = HAIR[(h >>> 8) % HAIR.length];
  return { skin, hair };
}

/** Goalkeeper shirt that stands out against both teams' outfield kits. */
export function keeperShirt(ownKit, opponentKit) {
  let best = KEEPER_SHIRTS[0];
  let bestScore = -1;
  for (const c of KEEPER_SHIRTS) {
    const score = Math.min(
      colorDistance(c, ownKit.shirt),
      colorDistance(c, opponentKit.shirt),
      colorDistance(c, ownKit.trim) * 1.3,
      colorDistance(c, '#3c9a4f') * 1.6,
    );
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

/**
 * Palette indexed by sprite slot (see SLOT in sprites.js).
 * role: 'kicker' uses the team kit; 'keeper' uses a contrasting goalkeeper kit.
 */
export function playerPalette(kit, look, { keeper = null } = {}) {
  const shirt = keeper ?? kit.shirt;
  const trim = keeper ? shade(keeper, -0.45) : kit.trim;
  const shorts = keeper ? shade(keeper, -0.55) : kit.shorts;
  const socks = keeper ?? kit.socks;
  return [
    'none',
    OUTLINE,
    look.skin[0],
    look.skin[1],
    look.hair,
    shirt,
    shade(shirt, -0.2),
    trim,
    shorts,
    shade(shorts, -0.2),
    socks,
    '#23232e',
    keeper ? '#f4f4f4' : look.skin[0],
    '#1a1c2c',
    '#ffffff',
    keeper ? shirt : (kit.alt ?? shirt),
    trim === shirt ? inkOn(shirt) : trim,
    '#1a1c2c',
  ];
}

export const TROPHY_PALETTES = {
  gold: ['none', OUTLINE, 0, 0, 0, '#f5c542', '#c9961a', 0, '#5b3a1e', 0, 0, 0, 0, 0, '#fff4c2'],
  silver: ['none', OUTLINE, 0, 0, 0, '#dfe4ec', '#9aa3b2', 0, '#2d3250', 0, 0, 0, 0, 0, '#ffffff'],
  bronze: ['none', OUTLINE, 0, 0, 0, '#d9955a', '#9a5b2c', 0, '#3b2a1e', 0, 0, 0, 0, 0, '#ffe3c7'],
  locked: ['none', '#00000033', 0, 0, 0, '#00000022', '#00000033', 0, '#00000033', 0, 0, 0, 0, 0, '#00000011'],
};

export const BALL_PALETTE = ['none', OUTLINE, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '#ffffff', 0, 0, '#262833'];
