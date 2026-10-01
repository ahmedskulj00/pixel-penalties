import type { KitPattern } from '@/types';
import type { Palette } from '@/pixel/palettes';
import { getArt, type Pose } from '@/pixel/sprites';
import { PixelPaths } from '../PixelPaths';

export interface ActorProps {
  pose: Pose;
  palette: Palette;
  pattern?: KitPattern;
  number?: number;
  /** Mirror the sprite (a keeper diving to the left). */
  flip?: boolean;
}

/** A sprite inside the scene SVG, anchored at its feet (or centre) so it can be moved and scaled from there. */
export function Actor({ pose, palette, pattern, number, flip = false }: ActorProps) {
  const art = getArt(pose, { pattern, number });
  const ox = -art.w / 2;
  const oy = art.anchor === 'feet' ? -art.h : -art.h / 2;
  return (
    <g transform={flip ? `scale(-1 1) translate(${ox} ${oy})` : `translate(${ox} ${oy})`}>
      <PixelPaths art={art} palette={palette} />
    </g>
  );
}
