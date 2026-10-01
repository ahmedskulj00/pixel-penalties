import type { NationId } from '@/types';

export type MatchMode = 'tournament' | 'quick';

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
  userId: NationId;
  cpuId: NationId;
  year: number;
}

/** A pair of nations to preselect on the quick-match screen. */
export interface QuickPair {
  userId: NationId;
  cpuId: NationId;
}

/** The screens, and what each one needs. */
export type Route = { name: 'home' } | { name: 'setup' } | { name: 'quick'; initial?: QuickPair } | { name: 'bracket' } | { name: 'cabinet' } | MatchRoute;

export type RouteName = Route['name'];

export type Navigate = (route: Route) => void;

export type ModalName = 'settings' | 'howto' | 'pause';
