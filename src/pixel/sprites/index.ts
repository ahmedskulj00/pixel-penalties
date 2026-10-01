/**
 * Pixel sprites are drawn with rectangles on a small grid, outlined automatically and
 * converted into one SVG path per colour slot. Everything is cached, so a sprite costs a
 * handful of <path> elements no matter how many pixels it has.
 */
import type { KitPattern } from '@/types';
import { toPaths } from '../paths';
import { mirror, type Grid } from './grid';
import { applyPattern, stampNumber } from './kit';
import { kickerIdle, kickerRun, kickerStrike, kickerCheer, kickerSad, keeperReady, keeperStretch, keeperDive, ball, trophy } from './poses';

export { SLOT } from './grid';

export type Pose = 'idle' | 'runA' | 'runB' | 'strike' | 'cheer' | 'sad' | 'ready' | 'stretch' | 'dive' | 'ball' | 'trophy';

export interface SpriteArt {
  w: number;
  h: number;
  /** [slot, path data] pairs. */
  paths: [number, string][];
  anchor: 'feet' | 'center';
}

const BASE: Record<Pose, { build: () => Grid; anchor: SpriteArt['anchor']; back?: number }> = {
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

const baseCache = new Map<Pose, Grid>();

const artCache = new Map<string, SpriteArt>();

function baseGrid(pose: Pose): Grid {
  let g = baseCache.get(pose);
  if (!g) {
    g = BASE[pose].build();
    baseCache.set(pose, g);
  }
  return g;
}

/** Renderable pixel art for a pose, in a kit pattern and with a shirt number. */
export function getArt(pose: Pose, { pattern, number }: { pattern?: KitPattern; number?: number | null } = {}): SpriteArt {
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

export const POSES = Object.keys(BASE) as Pose[];
