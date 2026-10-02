import type { Shootout, Side } from '@/types';
import { applyKick, isSuddenDeath, takerOf } from '@/engine/shootout';

export interface Stake {
  tone: 'good' | 'bad' | 'warn';
  text: string;
}

const other = (side: Side): Side => (side === 'user' ? 'cpu' : 'user');

/**
 * What is riding on the next kick, spelled out for whoever is deciding now: the kicker while aiming,
 * the keeper while picking a dive. Against the computer that is always the player ("you"); in a
 * two-player game `names` holds each side's team name.
 */
export function stakes(so: Shootout, actor: Side = 'user', names?: Readonly<Record<Side, string>>): Stake | null {
  if (so.winner) return null;
  const ifScore = applyKick(so, true).winner;
  const ifMiss = applyKick(so, false).winner;
  const team = names?.[actor];
  // With team names the lines are kept short, so they fit beside the round on the smallest phones.
  if (takerOf(so) === actor) {
    if (ifScore === actor) return { tone: 'good', text: team ? `Score and ${team} win it.` : 'Score this one and you win it.' };
    if (ifMiss === other(actor)) return { tone: 'bad', text: team ? `${team} must score.` : 'You must score to stay alive.' };
  } else {
    if (ifMiss === actor) return { tone: 'good', text: team ? `Save it and ${team} win it.` : 'Save this one and you win it.' };
    if (ifScore === other(actor)) return { tone: 'bad', text: team ? `${team} must save it.` : 'Save it or you are out.' };
  }
  if (isSuddenDeath(so)) return { tone: 'warn', text: 'Sudden death: next miss could decide it.' };
  return null;
}
