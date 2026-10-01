import type { Tournament } from '@/types';
import { Badge } from '@/components/Badge';
import { TrophyIcon } from '@/components/TrophyIcon';
import { COMPETITIONS, GROUPS, editionStats } from '@/data/competitions';
import './CompetitionStep.css';

export interface CompetitionStepProps {
  onPick: (compId: string) => void;
  /** The saved tournament, which a new one would replace. */
  saved: Tournament | null;
}

/** Step 1: every competition, grouped by confederation. */
export function CompetitionStep({ onPick, saved }: CompetitionStepProps) {
  return (
    <div className="step-body">
      {saved?.status === 'playing' && <p className="notice">Starting a new tournament replaces the one you have in progress.</p>}
      {GROUPS.map((g) => (
        <section key={g.id} className="group" aria-labelledby={`g-${g.id}`}>
          <h2 id={`g-${g.id}`} className="section-title">
            {g.label}
          </h2>
          <div className="card-grid">
            {COMPETITIONS.filter((c) => c.group === g.id).map((c) => {
              const s = editionStats(c);
              return (
                <button key={c.id} type="button" className="card comp-card" onClick={() => onPick(c.id)}>
                  <TrophyIcon kind={c.trophy} scale={3} className="comp-card__trophy" />
                  <span className="comp-card__text">
                    <span className="card__title">{c.name}</span>
                    <span className="card__meta">{s.first === s.last ? s.first : `${s.first}–${s.last}`}</span>
                    <span className="card__blurb">{c.blurb}</span>
                    <span className="card__tags">
                      {s.played > 0 && <Badge tone="neutral">{s.played === 1 ? '1 edition' : `${s.played} editions`}</Badge>}
                      {s.upcoming > 0 && <Badge tone="new">{s.upcoming} upcoming</Badge>}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
