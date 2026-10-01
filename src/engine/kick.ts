import type { Difficulty, Outcome, OutcomeHow, Quality, Zone, ZoneKind } from '@/types';
import { clamp } from '@/utils/math';
import type { Rng } from '@/utils/random';

/**
 * The spot-kick model.
 *
 * A penalty is two decisions: WHERE (one of six zones) and HOW WELL (timing on the strike
 * meter). Every zone trades risk for reward, and the sweet spot on the meter is sized to
 * match, so the risk is always visible before you commit.
 */

interface Technique {
  /** Sweet spot (green) and near-miss band (yellow) widths as fractions of the meter. */
  green: number;
  yellow: number;
  risk: number;
  label: string;
  hint: string;
}

interface DifficultyTuning {
  /** Sweet-spot scale. */
  sweet: number;
  /** Strike-meter sweep period in ms. */
  period: number;
  /** How strongly the computer keeper adapts to the player's habits. */
  adapt: number;
  /** How often computer kickers go for their favourite spot. */
  loyalty: number;
  cpuSkill: number;
}

export interface ShotInput {
  zone: number;
  quality: Quality;
  /** The keeper's column: 0 left, 1 stays, 2 right. */
  dive: number;
  keeperRating?: number;
  rng: Rng;
}

export const ZONES: readonly Zone[] = [
  { id: 0, col: 0, row: 0, kind: 'high', name: 'Top left', keys: ['q', '7'] },
  { id: 1, col: 1, row: 0, kind: 'chip', name: 'Panenka chip', keys: ['w', '8'] },
  { id: 2, col: 2, row: 0, kind: 'high', name: 'Top right', keys: ['e', '9'] },
  { id: 3, col: 0, row: 1, kind: 'low', name: 'Bottom left', keys: ['a', '1', '4'] },
  { id: 4, col: 1, row: 1, kind: 'middle', name: 'Down the middle', keys: ['s', '2', '5'] },
  { id: 5, col: 2, row: 1, kind: 'low', name: 'Bottom right', keys: ['d', '3', '6'] },
];

/** Sweet spot (green) and near-miss band (yellow) widths as fractions of the meter. */
export const TECHNIQUE: Record<ZoneKind, Technique> = {
  high: { green: 0.1, yellow: 0.14, risk: 3, label: 'Top corner', hint: 'Unsaveable if you nail it' },
  chip: { green: 0.13, yellow: 0.13, risk: 3, label: 'Panenka', hint: 'Beats any keeper who dives' },
  low: { green: 0.18, yellow: 0.15, risk: 2, label: 'Low corner', hint: 'Reliable, but can be saved' },
  middle: { green: 0.26, yellow: 0.16, risk: 1, label: 'Middle', hint: 'Safe unless the keeper stays' },
};

export const DIFFICULTY: Record<Difficulty, DifficultyTuning> = {
  easy: { sweet: 1.3, period: 2000, adapt: 0, loyalty: 0.66, cpuSkill: -0.15 },
  normal: { sweet: 1, period: 1600, adapt: 0.35, loyalty: 0.56, cpuSkill: 0 },
  hard: { sweet: 0.8, period: 1250, adapt: 0.6, loyalty: 0.47, cpuSkill: 0.12 },
};

/** Staying composed for this long before striking grows the sweet spot to its maximum. */
export const COMPOSURE_MS = 1200;
export const COMPOSURE_BONUS = 0.35;

export function sweetSpot(
  zoneId: number,
  { difficulty = 'normal', rating = 3 }: { difficulty?: Difficulty; rating?: number } = {},
): { green: number; yellow: number } {
  const t = TECHNIQUE[ZONES[zoneId].kind];
  const d = DIFFICULTY[difficulty] ?? DIFFICULTY.normal;
  const team = 0.9 + 0.05 * clamp(rating - 1, 0, 4);
  return { green: t.green * d.sweet * team, yellow: t.yellow * d.sweet };
}

export function composure(elapsedMs: number): number {
  return clamp(elapsedMs / COMPOSURE_MS, 0, 1);
}

/** Grade a strike from the marker position (0…1, sweet spot centred on 0.5). */
export function gradeStrike(position: number, green: number, yellow: number): Quality {
  const d = Math.abs(position - 0.5);
  if (d <= green / 2) return 'perfect';
  if (d <= green / 2 + yellow) return 'good';
  return 'poor';
}

const goal = (how: OutcomeHow): Outcome => ({ result: 'goal', how });
const save = (how: OutcomeHow): Outcome => ({ result: 'save', how });
const miss = (how: OutcomeHow): Outcome => ({ result: 'miss', how });

/**
 * Resolve one penalty. `dive` is the keeper's column (0 left, 1 stays, 2 right).
 * The same rules apply to you and to the computer, in both directions.
 */
export function resolveShot({ zone, quality, dive, keeperRating = 3, rng }: ShotInput): Outcome {
  const { col, kind } = ZONES[zone];
  const guessed = dive === col;

  if (quality === 'poor') {
    if (kind === 'high') return miss(rng.chance(0.4) ? 'post' : rng.chance(0.5) ? 'over' : 'wide');
    if (kind === 'chip') return miss(rng.chance(0.3) ? 'bar' : 'over');
    if (kind === 'low' && rng.chance(0.5)) return miss(rng.chance(0.35) ? 'post' : 'wide');
    return guessed ? save('smothered') : goal('scuffed');
  }

  if (!guessed) {
    if (kind === 'high') return goal('topBins');
    if (kind === 'chip') return goal('panenka');
    if (kind === 'middle') return goal('middle');
    return goal('corner');
  }

  if (kind === 'chip') return save('panenkaRead');
  if (kind === 'middle') return save('straightAt');

  if (quality === 'perfect') {
    if (kind === 'high') return goal('unstoppable');
    const saveChance = clamp(0.35 + (keeperRating - 3) * 0.06, 0.2, 0.5);
    return rng.chance(saveChance) ? save('fingertips') : goal('beatsDive');
  }

  if (kind === 'high') return rng.chance(0.55) ? save('tipped') : goal('powerThrough');
  return save('parried');
}

export const OUTCOME_TEXT: Record<OutcomeHow, string> = {
  topBins: 'Top corner. No chance.',
  panenka: 'A Panenka! Pure nerve.',
  middle: 'Straight down the middle.',
  corner: 'Tucked into the corner.',
  unstoppable: 'Right way, still unstoppable.',
  beatsDive: 'Just past the fingertips.',
  powerThrough: 'Too much power to keep out.',
  scuffed: 'Scuffed, but it counts.',
  smothered: 'A weak strike, easily saved.',
  panenkaRead: 'The keeper stood tall and read the chip.',
  straightAt: 'Straight at the keeper.',
  fingertips: 'Fingertip save!',
  tipped: 'Tipped away from the top corner!',
  parried: 'Parried away!',
  post: 'Off the post!',
  over: 'Over the bar.',
  wide: 'Wide of the post.',
  bar: 'Off the crossbar!',
};
