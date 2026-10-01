import type { Shootout } from '@/types';
import { applyKick, isSuddenDeath, takerOf } from '@/engine/shootout';

export interface Stake {
  tone: 'good' | 'bad' | 'warn';
  text: string;
}

/** What is riding on the next kick, spelled out. */
export function stakes(so: Shootout): Stake | null {
  if (so.winner) return null;
  const side = takerOf(so);
  const ifScore = applyKick(so, true).winner;
  const ifMiss = applyKick(so, false).winner;
  if (side === 'user') {
    if (ifScore === 'user') return { tone: 'good', text: 'Score this one and you win it.' };
    if (ifMiss === 'cpu') return { tone: 'bad', text: 'You must score to stay alive.' };
  } else {
    if (ifMiss === 'user') return { tone: 'good', text: 'Save this one and you win it.' };
    if (ifScore === 'cpu') return { tone: 'bad', text: 'Save it or you are out.' };
  }
  if (isSuddenDeath(so)) return { tone: 'warn', text: 'Sudden death: next miss could decide it.' };
  return null;
}
