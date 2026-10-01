/** The computer players: a keeper that learns your habits, and kickers with a favourite spot. */
import type { Difficulty, KickerProfile, Quality } from '@/types';
import { clamp } from '@/utils/math';
import type { Rng } from '@/utils/random';
import { DIFFICULTY, ZONES } from './kick';

const ZONE_WEIGHTS: readonly number[] = [1.1, 0.35, 1.1, 3, 1, 3];
const BASE_DIVE: readonly number[] = [0.43, 0.14, 0.43];

/** The computer keeper leans towards the columns you keep choosing. */
export function cpuKeeperDive(history: readonly number[], difficulty: Difficulty, rng: Rng): number {
  const adapt = (DIFFICULTY[difficulty] ?? DIFFICULTY.normal).adapt;
  if (history.length < 2 || adapt === 0) return rng.weighted(BASE_DIVE);
  const counts = [1, 1, 1];
  for (const c of history.slice(-6)) counts[c] += 1;
  const total = counts[0] + counts[1] + counts[2];
  return rng.weighted(BASE_DIVE.map((b, i) => (1 - adapt) * b + (adapt * counts[i]) / total));
}

/** Most-used column when you have repeated yourself, else null. */
export function habitColumn(history: readonly number[]): number | null {
  if (history.length < 2) return null;
  const counts = [0, 0, 0];
  for (const c of history.slice(-4)) counts[c] += 1;
  const max = Math.max(...counts);
  return max >= 2 ? counts.indexOf(max) : null;
}

/** Each computer kicker has a favourite spot, shown on the scouting card. */
export function makeKickerProfile(rng: Rng, difficulty: Difficulty): KickerProfile {
  return {
    fav: rng.weighted(ZONE_WEIGHTS),
    loyalty: (DIFFICULTY[difficulty] ?? DIFFICULTY.normal).loyalty,
  };
}

export function cpuShot(
  profile: KickerProfile,
  { rating = 3, difficulty = 'normal', pressure = false }: { rating?: number; difficulty?: Difficulty; pressure?: boolean },
  rng: Rng,
): { zone: number; quality: Quality } {
  let zone = profile.fav;
  if (!rng.chance(profile.loyalty)) {
    zone = rng.weighted(ZONE_WEIGHTS.map((w, i) => (i === profile.fav ? 0 : w)));
  }
  const skill = clamp((rating - 1) / 4 + (DIFFICULTY[difficulty] ?? DIFFICULTY.normal).cpuSkill, 0, 1.1);
  const risky = ZONES[zone].kind === 'high' || ZONES[zone].kind === 'chip';
  const pPoor = clamp(0.2 - 0.12 * skill + (pressure ? 0.04 : 0) + (risky ? 0.05 : 0), 0.04, 0.35);
  const pPerfect = 0.28 + 0.26 * skill;
  const r = rng.next();
  const quality: Quality = r < pPoor ? 'poor' : r < pPoor + pPerfect ? 'perfect' : 'good';
  return { zone, quality };
}
