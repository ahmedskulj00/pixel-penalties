import type { Settings } from '@/types';
import { createStore, useStore } from './createStore';

export const DEFAULT_SETTINGS: Settings = {
  difficulty: 'normal',
  kicks: 5,
  speed: 'normal',
  autoContinue: true,
  assist: true,
  focus: false,
  calm: false,
  motion: 'system',
  readable: false,
  sound: true,
  haptics: true,
  theme: 'system',
  seenHowTo: false,
};

const pick = <T>(value: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);

function parseSettings(raw: unknown): Settings {
  const s: Record<string, unknown> = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) };
  return {
    difficulty: pick(s.difficulty, ['easy', 'normal', 'hard'] as const, 'normal'),
    kicks: pick(s.kicks, [3, 5] as const, 5),
    speed: pick(s.speed, ['relaxed', 'normal', 'turbo'] as const, 'normal'),
    autoContinue: Boolean(s.autoContinue),
    assist: Boolean(s.assist),
    focus: Boolean(s.focus),
    calm: Boolean(s.calm),
    motion: pick(s.motion, ['system', 'reduced', 'full'] as const, 'system'),
    readable: Boolean(s.readable),
    sound: Boolean(s.sound),
    haptics: Boolean(s.haptics),
    theme: pick(s.theme, ['system', 'day', 'night'] as const, 'system'),
    seenHowTo: Boolean(s.seenHowTo),
  };
}

export const settingsStore = createStore('pp.settings.v1', DEFAULT_SETTINGS, parseSettings);

export const useSettings = (): Settings => useStore(settingsStore);

export const updateSettings = (patch: Partial<Settings>): void => settingsStore.set((s) => ({ ...s, ...patch }));
