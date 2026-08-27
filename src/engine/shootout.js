import { createRng } from './rng.js';

/**
 * The spot-kick model.
 *
 * A penalty is two decisions: WHERE (one of six zones) and HOW WELL (timing on the strike
 * meter). Every zone trades risk for reward, and the sweet spot on the meter is sized to
 * match, so the risk is always visible before you commit.
 */

export const ZONES = [
  { id: 0, col: 0, row: 0, kind: 'high', name: 'Top left', keys: ['q', '7'] },
  { id: 1, col: 1, row: 0, kind: 'chip', name: 'Panenka chip', keys: ['w', '8'] },
  { id: 2, col: 2, row: 0, kind: 'high', name: 'Top right', keys: ['e', '9'] },
  { id: 3, col: 0, row: 1, kind: 'low', name: 'Bottom left', keys: ['a', '1', '4'] },
  { id: 4, col: 1, row: 1, kind: 'middle', name: 'Down the middle', keys: ['s', '2', '5'] },
  { id: 5, col: 2, row: 1, kind: 'low', name: 'Bottom right', keys: ['d', '3', '6'] },
];

/** Sweet spot (green) and near-miss band (yellow) widths as fractions of the meter. */
export const TECHNIQUE = {
  high: { green: 0.1, yellow: 0.14, risk: 3, label: 'Top corner', hint: 'Unsaveable if you nail it' },
  chip: { green: 0.13, yellow: 0.13, risk: 3, label: 'Panenka', hint: 'Beats any keeper who dives' },
  low: { green: 0.18, yellow: 0.15, risk: 2, label: 'Low corner', hint: 'Reliable, but can be saved' },
  middle: { green: 0.26, yellow: 0.16, risk: 1, label: 'Middle', hint: 'Safe unless the keeper stays' },
};

export const DIFFICULTY = {
  easy: { sweet: 1.3, period: 2000, adapt: 0, loyalty: 0.66, cpuSkill: -0.15 },
  normal: { sweet: 1, period: 1600, adapt: 0.35, loyalty: 0.56, cpuSkill: 0 },
  hard: { sweet: 0.8, period: 1250, adapt: 0.6, loyalty: 0.47, cpuSkill: 0.12 },
};

/** Staying composed for this long before striking grows the sweet spot to its maximum. */
export const COMPOSURE_MS = 1200;
export const COMPOSURE_BONUS = 0.35;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function sweetSpot(zoneId, { difficulty = 'normal', rating = 3 } = {}) {
  const t = TECHNIQUE[ZONES[zoneId].kind];
  const d = DIFFICULTY[difficulty] ?? DIFFICULTY.normal;
  const team = 0.9 + 0.05 * clamp(rating - 1, 0, 4);
  return { green: t.green * d.sweet * team, yellow: t.yellow * d.sweet };
}

export function composure(elapsedMs) {
  return clamp(elapsedMs / COMPOSURE_MS, 0, 1);
}

/** Grade a strike from the marker position (0…1, sweet spot centred on 0.5). */
export function gradeStrike(position, green, yellow) {
  const d = Math.abs(position - 0.5);
  if (d <= green / 2) return 'perfect';
  if (d <= green / 2 + yellow) return 'good';
  return 'poor';
}

const goal = (how) => ({ result: 'goal', how });
const save = (how) => ({ result: 'save', how });
const miss = (how) => ({ result: 'miss', how });

/**
 * Resolve one penalty. `dive` is the keeper's column (0 left, 1 stays, 2 right).
 * The same rules apply to you and to the computer, in both directions.
 */
