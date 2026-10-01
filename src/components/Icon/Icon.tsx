import './Icon.css';

export interface IconProps {
  /** Path data on the 8×8 grid. */
  d: string;
  label?: string;
}

/** A pixel icon drawn on an 8×8 grid. Decorative unless it has a label. */
export function Icon({ d, label }: IconProps) {
  return (
    <svg className="icon" viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden={label ? undefined : true} aria-label={label}>
      <path d={d} />
    </svg>
  );
}
