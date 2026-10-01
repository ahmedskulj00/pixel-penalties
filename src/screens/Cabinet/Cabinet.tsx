import { Button } from '@/components/Button';
import { Flag } from '@/components/Flag';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TrophyIcon } from '@/components/TrophyIcon';
import { COMPETITIONS, TOTAL_EDITIONS, getCompetition, getEdition, knownTrophies } from '@/data/competitions';
import { NATION_BY_ID, getNation, nameIn } from '@/data/nations';
import { useCabinet, useStats } from '@/state';
import { percent } from '@/utils/format';
import './Cabinet.css';

/** Trophies won, by competition, and the player's shootout record. */
export interface CabinetProps {
  onHome: () => void;
  onSetup: () => void;
}

export function Cabinet({ onHome, onSetup }: CabinetProps) {
  const saved = useCabinet();
  const stats = useStats();
  // Trophies from competitions that have since been retired stay saved but are not shown.
  const cabinet = knownTrophies(saved).filter((t) => NATION_BY_ID.has(t.nationId));
  const byComp = COMPETITIONS.map((c) => ({ comp: c, items: cabinet.filter((t) => t.compId === c.id) })).filter((g) => g.items.length);
  const uniqueEditions = new Set(cabinet.map((t) => `${t.compId}/${t.editionId}`)).size;

  return (
    <div className="cabinet">
      <ScreenHeader backLabel="Back to menu" onBack={onHome}>
        <h1 className="screen-title">Trophy cabinet</h1>
        <p className="muted">
          {uniqueEditions} of {TOTAL_EDITIONS} editions won
        </p>
      </ScreenHeader>

      <div className="progress" aria-hidden="true">
        <span className="progress__fill" style={{ width: `${(uniqueEditions / TOTAL_EDITIONS) * 100}%` }} />
      </div>

      <dl className="stat-grid">
        <div className="stat frame">
          <dt>Shootouts won</dt>
          <dd>
            {stats.shootoutsWon}
            <small>/{stats.shootouts}</small>
          </dd>
        </div>
        <div className="stat frame">
          <dt>Penalties scored</dt>
          <dd>
            {stats.scored}
            <small>{percent(stats.scored, stats.taken)}</small>
          </dd>
        </div>
        <div className="stat frame">
          <dt>Penalties saved</dt>
          <dd>
            {stats.saved}
            <small>{percent(stats.saved, stats.faced)}</small>
          </dd>
        </div>
        <div className="stat frame">
          <dt>Best scoring run</dt>
          <dd>{stats.bestStreak}</dd>
        </div>
        <div className="stat frame">
          <dt>Panenkas scored</dt>
          <dd>{stats.panenkas}</dd>
        </div>
      </dl>

      {byComp.length === 0 ? (
        <div className="empty frame">
          <TrophyIcon kind="locked" scale={5} />
          <p>No trophies yet. Win any tournament and it lands on this shelf.</p>
          <Button variant="primary" onClick={onSetup}>
            Start a tournament
          </Button>
        </div>
      ) : (
        byComp.map(({ comp, items }) => (
          <section key={comp.id} className="shelf" aria-labelledby={`shelf-${comp.id}`}>
            <h2 id={`shelf-${comp.id}`} className="section-title">
              {comp.name}
            </h2>
            <ul className="shelf__row">
              {items.map((t) => {
                const edition = getEdition(getCompetition(t.compId), t.editionId);
                return (
                  <li key={`${t.editionId}-${t.nationId}`} className="shelf__item">
                    <TrophyIcon kind={comp.trophy} scale={3} />
                    <span className="shelf__year">{edition.label}</span>
                    <span className="shelf__team">
                      <Flag id={t.nationId} size="xs" />
                      {nameIn(getNation(t.nationId), edition.year)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
