import type { Stats } from '@/types';
import { createStore, useStore } from './createStore';

export const DEFAULT_STATS: Stats = {
  shootouts: 0,
  shootoutsWon: 0,
  taken: 0,
  scored: 0,
  faced: 0,
  saved: 0,
  panenkas: 0,
  bestStreak: 0,
};

function parseStats(raw: unknown): Stats {
  const out = { ...DEFAULT_STATS };
  const r = raw as Record<string, unknown> | null | undefined;
  for (const k of Object.keys(DEFAULT_STATS) as (keyof Stats)[]) if (Number.isFinite(r?.[k])) out[k] = r![k] as number;
  return out;
}

export const statsStore = createStore('pp.stats.v1', DEFAULT_STATS, parseStats);

export const useStats = (): Stats => useStore(statsStore);

export function recordStats(patch: Partial<Stats>): void {
  statsStore.set((s) => {
    const next = { ...s };
    for (const [k, v] of Object.entries(patch) as [keyof Stats, number][]) {
      if (k === 'bestStreak') next.bestStreak = Math.max(s.bestStreak, v);
      else next[k] = (s[k] ?? 0) + v;
    }
    return next;
  });
}
