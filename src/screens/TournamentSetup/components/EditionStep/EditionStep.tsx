import type { Competition, Edition } from '@/types';
import { formatLabel, formatOf } from '@/data/competitions';
import { Champion } from '../Champion';
import { Hosts } from '../Hosts';
import './EditionStep.css';

export interface EditionStepProps {
  comp: Competition;
  onPick: (editionId: string) => void;
}

/** Step 2: the editions of a competition, newest first, by decade when there are many. */
export function EditionStep({ comp, onPick }: EditionStepProps) {
  const editions = [...comp.editions].reverse();
  const byDecade = editions.length > 24;
  const groups: { key: string; items: Edition[] }[] = [];
  for (const e of editions) {
    const key = byDecade ? `${Math.floor(e.year / 10) * 10}s` : 'all';
    if (!groups.length || groups[groups.length - 1].key !== key) groups.push({ key, items: [] });
    groups[groups.length - 1].items.push(e);
  }
  return (
    <div className="step-body">
      <p className="lede lede--small">{comp.blurb}</p>
      {byDecade && (
        <nav className="decades" aria-label="Jump to decade">
          {groups.map((g) => (
            <button
              key={g.key}
              type="button"
              className="chip"
              onClick={() => document.getElementById(`dec-${comp.id}-${g.key}`)?.scrollIntoView({ block: 'start' })}
            >
              {g.key}
            </button>
          ))}
        </nav>
      )}
      {groups.map((g) => (
        <section key={g.key} id={`dec-${comp.id}-${g.key}`} className="group">
          {byDecade && <h2 className="section-title">{g.key}</h2>}
          <div className="card-grid card-grid--editions">
            {g.items.map((e) => (
              <button key={e.id} type="button" className={`card ed-card ed-card--${e.status}`} onClick={() => onPick(e.id)}>
                <span className="ed-card__year">{e.label}</span>
                {e.era && <span className="ed-card__era">{e.era}</span>}
                <span className="ed-card__format">{e.leagues ? 'Leagues A to D, then League A knockouts' : formatLabel(formatOf(comp, e))}</span>
                <Hosts edition={e} />
                <Champion edition={e} />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
