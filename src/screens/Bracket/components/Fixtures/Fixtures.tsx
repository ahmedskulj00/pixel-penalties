import type { Group, NationId } from '@/types';
import { nameIn, getNation } from '@/data/nations';
import { FixtureTeam } from '../FixtureTeam';
import './Fixtures.css';

export interface FixturesProps {
  group: Group;
  userId: NationId;
  year: number;
  /** The matchday to mark as next, or -1. */
  nextDay: number;
}

/** Every matchday of the player's group, with results and rest days. */
export function Fixtures({ group, userId, year, nextDay }: FixturesProps) {
  return (
    <ol className="fixtures" aria-label={`Group ${group.name} fixtures`}>
      {group.days.map((day, d) => {
        const playing = new Set(day.flatMap((m) => [m.a, m.b]));
        const resting = group.teams.filter((id) => !playing.has(id));
        return (
          <li key={d} className={`fixtures__day${d === nextDay ? ' is-next' : ''}`}>
            <span className="fixtures__label">
              Matchday {d + 1}
              {d === nextDay && <span className="fixtures__next">Next</span>}
            </span>
            <ul className="fixtures__list">
              {day.map((m, i) => (
                <li key={i} className={`fixture${m.a === userId || m.b === userId ? ' is-mine' : ''}`}>
                  <FixtureTeam id={m.a} year={year} won={m.w === m.a} side="a" />
                  <span className="fixture__score">{m.s ? `${m.s[0]}–${m.s[1]}` : 'v'}</span>
                  <FixtureTeam id={m.b!} year={year} won={m.w === m.b} side="b" />
                </li>
              ))}
              {resting.map((id) => (
                <li key={id} className={`fixture fixture--rest${id === userId ? ' is-mine' : ''}`}>
                  {id === userId ? 'You rest this matchday' : `${nameIn(getNation(id), year)} rests`}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