export function resolveShot({ zone, quality, dive, keeperRating = 3, rng }) {
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

export const OUTCOME_TEXT = {
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

// ─── Computer players ────────────────────────────────────────────────────────

const ZONE_WEIGHTS = [1.1, 0.35, 1.1, 3, 1, 3];
const BASE_DIVE = [0.43, 0.14, 0.43];

/** The computer keeper leans towards the columns you keep choosing. */
export function cpuKeeperDive(history, difficulty, rng) {
  const adapt = (DIFFICULTY[difficulty] ?? DIFFICULTY.normal).adapt;
  if (history.length < 2 || adapt === 0) return rng.weighted(BASE_DIVE);
  const counts = [1, 1, 1];
  for (const c of history.slice(-6)) counts[c] += 1;
  const total = counts[0] + counts[1] + counts[2];
  return rng.weighted(BASE_DIVE.map((b, i) => (1 - adapt) * b + (adapt * counts[i]) / total));
}

/** Most-used column when you have repeated yourself, else null. */
export function habitColumn(history) {
  if (history.length < 2) return null;
  const counts = [0, 0, 0];
  for (const c of history.slice(-4)) counts[c] += 1;
  const max = Math.max(...counts);
  return max >= 2 ? counts.indexOf(max) : null;
}

/** Each computer kicker has a favourite spot, shown on the scouting card. */
export function makeKickerProfile(rng, difficulty) {
  return {
    fav: rng.weighted(ZONE_WEIGHTS),
    loyalty: (DIFFICULTY[difficulty] ?? DIFFICULTY.normal).loyalty,
  };
}

export function cpuShot(profile, { rating = 3, difficulty = 'normal', pressure = false }, rng) {
  let zone = profile.fav;
  if (!rng.chance(profile.loyalty)) {
    zone = rng.weighted(ZONE_WEIGHTS.map((w, i) => (i === profile.fav ? 0 : w)));
  }
  const skill = clamp((rating - 1) / 4 + (DIFFICULTY[difficulty] ?? DIFFICULTY.normal).cpuSkill, 0, 1.1);
  const risky = ZONES[zone].kind === 'high' || ZONES[zone].kind === 'chip';
  const pPoor = clamp(0.2 - 0.12 * skill + (pressure ? 0.04 : 0) + (risky ? 0.05 : 0), 0.04, 0.35);
  const pPerfect = 0.28 + 0.26 * skill;
  const r = rng.next();
  const quality = r < pPoor ? 'poor' : r < pPoor + pPerfect ? 'perfect' : 'good';
  return { zone, quality };
}

// ─── Shootout rules ──────────────────────────────────────────────────────────

/** @typedef {{kicks:number, order:('user'|'cpu')[], log:{side:'user'|'cpu', scored:boolean}[], winner:null|'user'|'cpu'}} Shootout */

export function createShootout({ userFirst = true, kicks = 5 } = {}) {
  return { kicks, order: userFirst ? ['user', 'cpu'] : ['cpu', 'user'], log: [], winner: null };
}

export const takerOf = (so) => so.order[so.log.length % 2];

export const isSuddenDeath = (so) => so.log.length >= so.kicks * 2;

export function tally(so) {
  const t = { user: { taken: 0, scored: 0 }, cpu: { taken: 0, scored: 0 } };
  for (const k of so.log) {
    t[k.side].taken += 1;
    if (k.scored) t[k.side].scored += 1;
  }
  return t;
}

function decide(so) {
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

export function applyKick(so, scored) {
  if (so.winner) return so;
  const next = { ...so, log: [...so.log, { side: takerOf(so), scored }] };
  next.winner = decide(next);
  return next;
}

/** Kick-by-kick marks for the scoreboard: true, false, or null for not taken yet. */
export function marks(so, side) {
  const taken = so.log.filter((k) => k.side === side).map((k) => k.scored);
  const slots = Math.max(so.kicks, taken.length);
  return Array.from({ length: slots }, (_, i) => (i < taken.length ? taken[i] : null));
}

/** Quick computer-vs-computer shootout for the rest of the bracket. */
export function simulateShootout(ratingA, ratingB, seed, kicks = 5) {
  const rng = createRng(seed);
  let so = createShootout({ userFirst: rng.chance(0.5), kicks });
  const p = (kicker, keeper) => clamp(0.76 + (kicker - keeper) * 0.035, 0.55, 0.92);
  let guard = 0;
  while (!so.winner && guard++ < 200) {
    const side = takerOf(so);
    so = applyKick(so, rng.chance(side === 'user' ? p(ratingA, ratingB) : p(ratingB, ratingA)));
  }
  const t = tally(so);
  return { winner: so.winner === 'user' ? 'a' : 'b', score: [t.user.scored, t.cpu.scored] };
}
