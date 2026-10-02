import type { NationId } from '@/types';

/** 'tournament' and 'quick' are played against the computer; 'local' is two players sharing this device. */
export type MatchMode = 'tournament' | 'quick' | 'local';

/** Everything the match screen shows around the shootout. */
export interface MatchContext {
  mode: MatchMode;
  stage: string;
  /** Text on the advertising board. */
  board: string;
  /** Label of the button that leaves a finished match. */
  backLabel?: string;
}

export interface MatchRoute extends MatchContext {
  name: 'match';
  /** The player's nation (Player 1's in a two-player game). */
  userId: NationId;
  /** The other side's nation: the computer's, or Player 2's. */
  cpuId: NationId;
  year: number;
}

/** A pair of nations to preselect on the quick-match screen. */
export interface QuickPair {
  userId: NationId;
  cpuId: NationId;
}

/** How many people play a quick match: one against the computer, or two on this device. */
export type Players = 1 | 2;

/** The screens, and what each one needs. */
export type Route =
  { name: 'home' } | { name: 'setup' } | { name: 'quick'; players?: Players; initial?: QuickPair } | { name: 'bracket' } | { name: 'cabinet' } | MatchRoute;

export type RouteName = Route['name'];

export type Navigate = (route: Route) => void;

export type ModalName = 'settings' | 'howto' | 'pause';
