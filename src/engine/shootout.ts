/** Shootout rules: five kicks each (or three), then sudden death. */
import type { Score, Shootout, Side, Tally } from '@/types';
import { clamp } from '@/utils/math';
import { createRng } from '@/utils/random';

export function createShootout({ userFirst = true, kicks = 5 }: { userFirst?: boolean; kicks?: number } = {}): Shootout {
  return { kicks, order: userFirst ? ['user', 'cpu'] : ['cpu', 'user'], log: [], winner: null };
}

export const takerOf = (so: Shootout): Side => so.order[so.log.length % 2];

export const isSuddenDeath = (so: Shootout): boolean => so.log.length >= so.kicks * 2;

export function tally(so: Shootout): Tally {
  const t: Tally = { user: { taken: 0, scored: 0 }, cpu: { taken: 0, scored: 0 } };
  for (const k of so.log) {
    t[k.side].taken += 1;
    if (k.scored) t[k.side].scored += 1;
  }
  return t;
}

function decide(so: Shootout): Side | null {
  const { user, cpu } = tally(so);
  const k = so.kicks;
  if (user.taken <= k && cpu.taken <= k) {
    if (user.scored > cpu.scored + (k - cpu.taken)) return 'user';
    if (cpu.scored > user.scored + (k - user.taken)) return 'cpu';
    return null;
  }
  if (user.taken === cpu.taken && user.scored !== cpu.scored) return user.scored > cpu.scored ? 'user' : 'cpu';
  return null;
}

export function applyKick(so: Shootout, scored: boolean): Shootout {
  if (so.winner) return so;
  const next: Shootout = { ...so, log: [...so.log, { side: takerOf(so), scored }] };
  next.winner = decide(next);
  return next;
}

/** Kick-by-kick marks for the scoreboard: true, false, or null for not taken yet. */
export function marks(so: Shootout, side: Side): (boolean | null)[] {
  const taken = so.log.filter((k) => k.side === side).map((k) => k.scored);
  const slots = Math.max(so.kicks, taken.length);
  return Array.from({ length: slots }, (_, i) => (i < taken.length ? taken[i] : null));
}

/** Quick computer-vs-computer shootout for the rest of the bracket. */
export function simulateShootout(ratingA: number, ratingB: number, seed: number, kicks = 5): { winner: 'a' | 'b'; score: Score } {
  const rng = createRng(seed);
  let so = createShootout({ userFirst: rng.chance(0.5), kicks });
  const p = (kicker: number, keeper: number) => clamp(0.76 + (kicker - keeper) * 0.035, 0.55, 0.92);
  let guard = 0;
  while (!so.winner && guard++ < 200) {
    const side = takerOf(so);
    so = applyKick(so, rng.chance(side === 'user' ? p(ratingA, ratingB) : p(ratingB, ratingA)));
  }
  const t = tally(so);
  return { winner: so.winner === 'user' ? 'a' : 'b', score: [t.user.scored, t.cpu.scored] };
}
