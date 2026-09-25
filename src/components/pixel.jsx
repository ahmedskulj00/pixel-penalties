import { memo } from 'react';
import { getArt } from '../pixel/sprites.js';
import { getFlagArt, FLAG_W, FLAG_H } from '../pixel/flags.js';
import { TROPHY_PALETTES } from '../pixel/colors.js';
import { NATION_BY_ID } from '../data/nations.js';

export function PixelPaths({ art, palette }) {
  return art.paths.map(([slot, d]) => <path key={slot} d={d} fill={palette[slot]} />);
}

/** A sprite inside the scene SVG, anchored at its feet (or centre) so it can be moved and scaled from there. */
export function Actor({ pose, palette, pattern, number, flip = false }) {
  const art = getArt(pose, { pattern, number });
  const ox = -art.w / 2;
  const oy = art.anchor === 'feet' ? -art.h : -art.h / 2;
  return (
    <g transform={flip ? `scale(-1 1) translate(${ox} ${oy})` : `translate(${ox} ${oy})`}>
      <PixelPaths art={art} palette={palette} />
    </g>
  );
}

/** A standalone sprite as its own small SVG. */
export function PixelSprite({ pose, palette, scale = 4, className, label, pattern, number }) {
  const art = getArt(pose, { pattern, number });
  return (
    <svg
      className={className}
      width={art.w * scale}
      height={art.h * scale}
      viewBox={`0 0 ${art.w} ${art.h}`}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <PixelPaths art={art} palette={palette} />
    </svg>
  );
}

function FlagView({ id, size = 'md', className = '', label }) {
  const art = getFlagArt(id);
  const name = label === true ? NATION_BY_ID.get(id)?.name : label;
  return (
    <svg
      className={`flag flag--${size} ${className}`}
      viewBox={`0 0 ${FLAG_W} ${FLAG_H}`}
      shapeRendering="crispEdges"
      role={name ? 'img' : undefined}
      aria-label={name ? `Flag of ${name}` : undefined}
      aria-hidden={name ? undefined : true}
    >
      {art.paths.map(([color, d]) => (
        <path key={color} d={d} fill={color} />
      ))}
    </svg>
  );
}

function TrophyIconView({ kind = 'gold', scale = 3, className, label }) {
  return (
    <PixelSprite pose="trophy" palette={TROPHY_PALETTES[kind] ?? TROPHY_PALETTES.gold} scale={scale} className={className} label={label} />
  );
}

const STAR = ['..#..', '.###.', '#####', '.###.', '.#.#.'];

/** Path data for filled and empty star pixels; columns fill left to right for fractions. */
function starPaths(rating) {
  const on = [];
  const off = [];
  for (let s = 0; s < 5; s++) {
    for (let y = 0; y < STAR.length; y++) {
      for (let x = 0; x < STAR[y].length; x++) {
        if (STAR[y][x] !== '#') continue;
        const cmd = `M${s * 6 + x} ${y}h1v1h-1z`;
        if (s + (x + 0.5) / 5 <= rating) on.push(cmd);
        else off.push(cmd);
      }
    }
  }
  return { on: on.join(''), off: off.join('') };
}

/** Five pixel stars; fractional ratings fill column by column. */
function StarsView({ rating, label = true }) {
  const { on, off } = starPaths(rating);
  return (
    <svg
      className="stars"
      viewBox="0 0 29 5"
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label ? `Strength ${rating} out of 5` : undefined}
      aria-hidden={label ? undefined : true}
    >
      <path d={off} className="stars__off" />
      <path d={on} className="stars__on" />
    </svg>
  );
}

const MARK = {
  goal: 'M2 0h3v1h1v1h1v3h-1v1h-1v1h-3v-1h-1v-1h-1v-3h1v-1h1z',
  miss: 'M0 0h2v1h1v1h1v-1h1v-1h2v2h-1v1h-1v1h1v1h1v2h-2v-1h-1v-1h-1v1h-1v1h-2v-2h1v-1h1v-1h-1v-1h-1z',
  todo: 'M2 0h3v1h-3zM1 1h1v1h-1zM5 1h1v1h-1zM0 2h1v3h-1zM6 2h1v3h-1zM1 5h1v1h-1zM5 5h1v1h-1zM2 6h3v1h-3z',
};

/** One kick in the scoreboard: filled disc = scored, cross = missed, ring = to come. */
export function KickMark({ value }) {
  const kind = value === true ? 'goal' : value === false ? 'miss' : 'todo';
  return (
    <svg className={`mark mark--${kind}`} viewBox="0 0 7 7" shapeRendering="crispEdges" aria-hidden="true">
      <path d={MARK[kind]} />
    </svg>
  );
}

// Leaf components with primitive props that repeat by the hundred (nation pickers, tables,
// brackets): memoised so a parent update only re-renders the ones whose props changed.
export const Flag = memo(FlagView);
export const TrophyIcon = memo(TrophyIconView);
export const Stars = memo(StarsView);
