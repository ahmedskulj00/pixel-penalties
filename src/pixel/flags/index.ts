import { toPaths, type PixelArt } from '../paths';
import { FLAG_H, FLAG_W, fill } from './painter';
import { FLAG_SPECS } from './specs';

export { FLAG_W, FLAG_H, FLAG_SPECS };

const W = FLAG_W;
const H = FLAG_H;

const flagCache = new Map<string, PixelArt>();

/** A nation's flag as SVG paths, painted once and cached. */
export function getFlagArt(id: string): PixelArt {
  let art = flagCache.get(id);
  if (art) return art;
  const px = new Array<string>(W * H).fill('#888888');
  for (const op of FLAG_SPECS[id] ?? [fill('#888888')]) op(px);
  art = { w: W, h: H, paths: toPaths(px, W, H) };
  flagCache.set(id, art);
  return art;
}
