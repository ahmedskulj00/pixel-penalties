/** Where the user stands: next fixture, stage names, champion, how far they got. */
import type { Fate, Fixture, GroupsFormat, NationId, Tournament } from '@/types';
import { COMPETITION_BY_ID } from '@/data/competitions';
import { ordinal } from '@/utils/format';
import { acrossGroups, groupTable, groupTables, type GroupedRow } from './groups';

interface GroupDay {
  stage: 'group';
  group: number;
  /** The matchday and the number of matchdays in the group. */
  day: number;
  days: number;
}

/** A matchday on which the user's group plays without them. */
export type RestDay = GroupDay & { rest: true; opponent: null } & { [K in keyof Fixture]?: never } & { index?: never };
export type GroupUserMatch = (GroupDay & Fixture & { rest?: never; index?: never; opponent: NationId | null }) | RestDay;
export type KnockoutUserMatch = Fixture & {
  stage: 'knockout';
  /** Position of the match in its round. */
  index: number;
  opponent: NationId | null;
  rest?: never;
  group?: never;
  day?: never;
  days?: never;
};

/** The user's next fixture: a group match, a rest day, or a knockout match (possibly a bye). */
export type UserMatch = GroupUserMatch | KnockoutUserMatch;

export const dayCount = (t: Tournament): number => Math.max(0, ...(t.groups ?? []).map((g) => g.days.length));

export const userGroupIndex = (t: Tournament): number => (t.groups ?? []).findIndex((g) => g.teams.includes(t.userId));

/** The second group stage (World Cup 1950–82, final rounds), once it has been drawn. */
export const inSecondStage = (t: Tournament): boolean => t.stage === 2;

/** The user's next fixture: a group match, a rest day, or a knockout match (possibly a bye). */
export function userMatch(t: Tournament): UserMatch | null {
  if (t.phase === 'groups') {
    const group = userGroupIndex(t);
    const days = t.groups![group]?.days ?? [];
    const m = days[t.day]?.find((x) => x.a === t.userId || x.b === t.userId);
    const base = { stage: 'group' as const, group, day: t.day, days: days.length };
    if (!m) return { ...base, rest: true, opponent: null };
    return { ...base, ...m, opponent: m.a === t.userId ? m.b : m.a };
  }
  const matches = t.rounds[t.round] ?? [];
  const index = matches.findIndex((m) => m.a === t.userId || m.b === t.userId);
  if (index < 0) return null;
  const m = matches[index];
  return { stage: 'knockout', ...m, index, opponent: m.a === t.userId ? m.b : m.a };
}

const ROUND_NAMES: Record<number, string> = { 1: 'Final', 2: 'Semi-final', 4: 'Quarter-final', 8: 'Round of 16' };

export function roundName(matchCount: number): string {
  return ROUND_NAMES[matchCount] ?? `Round of ${matchCount * 2}`;
}

/** Where the user is now, e.g. "Group B, matchday 2 of 3" or "Semi-final". */
export function stageLabel(t: Tournament, { short = false }: { short?: boolean } = {}): string {
  if (t.phase === 'groups') {
    const m = userMatch(t) as GroupUserMatch;
    const g = t.groups![m.group];
    if (t.format.type === 'league') return short ? `Matchday ${t.day + 1}` : `Matchday ${t.day + 1} of ${m.days}`;
    if (t.stage === 2) {
      const stage = (t.format as GroupsFormat).second!.league ? 'Final round' : `Second round, group ${g.name}`;
      return short ? stage : `${stage}, matchday ${t.day + 1} of ${m.days}`;
    }
    return short ? `Group ${g.name}` : `Group ${g.name}, matchday ${t.day + 1} of ${m.days}`;
  }
  return roundName(t.rounds[t.round]?.length ?? 1);
}

export function championOf(t: Tournament): NationId | null {
  if (t.format?.type === 'promotion') return null;
  if (t.format?.type === 'league' || (t.stage === 2 && (t.format as GroupsFormat).second?.league)) {
    return t.phase === 'done' ? groupTables(t)[0][0].id : null;
  }
  const final = t.rounds[t.rounds.length - 1];
  return final?.length === 1 ? final[0].w : null;
}

/** How far the user got: a knockout round name, "Group stage", or a league position. */
export function exitRound(t: Tournament): string | null {
  for (const matches of t.rounds) {
    const m = matches.find((x) => x.a === t.userId || x.b === t.userId);
    if (m && m.w && m.w !== t.userId) return roundName(matches.length);
  }
  if (t.groups) {
    const group = userGroupIndex(t);
    if (group < 0) return t.stage === 2 ? 'Group stage' : null;
    const row = groupTable(t.groups[group]).find((r) => r.id === t.userId)!;
    if (t.stage === 2) return (t.format as GroupsFormat).second!.league ? `Finished ${ordinal(row.pos)} in the final round` : 'Second round';
    return t.format.type === 'groups' ? 'Group stage' : `Finished ${ordinal(row.pos)}`;
  }
  return null;
}

/**
 * What the group finish means for the user's league status (promotion, play-off, staying up,
 * relegation), for Nations League editions that define it. Null while groups are still running.
 */
export function leagueFate(t: Tournament): Fate | null {
  if (!t.groups || t.phase === 'groups') return null;
  const edition = COMPETITION_BY_ID.get(t.compId)?.editions.find((e) => e.id === t.editionId);
  const fates = t.format.type === 'promotion' ? t.format.fates : t.format.type === 'groups' ? edition?.fates?.A : null;
  if (!fates) return null;
  const tables = groupTables(t);
  const row = tables[userGroupIndex(t)].find((r) => r.id === t.userId)!;
  const rule = fates[row.pos];
  if (!Array.isArray(rule)) return rule ?? null;
  const samePlace = tables
    .map((rows, group) => rows[row.pos - 1] && { ...rows[row.pos - 1], group })
    .filter((r): r is GroupedRow => !!r)
    .sort(acrossGroups);
  return rule[samePlace.findIndex((r) => r.id === t.userId)] ?? null;
}
