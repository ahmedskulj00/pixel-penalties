import './Pitch.css';

/** Grass stripes and chalk lines. */
const STRIPES: readonly number[] = [52, 60, 69, 79, 90, 102, 115, 129, 144, 161, 180];

export function Pitch() {
  return (
    <g>
      {STRIPES.slice(0, -1).map((y, i) => (
        <rect key={y} x="0" y={y} width="320" height={STRIPES[i + 1] - y} className={i % 2 ? 'sc-grass-b' : 'sc-grass-a'} />
      ))}
      <rect x="0" y="100" width="320" height="1" className="sc-chalk" />
      <path className="sc-lines" d="M81 100.5L73 113.5H247L239 100.5" />
      <path className="sc-lines" d="M30 100.5L5 150.5H315L290 100.5" />
      <path className="sc-lines" d="M131 150.5Q160 163 189 150.5" />
      <rect x="158" y="137" width="4" height="2" className="sc-chalk" />
    </g>
  );
}
