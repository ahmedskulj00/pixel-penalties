import type { Format } from './competition';
import type { NationId } from './nation';

/** Penalties scored: [team a, team b]. */
export type Score = [number, number];

/** One match: `w` is the winner once played; `b` is null for a bye. */
export interface Fixture {
  a: NationId;
  b: NationId | null;
  w: NationId | null;
  s: Score | null;
  bye?: boolean;
}

export interface Group {
  name: string;
  teams: NationId[];
  /** Matchdays, each a list of fixtures. */
  days: Fixture[][];
}

export type TournamentStatus = 'playing' | 'champion' | 'promoted' | 'out';

/**
 *   'groups'   → group matchdays are being played (`day` is the next one)
 *   'knockout' → `rounds[round]` is the current knockout round
 *   'done'     → a league table (or a lower Nations League tier) has finished
 */
export type TournamentPhase = 'groups' | 'knockout' | 'done';

/** A saved tournament: plain JSON (version 2) so it can be stored and resumed. */
export interface Tournament {
  v: 2;
  compId: string;
  editionId: string;
  userId: NationId;
  dream: boolean;
  seed: number;
  format: Format;
  day: number;
  round: number;
  status: TournamentStatus;
  phase: TournamentPhase;
  /** The team the user's nation replaced in the real line-up. */
  replaced?: NationId | null;
  groups: Group[] | null;
  rounds: Fixture[][];
  /** Seeded teams that skip the groups. */
  byes?: NationId[];
  /** 2 once a second group stage has been drawn (the first stage is kept in `firstGroups`). */
  stage?: 2;
  firstGroups?: Group[];
}

export interface TableRow {
  id: NationId;
  /** Played, won, lost. */
  p: number;
  w: number;
  l: number;
  /** Penalties for and against, and the difference. */
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  pos: number;
}

export interface NewTournament {
  compId: string;
  editionId: string;
  userId: NationId;
  dream?: boolean;
  seed: number;
}

/** A shootout result for the user: `score` is [user, opponent]. */
export interface UserResult {
  won?: boolean;
  score?: Score;
}
