/** The shootout as a state machine: whose turn it is, and which step of the kick we are on. */
import type { Difficulty, KickPlan, KickerProfile, Quality, Shootout, Side } from '@/types';
import { makeKickerProfile } from '@/engine/cpu';
import { applyKick, createShootout, takerOf } from '@/engine/shootout';
import { createRng } from '@/utils/random';

/**
 *   intro   → coin toss done, waiting for the whistle
 *   aim     → the kicker picks a spot      strike → the strike meter is running
 *   handoff → two players: the kicker passes the device to the keeper
 *   dive    → the keeper picks a dive      kick   → the kick is being played out
 *   result  → one kick settled              done   → the shootout is over
 */
export type MatchPhase = 'intro' | 'aim' | 'strike' | 'handoff' | 'dive' | 'kick' | 'result' | 'done';

/** A kicker's strike, kept hidden until the keeper has picked a dive. */
export interface PendingStrike {
  zone: number;
  quality: Quality;
}

export interface MatchState {
  phase: MatchPhase;
  so: Shootout;
  /** Two players on this device: both sides shoot and both keep goal. */
  local: boolean;
  /** The zone picked for the kick being taken. */
  zone: number | null;
  /** Keyboard cursor on the aim pad. */
  cursor: number;
  cursorShown: boolean;
  /** Two players: the kicker's strike, waiting for the keeper. */
  pending: PendingStrike | null;
  plan: KickPlan | null;
  /** The zones each side has shot at, oldest first: the computer keeper's memory, and the scouting card in two-player games. */
  shots: Record<Side, number[]>;
  /** One profile per computer kicker. */
  profiles: KickerProfile[];
  /** Each side's current run of goals. */
  streaks: Record<Side, number>;
  turn: number;
}

export type MatchAction =
  | { type: 'start' }
  | { type: 'cursor'; cursor: number }
  | { type: 'aim'; zone: number }
  | { type: 'unaim' }
  | { type: 'handoff'; quality: Quality }
  | { type: 'ready' }
  | { type: 'plan'; plan: KickPlan }
  | { type: 'resolved' }
  | { type: 'next' };

/** Shirt numbers in the order the kickers step up. */
export const USER_NUMBERS: readonly number[] = [9, 10, 7, 8, 11, 4, 6, 5, 3, 2, 14];

export const CPU_NUMBERS: readonly number[] = [10, 9, 11, 7, 8, 5, 6, 4, 2, 3, 15];

/** Against the computer the player only aims their own kicks; with two players every kick starts with the kicker aiming. */
const nextPhase = (so: Shootout, local: boolean): MatchPhase => (local || takerOf(so) === 'user' ? 'aim' : 'dive');

/** A per-side record with one side's value replaced. */
const withSide = <T>(record: Readonly<Record<Side, T>>, side: Side, value: T): Record<Side, T> => ({ ...record, [side]: value });

export function init({ seed, kicks, difficulty, local = false }: { seed: number; kicks: number; difficulty: Difficulty; local?: boolean }): MatchState {
  const rng = createRng(seed);
  const userFirst = rng.chance(0.5);
  return {
    phase: 'intro',
    so: createShootout({ userFirst, kicks }),
    local,
    zone: null,
    cursor: 4,
    cursorShown: false,
    pending: null,
    plan: null,
    shots: { user: [], cpu: [] },
    profiles: CPU_NUMBERS.map(() => makeKickerProfile(rng, difficulty)),
    streaks: { user: 0, cpu: 0 },
    turn: 0,
  };
}

export function reducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'start':
      return state.phase === 'intro' ? { ...state, phase: nextPhase(state.so, state.local) } : state;
    case 'cursor':
      return { ...state, cursor: action.cursor, cursorShown: true };
    case 'aim':
      return state.phase === 'aim' || state.phase === 'strike' ? { ...state, phase: 'strike', zone: action.zone, cursor: action.zone } : state;
    case 'unaim':
      return state.phase === 'strike' ? { ...state, phase: 'aim' } : state;
    case 'handoff':
      // Two players: the strike stays hidden while the device goes to the keeper.
      return state.local && state.phase === 'strike' && state.zone != null
        ? { ...state, phase: 'handoff', pending: { zone: state.zone, quality: action.quality } }
        : state;
    case 'ready':
      return state.phase === 'handoff' ? { ...state, phase: 'dive' } : state;
    case 'plan':
      return state.phase === 'strike' || state.phase === 'dive' ? { ...state, phase: 'kick', plan: action.plan } : state;
    case 'resolved': {
      if (state.phase !== 'kick') return state;
      const plan = state.plan!;
      const scored = plan.outcome.result === 'goal';
      const side = plan.taker;
      return {
        ...state,
        phase: 'result',
        so: applyKick(state.so, scored),
        shots: withSide(state.shots, side, [...state.shots[side], plan.zone]),
        streaks: withSide(state.streaks, side, scored ? state.streaks[side] + 1 : 0),
      };
    }
    case 'next':
      if (state.phase !== 'result') return state;
      if (state.so.winner) return { ...state, phase: 'done' };
      return { ...state, phase: nextPhase(state.so, state.local), plan: null, zone: null, pending: null, turn: state.turn + 1 };
    default:
      return state;
  }
}
