import type { Nation, Shootout, Side } from '@/types';
import { marks, tally } from '@/engine/shootout';
import { Flag } from '../../Flag';
import { BallIcon } from '../../Icon';
import { KickMark } from '../../KickMark';
import './ScoreboardSide.css';

export interface ScoreboardSideProps {
  nation: Nation;
  name: string;
  so: Shootout;
  side: Side;
  /** This team is taking the next kick. */
  active: boolean;
  align: 'start' | 'end';
}

/** One team on the scoreboard: flag, name and a mark per kick. */
export function ScoreboardSide({ nation, name, so, side, active, align }: ScoreboardSideProps) {
  const t = tally(so)[side];
  return (
    <div className={`board-side board-side--${align}${active ? ' is-active' : ''}`}>
      <div className="board-side__team">
        <Flag id={nation.id} size="md" />
        {active && (
          <span className="board-side__turn" title="Taking this kick">
            <BallIcon />
          </span>
        )}
        <span className="board-side__name">
          <span className="board-side__full">{name}</span>
          <span className="board-side__code">{nation.id}</span>
        </span>
      </div>
      <ol className="board-side__marks" aria-label={`${name}: ${t.scored} of ${t.taken} scored`}>
        {marks(so, side).map((m, i) => (
          <li key={i}>
            <KickMark value={m} />
          </li>
        ))}
      </ol>
    </div>
  );
}
