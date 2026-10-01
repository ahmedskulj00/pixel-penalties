import type { Fixture, NationId } from '@/types';
import { TeamLine } from '../TeamLine';
import './BracketMatch.css';

export interface BracketMatchProps {
  /** Null while the match is not known yet. */
  m: Fixture | null;
  year: number;
  userId: NationId;
  /** Placeholder labels while the groups are still being played. */
  slots?: readonly [string, string] | null;
}

export function BracketMatch({ m, year, userId, slots }: BracketMatchProps) {
  if (m?.bye) {
    return (
      <div className="bm bm--bye">
        <TeamLine id={m.a} year={year} won me={m.a === userId} />
        <div className="bm__team is-tbd">
          <span className="bm__name">Bye</span>
        </div>
      </div>
    );
  }
  return (
    <div className={`bm${m && (m.a === userId || m.b === userId) ? ' bm--mine' : ''}`}>
      <TeamLine id={m?.a} year={year} score={m?.s?.[0]} won={!!m?.w && m.w === m.a} me={m?.a === userId} slot={slots?.[0]} />
      <TeamLine id={m?.b} year={year} score={m?.s?.[1]} won={!!m?.w && m.w === m.b} me={m?.b === userId} slot={slots?.[1]} />
    </div>
  );
}
