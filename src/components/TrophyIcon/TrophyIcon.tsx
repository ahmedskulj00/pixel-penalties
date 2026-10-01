import { memo } from 'react';
import type { TrophyTier } from '@/types';
import { TROPHY_PALETTES } from '@/pixel/palettes';
import { PixelSprite } from '../PixelSprite';

export interface TrophyIconProps {
  /** Trophy colour, or 'locked' for one not yet won. */
  kind?: TrophyTier | 'locked';
  scale?: number;
  className?: string;
  label?: string;
}

function TrophyIconView({ kind = 'gold', scale = 3, className, label }: TrophyIconProps) {
  return <PixelSprite pose="trophy" palette={TROPHY_PALETTES[kind] ?? TROPHY_PALETTES.gold} scale={scale} className={className} label={label} />;
}

export const TrophyIcon = memo(TrophyIconView);
