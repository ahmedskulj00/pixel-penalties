/** The two sides of a match: the player and the computer (or the opponent). */
export type Side = 'user' | 'cpu';

export type ZoneKind = 'high' | 'chip' | 'low' | 'middle';

/** One of the six places to aim: columns 0–2 (left to right), rows 0–1 (top, bottom). */
export interface Zone {
  id: number;
  col: number;
  row: number;
  kind: ZoneKind;
  name: string;
  keys: readonly string[];
}

export type Quality = 'perfect' | 'good' | 'poor';

export type OutcomeHow =
  | 'topBins'
  | 'panenka'
  | 'middle'
  | 'corner'
  | 'unstoppable'
  | 'beatsDive'
  | 'powerThrough'
  | 'scuffed'
  | 'smothered'
  | 'panenkaRead'
  | 'straightAt'
  | 'fingertips'
  | 'tipped'
  | 'parried'
  | 'post'
  | 'over'
  | 'wide'
  | 'bar';

export interface Outcome {
  result: 'goal' | 'save' | 'miss';
  how: OutcomeHow;
}

export interface ShootoutKick {
  side: Side;
  scored: boolean;
}

export interface Shootout {
  kicks: number;
  order: readonly [Side, Side];
  log: ShootoutKick[];
  winner: Side | null;
}

export interface SideTally {
  taken: number;
  scored: number;
}

export type Tally = Record<Side, SideTally>;

/** A computer kicker's favourite spot and how often it sticks to it. */
export interface KickerProfile {
  fav: number;
  loyalty: number;
}

/** Everything the scene needs to play out one kick. */
export interface KickPlan {
  taker: Side;
  zone: number;
  quality: Quality;
  /** The keeper's column: 0 left, 1 stays, 2 right. */
  dive: number;
  outcome: Outcome;
  /** The computer keeper read the player's habit. */
  readHabit?: boolean;
}
