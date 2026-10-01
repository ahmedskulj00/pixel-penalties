import type { NationId } from '@/types';
import { Flag } from '@/components/Flag';
import { getNation, nameIn } from '@/data/nations';
import './FixtureTeam.css';

export interface FixtureTeamProps {
  id: NationId;
  year: number;
  won: boolean;
  side: 'a' | 'b';
}

export function FixtureTeam({ id, year, won, side }: FixtureTeamProps) {
  return (
    <span className={`fixture__team fixture__team--${side}${won ? ' is-win' : ''}`}>
      <Flag id={id} size="xs" />
      <span className="fixture__name">{nameIn(getNation(id), year)}</span>
    </span>
  );
}
