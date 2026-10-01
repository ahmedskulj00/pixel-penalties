import { memo } from 'react';
import type { NationId } from '@/types';
import { NATION_BY_ID } from '@/data/nations';
import { FLAG_H, FLAG_W, getFlagArt } from '@/pixel/flags';
import './Flag.css';

export type FlagSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface FlagProps {
  id: NationId;
  size?: FlagSize;
  className?: string;
  /** Accessible name: true for the nation's name, or a custom name; decorative without. */
  label?: string | boolean;
}

function FlagView({ id, size = 'md', className = '', label }: FlagProps) {
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

// Repeats by the hundred in pickers, tables and brackets: memoised so a parent update only
// re-renders the flags whose props changed.
export const Flag = memo(FlagView);
