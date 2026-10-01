import type { Fixture, Tournament } from '@/types';
import { roundName, type KnockoutPreview } from '@/engine/tournament';
import { BracketMatch } from '../BracketMatch';
import './BracketView.css';

export interface BracketViewProps {
  t: Tournament;
  year: number;
  /** Placeholder labels before the knockout draw (and the bracket size). */
  preview: KnockoutPreview | null;
}

/** The knockout bracket, one column per round. */
export function BracketView({ t, year, preview }: BracketViewProps) {
  const size = t.rounds.length ? t.rounds[0].length * 2 : preview!.size;
  const roundCount = Math.log2(size);
  const columns: (Fixture | null)[][] = Array.from({ length: roundCount }, (_, r) => t.rounds[r] ?? Array.from({ length: size / 2 ** (r + 1) }, () => null));
  return (
    <div className="bracket" role="region" aria-label="Knockout bracket" tabIndex={0}>
      {columns.map((matches, r) => (
        <section key={r} className="bracket__round" aria-label={roundName(matches.length)}>
          <h3 className="bracket__title">{roundName(matches.length)}</h3>
          <div className="bracket__matches">
            {matches.map((m, i) => (
              <BracketMatch key={i} m={m} year={year} userId={t.userId} slots={!t.rounds.length && r === 0 ? preview?.first[i] : null} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
