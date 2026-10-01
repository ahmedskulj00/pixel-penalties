// Renders every flag and sprite pose to an HTML contact sheet for visual QA: npm run sheet → dist/sheet.html.
import { mkdirSync, writeFileSync } from 'node:fs';
import type { NationId } from '@/types';
import { NATIONS, getNation } from '@/data/nations';
import { getFlagArt } from '@/pixel/flags';
import { BALL_PALETTE, TROPHY_PALETTES, keeperShirt, playerLook, playerPalette } from '@/pixel/palettes';
import { POSES, getArt } from '@/pixel/sprites';

/** Pixel art as run-length encoded paths, each keyed by a colour (flags) or a palette slot (sprites). */
interface Art<K> {
  w: number;
  h: number;
  paths: readonly (readonly [K, string])[];
}

const svg = <K>(art: Art<K>, fill: (key: K) => string | number, scale: number): string =>
  `<svg width="${art.w * scale}" height="${art.h * scale}" viewBox="0 0 ${art.w} ${art.h}" shape-rendering="crispEdges">${art.paths
    .map(([k, d]) => `<path d="${d}" fill="${fill(k)}"/>`)
    .join('')}</svg>`;

const flags = NATIONS.map((n) => `<figure>${svg(getFlagArt(n.id), (c) => c, 4)}<figcaption>${n.id}</figcaption></figure>`).join('');

const TEAMS: readonly NationId[] = ['ESP', 'CRO', 'ENG', 'NED', 'MON', 'VAT', 'SWE', 'URS'];
const KEEPER_POSES: readonly string[] = ['ready', 'stretch', 'dive'];
const sprites = TEAMS.map((id) => {
  const n = getNation(id);
  const pal = playerPalette(n.kit, playerLook(id, 9));
  const gk = playerPalette(n.kit, playerLook(id, 1), { keeper: keeperShirt(n.kit, NATIONS[0].kit) });
  const cells = POSES.filter((p) => p !== 'ball' && p !== 'trophy').map((p) => {
    const keeperPose = KEEPER_POSES.includes(p);
    const art = getArt(p, { pattern: keeperPose ? undefined : n.kit.pattern, number: keeperPose ? undefined : 10 });
    return svg(art, (k) => (keeperPose ? gk : pal)[Number(k)], 5);
  });
  return `<div class="row"><b>${id}</b>${cells.join('')}</div>`;
}).join('');

const TIERS = ['gold', 'silver', 'bronze'] as const;
const props =
  TIERS.map((t) => svg(getArt('trophy'), (k) => TROPHY_PALETTES[t][Number(k)], 5)).join('') + svg(getArt('ball'), (k) => BALL_PALETTE[Number(k)], 8);

mkdirSync('dist', { recursive: true });
writeFileSync(
  'dist/sheet.html',
  `<!doctype html><meta charset="utf-8"><style>body{background:#9cc;font:12px monospace;margin:16px}.flags{display:grid;grid-template-columns:repeat(10,1fr);gap:8px}figure{margin:0}.row{display:flex;gap:10px;align-items:flex-end;margin:6px 0}.row b{width:40px}</style>
  <div class="flags">${flags}</div><div>${sprites}</div><div class="row">${props}</div>`,
);
console.log('sheet written');
