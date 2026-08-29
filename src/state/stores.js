import { useSyncExternalStore } from 'react';
import { validateTournament } from '../engine/tournament.js';

/**
 * Tiny external stores backed by localStorage. Reads are synchronous and
 * subscriptions are shared, so components re-render only when their store changes.
 * Storage can be unavailable (private mode, sandboxing), so every access is guarded.
 */
function createStore(key, fallback, parse) {
  const read = () => {
    try {
      const raw = globalThis.localStorage?.getItem(key);
      return raw ? parse(JSON.parse(raw)) : fallback;
    } catch {
      return fallback;
    }
  };
  let value = read();
  const listeners = new Set();
  const emit = () => listeners.forEach((l) => l());

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== key) return;
      value = read();
      emit();
    });
  }

  return {
    get: () => value,
    set(update) {
      const next = typeof update === 'function' ? update(value) : update;
      if (Object.is(next, value)) return;
      value = next;
      try {
        if (next == null) globalThis.localStorage?.removeItem(key);
        else globalThis.localStorage?.setItem(key, JSON.stringify(next));
      } catch {
        /* storage full or blocked: keep the in-memory value */
      }
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const DEFAULT_SETTINGS = {
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

const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

function parseSettings(raw) {
  const s = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) };
  return {
    difficulty: pick(s.difficulty, ['easy', 'normal', 'hard'], 'normal'),
    kicks: pick(s.kicks, [3, 5], 5),
    speed: pick(s.speed, ['relaxed', 'normal', 'turbo'], 'normal'),
    autoContinue: Boolean(s.autoContinue),
    assist: Boolean(s.assist),
    focus: Boolean(s.focus),
    calm: Boolean(s.calm),
    motion: pick(s.motion, ['system', 'reduced', 'full'], 'system'),
    readable: Boolean(s.readable),
    sound: Boolean(s.sound),
    haptics: Boolean(s.haptics),
    theme: pick(s.theme, ['system', 'day', 'night'], 'system'),
    seenHowTo: Boolean(s.seenHowTo),
  };
}

const DEFAULT_STATS = {
  shootouts: 0,
  shootoutsWon: 0,
  taken: 0,
  scored: 0,
  faced: 0,
  saved: 0,
  panenkas: 0,
  bestStreak: 0,
};

function parseStats(raw) {
  const out = { ...DEFAULT_STATS };
  for (const k of Object.keys(DEFAULT_STATS)) if (Number.isFinite(raw?.[k])) out[k] = raw[k];
  return out;
}

function parseCabinet(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t) => t && typeof t.compId === 'string' && typeof t.editionId === 'string' && typeof t.nationId === 'string');
}

export const settingsStore = createStore('pp.settings.v1', DEFAULT_SETTINGS, parseSettings);
export const tournamentStore = createStore('pp.tournament.v1', null, validateTournament);
export const cabinetStore = createStore('pp.cabinet.v1', [], parseCabinet);
export const statsStore = createStore('pp.stats.v1', DEFAULT_STATS, parseStats);

export const useSettings = () => useSyncExternalStore(settingsStore.subscribe, settingsStore.get, settingsStore.get);
export const useTournament = () => useSyncExternalStore(tournamentStore.subscribe, tournamentStore.get, tournamentStore.get);
export const useCabinet = () => useSyncExternalStore(cabinetStore.subscribe, cabinetStore.get, cabinetStore.get);
export const useStats = () => useSyncExternalStore(statsStore.subscribe, statsStore.get, statsStore.get);

export const updateSettings = (patch) => settingsStore.set((s) => ({ ...s, ...patch }));

export function addTrophy(entry) {
  cabinetStore.set((list) => {
    const exists = list.some(
      (t) => t.compId === entry.compId && t.editionId === entry.editionId && t.nationId === entry.nationId,
    );
    return exists ? list : [...list, { ...entry, at: Date.now() }];
  });
}

export function recordStats(patch) {
  statsStore.set((s) => {
    const next = { ...s };
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'bestStreak') next.bestStreak = Math.max(s.bestStreak, v);
      else next[k] = (s[k] ?? 0) + v;
    }
    return next;
  });
}

export function resetProgress() {
  tournamentStore.set(null);
  cabinetStore.set([]);
  statsStore.set(DEFAULT_STATS);
}
