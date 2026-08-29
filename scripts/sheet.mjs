// Renders every flag and sprite pose to an HTML contact sheet for visual QA.
import { writeFileSync } from 'node:fs';
import { NATIONS } from '../src/data/nations.js';
import { getFlagArt } from '../src/pixel/flags.js';
import { getArt, POSES } from '../src/pixel/sprites.js';
import { playerPalette, playerLook, keeperShirt, TROPHY_PALETTES, BALL_PALETTE } from '../src/pixel/colors.js';

const svg = (art, fill, scale) =>
  `<svg width="${art.w * scale}" height="${art.h * scale}" viewBox="0 0 ${art.w} ${art.h}" shape-rendering="crispEdges">${art.paths
    .map(([k, d]) => `<path d="${d}" fill="${fill(k)}"/>`)
    .join('')}</svg>`;

const flags = NATIONS.map(
  (n) => `<figure>${svg(getFlagArt(n.id), (c) => c, 4)}<figcaption>${n.id}</figcaption></figure>`,
).join('');

const teams = ['ESP', 'CRO', 'ENG', 'NED', 'MON', 'VAT', 'SWE', 'URS'];
const sprites = teams
  .map((id) => {
    const n = NATIONS.find((x) => x.id === id);
    const pal = playerPalette(n.kit, playerLook(id, 9));
    const gk = playerPalette(n.kit, playerLook(id, 1), { keeper: keeperShirt(n.kit, NATIONS[0].kit) });
    const cells = POSES.filter((p) => !['ball', 'trophy'].includes(p)).map((p) => {
      const keeperPose = ['ready', 'stretch', 'dive'].includes(p);
      const art = getArt(p, { pattern: keeperPose ? undefined : n.kit.pattern, number: keeperPose ? undefined : 10 });
      return svg(art, (k) => (keeperPose ? gk : pal)[k], 5);
    });
    return `<div class="row"><b>${id}</b>${cells.join('')}</div>`;
  })
  .join('');

const props = ['gold', 'silver', 'bronze'].map((t) => svg(getArt('trophy'), (k) => TROPHY_PALETTES[t][k], 5)).join('') + svg(getArt('ball'), (k) => BALL_PALETTE[k], 8);

writeFileSync(
  'dist/sheet.html',
  `<!doctype html><meta charset="utf-8"><style>body{background:#9cc;font:12px monospace;margin:16px}.flags{display:grid;grid-template-columns:repeat(10,1fr);gap:8px}figure{margin:0}.row{display:flex;gap:10px;align-items:flex-end;margin:6px 0}.row b{width:40px}</style>
  <div class="flags">${flags}</div><div>${sprites}</div><div class="row">${props}</div>`,
);
console.log('sheet written');
