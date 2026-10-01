import type { NationId } from '@/types';
import { Flag } from '@/components/Flag';
import { getNation, nameIn } from '@/data/nations';
import './TeamLine.css';

export interface TeamLineProps {
  id?: NationId | null;
  year: number;
  score?: number | null;
  won?: boolean;
  /** The player's team. */
  me?: boolean;
  /** What fills this place once the groups finish, e.g. 'Winner Group A'. */
  slot?: string | null;
}

/** One team in a bracket match, or a placeholder. */
export function TeamLine({ id, year, score, won, me, slot }: TeamLineProps) {
  if (!id) {
    return (
      <div className={`bm__team is-tbd${slot ? ' is-slot' : ''}`}>
        <span className="bm__flag bm__flag--empty" />
        <span className="bm__name">{slot ?? 'To be decided'}</span>
      </div>
    );
  }
  return (
    <div className={`bm__team${won ? ' is-winner' : ''}${me ? ' is-me' : ''}`}>
      <Flag id={id} size="sm" />
      <span className="bm__name">{nameIn(getNation(id), year)}</span>
      {score != null && <span className="bm__score">{score}</span>}
    </div>
  );
}
