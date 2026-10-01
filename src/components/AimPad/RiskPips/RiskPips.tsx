import './RiskPips.css';

/** One to three pips showing how risky a spot is. */
export function RiskPips({ level }: { level: number }) {
  return (
    <span className="pips" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span key={i} className={`pips__pip${i <= level ? ' is-on' : ''}`} />
      ))}
    </span>
  );
}
