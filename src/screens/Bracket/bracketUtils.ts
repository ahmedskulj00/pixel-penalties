import type { Edition, Fate, FateTable, Group, NationId, TableRow } from '@/types';
import { getNation, nameIn } from '@/data/nations';
import { groupTable, roundName } from '@/engine/tournament';
import { formatList } from '@/utils/format';

/** How a table row is marked: qualifying, in the race for a place, relegation zone, or out. */
export type RowState = 'in' | 'maybe' | 'down' | 'out';

// Lower Nations League tiers: what a finishing place looks like in the table.
const TIER_STATE: Partial<Record<Fate, RowState>> = { promoted: 'in', 'playoff-up': 'maybe', 'playoff-down': 'down', playout: 'down', relegated: 'down' };

export const tierState = (fate: Fate | Fate[] | undefined): RowState | null => {
  if (!Array.isArray(fate)) return (fate && TIER_STATE[fate]) ?? null;
  if (fate.includes('promoted')) return 'maybe';
  return fate.some((x) => TIER_STATE[x] === 'down') ? 'down' : null;
};

export function tierLegend(fates: FateTable): { maybe: string | null; down: string | null } {
  const all = Object.values(fates).flat();
  const downs = new Set(all.filter((x) => TIER_STATE[x] === 'down'));
  const maybe = all.includes('playoff-up')
    ? 'Promotion play-off'
    : Object.values(fates).some((x) => Array.isArray(x) && x.includes('promoted'))
      ? 'Best third-placed team goes up'
      : null;
  const down = !downs.size
    ? null
    : downs.has('relegated') && downs.size > 1
      ? 'Relegation or play-off'
      : downs.has('relegated')
        ? 'Relegation'
        : downs.has('playout')
          ? 'Relegation play-out'
          : 'Relegation play-off';
  return { maybe, down };
}

/** 'the quarter-finals', 'the semi-finals', 'the round of 16' for a first knockout round of n matches. */
export const seededRound = (n: number): string => {
  const name = roundName(n).toLowerCase();
  return name.startsWith('round of') ? name : `${name}s`;
};

/** Where the user played in a set of groups: { group, row }, or null. */
export function locate(groups: Group[] | null | undefined, userId: NationId): { group: Group; row: TableRow } | null {
  const group = (groups ?? []).find((g) => g.teams.includes(userId));
  return group ? { group, row: groupTable(group).find((r) => r.id === userId)! } : null;
}

/** The line under "Champions!", set against what really happened. */
export function historyLine(edition: Edition, winnerIds: NationId[], userId: NationId, year: number): string {
  if (edition.status === 'upcoming') return `You won it before a ball has been kicked. See you in ${year}.`;
  if (edition.status === 'cancelled') return 'The tournament that never was finally has a winner.';
  if (edition.status === 'unfinished' || edition.status === 'nowinner' || edition.status === 'disputed') return 'History never settled this one. You just did.';
  if (!winnerIds.length) return 'Your name goes on the trophy.';
  if (winnerIds.includes(userId)) return `Just like in ${year}: history repeats itself.`;
  const names = formatList(winnerIds.map((id) => nameIn(getNation(id), year)));
  return `In real life ${names} ${winnerIds.length > 1 ? 'shared' : 'won'} it. You rewrote history.`;
}
