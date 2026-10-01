import type { NationId } from './nation';

export type Difficulty = 'easy' | 'normal' | 'hard';
export type Speed = 'relaxed' | 'normal' | 'turbo';
export type MotionPreference = 'system' | 'reduced' | 'full';
export type ThemePreference = 'system' | 'day' | 'night';

export interface Settings {
  difficulty: Difficulty;
  kicks: 3 | 5;
  speed: Speed;
  autoContinue: boolean;
  assist: boolean;
  focus: boolean;
  calm: boolean;
  motion: MotionPreference;
  readable: boolean;
  sound: boolean;
  haptics: boolean;
  theme: ThemePreference;
  seenHowTo: boolean;
}

export interface Stats {
  shootouts: number;
  shootoutsWon: number;
  taken: number;
  scored: number;
  faced: number;
  saved: number;
  panenkas: number;
  bestStreak: number;
}

/** A trophy in the cabinet. */
export interface Trophy {
  compId: string;
  editionId: string;
  nationId: NationId;
  at?: number;
}
