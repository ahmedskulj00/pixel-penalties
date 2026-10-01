import type { KitPattern } from '@/types';
import type { Palette } from '@/pixel/palettes';
import { getArt, type Pose } from '@/pixel/sprites';
import { PixelPaths } from '../PixelPaths';

export interface PixelSpriteProps {
  pose: Pose;
  palette: Palette;
  /** Screen pixels per sprite pixel. */
  scale?: number;
  className?: string;
  /** Accessible name; without one the sprite is decorative. */
  label?: string;
  pattern?: KitPattern;
  number?: number;
}

/** A standalone sprite as its own small SVG. */
export function PixelSprite({ pose, palette, scale = 4, className, label, pattern, number }: PixelSpriteProps) {
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
