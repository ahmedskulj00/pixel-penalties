import type { Nation, Shootout, Side } from '@/types';
import { tally } from '@/engine/shootout';
import { ScoreboardSide } from './ScoreboardSide';
import './Scoreboard.css';

export interface ScoreboardProps {
  user: Nation;
  cpu: Nation;
  userName: string;
  cpuName: string;
  so: Shootout;
  /** Who takes the next kick. */
  taker: Side | null;
  stage?: string | null;
}

export function Scoreboard({ user, cpu, userName, cpuName, so, taker, stage }: ScoreboardProps) {
  const t = tally(so);
  return (
    <section className="scoreboard frame" aria-label="Shootout score">
      <ScoreboardSide nation={user} name={userName} so={so} side="user" active={taker === 'user'} align="start" />
      <div className="scoreboard__mid">
        {stage && <span className="scoreboard__stage">{stage}</span>}
        <span className="scoreboard__score" aria-live="off">
          {t.user.scored}
          <span className="scoreboard__dash">-</span>
          {t.cpu.scored}
        </span>
      </div>
      <ScoreboardSide nation={cpu} name={cpuName} so={so} side="cpu" active={taker === 'cpu'} align="end" />
    </section>
  );
}
