import { memo } from 'react';
import './Stars.css';

export interface StarsProps {
  /** Strength from 0 to 5; fractions fill part of a star. */
  rating: number;
  /** Announce the rating to screen readers. */
  label?: boolean;
}

const STAR: readonly string[] = ['..#..', '.###.', '#####', '.###.', '.#.#.'];

/** Path data for filled and empty star pixels; columns fill left to right for fractions. */
function starPaths(rating: number): { on: string; off: string } {
  const on: string[] = [];
  const off: string[] = [];
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
function StarsView({ rating, label = true }: StarsProps) {
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

export const Stars = memo(StarsView);
