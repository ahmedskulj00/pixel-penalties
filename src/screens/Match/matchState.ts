/** The shootout as a state machine: whose turn it is, and which step of the kick we are on. */
import type { Difficulty, KickPlan, KickerProfile, Shootout } from '@/types';
import { makeKickerProfile } from '@/engine/cpu';
import { ZONES } from '@/engine/kick';
import { applyKick, createShootout, takerOf } from '@/engine/shootout';
import { createRng } from '@/utils/random';

/**
 *   intro  → coin toss done, waiting for the whistle
 *   aim    → the player picks a spot     strike → the strike meter is running
 *   dive   → the player picks a dive     kick   → the kick is being played out
 *   result → one kick settled            done   → the shootout is over
 */
export type MatchPhase = 'intro' | 'aim' | 'strike' | 'dive' | 'kick' | 'result' | 'done';

export interface MatchState {
  phase: MatchPhase;
  so: Shootout;
  /** The zone picked for the player's kick. */
  zone: number | null;
  /** Keyboard cursor on the aim pad. */
  cursor: number;
  cursorShown: boolean;
  plan: KickPlan | null;
  /** Columns the player has shot at, for the keeper's memory. */
  history: number[];
  /** One profile per computer kicker. */
  profiles: KickerProfile[];
  /** The player's current run of goals. */
  streak: number;
  turn: number;
}

export type MatchAction =
  | { type: 'start' }
  | { type: 'cursor'; cursor: number }
  | { type: 'aim'; zone: number }
  | { type: 'unaim' }
  | { type: 'plan'; plan: KickPlan }
  | { type: 'resolved' }
  | { type: 'next' };

/** Shirt numbers in the order the kickers step up. */
export const USER_NUMBERS: readonly number[] = [9, 10, 7, 8, 11, 4, 6, 5, 3, 2, 14];

export const CPU_NUMBERS: readonly number[] = [10, 9, 11, 7, 8, 5, 6, 4, 2, 3, 15];

const nextPhase = (so: Shootout): MatchPhase => (takerOf(so) === 'user' ? 'aim' : 'dive');

export function init({ seed, kicks, difficulty }: { seed: number; kicks: number; difficulty: Difficulty }): MatchState {
  const rng = createRng(seed);
  const userFirst = rng.chance(0.5);
  return {
    phase: 'intro',
    so: createShootout({ userFirst, kicks }),
    zone: null,
    cursor: 4,
    cursorShown: false,
    plan: null,
    history: [],
    profiles: CPU_NUMBERS.map(() => makeKickerProfile(rng, difficulty)),
    streak: 0,
    turn: 0,
  };
}

export function reducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'start':
      return state.phase === 'intro' ? { ...state, phase: nextPhase(state.so) } : state;
    case 'cursor':
      return { ...state, cursor: action.cursor, cursorShown: true };
    case 'aim':
      return state.phase === 'aim' || state.phase === 'strike' ? { ...state, phase: 'strike', zone: action.zone, cursor: action.zone } : state;
    case 'unaim':
      return state.phase === 'strike' ? { ...state, phase: 'aim' } : state;
    case 'plan':
      return state.phase === 'strike' || state.phase === 'dive' ? { ...state, phase: 'kick', plan: action.plan } : state;
    case 'resolved': {
      if (state.phase !== 'kick') return state;
      const plan = state.plan!;
      const scored = plan.outcome.result === 'goal';
      const byUser = plan.taker === 'user';
      return {
        ...state,
        phase: 'result',
        so: applyKick(state.so, scored),
        history: byUser ? [...state.history, ZONES[plan.zone].col] : state.history,
        streak: byUser ? (scored ? state.streak + 1 : 0) : state.streak,
      };
    }
    case 'next':
      if (state.phase !== 'result') return state;
      if (state.so.winner) return { ...state, phase: 'done' };
      return { ...state, phase: nextPhase(state.so), plan: null, zone: null, turn: state.turn + 1 };
    default:
      return state;
  }
}
