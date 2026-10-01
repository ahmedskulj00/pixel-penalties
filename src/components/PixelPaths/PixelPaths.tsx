import type { Palette } from '@/pixel/palettes';
import type { SpriteArt } from '@/pixel/sprites';

export interface PixelPathsProps {
  art: Pick<SpriteArt, 'paths'>;
  palette: Palette;
}

/** One <path> per colour slot of a sprite. */
export function PixelPaths({ art, palette }: PixelPathsProps) {
  // Sprites only use slots their palette fills, so every fill here is a colour.
  return art.paths.map(([slot, d]) => <path key={slot} d={d} fill={palette[slot] as string} />);
}
