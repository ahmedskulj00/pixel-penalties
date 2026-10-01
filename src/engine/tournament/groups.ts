import type { Edition, Fixture, Format, Group, GroupsFormat, NationId, Score, TableRow, Tournament } from '@/types';
import type { Rng } from '@/utils/random';
import { LETTERS, ratingOf } from './shared';

/** A table row with the index of its group, for ranking teams across groups. */
export type GroupedRow = TableRow & { group: number };

export interface Qualifier {
  id: NationId;
  pos: number;
  group: number;
  row: GroupedRow;
}

export interface Qualifiers {
  direct: Qualifier[];
  extras: Qualifier[];
}

type PlayedFixture = Fixture & { b: NationId; w: NationId; s: Score };
const isPlayed = (m: Fixture): m is PlayedFixture => !!m.w && !!m.s && m.b !== null;

/** Round-robin matchdays by the circle method: [[[i, j], …] per day]. Odd sizes get a rest day. */
export function roundRobin(n: number): [number, number][][] {
  const ids = Array.from({ length: n }, (_, i) => i);
  if (n % 2) ids.push(-1);
  const m = ids.length;
  const days: [number, number][][] = [];
  for (let d = 0; d < m - 1; d++) {
    const pairs: [number, number][] = [];
    for (let i = 0; i < m / 2; i++) {
      const a = ids[i];
      const b = ids[m - 1 - i];
      if (a >= 0 && b >= 0) pairs.push(d % 2 ? [b, a] : [a, b]);
    }
    days.push(pairs);
    ids.splice(1, 0, ids.pop() as number);
  }
  return days;
}

export function makeGroups(format: Format | { names?: readonly string[] }, lists: NationId[][]): Group[] {
  return lists.map((teams, i) => ({
    name: ('names' in format ? format.names?.[i] : undefined) ?? LETTERS[i],
    teams,
    days: roundRobin(teams.length).map((pairs) => pairs.map(([x, y]) => ({ a: teams[x], b: teams[y], w: null, s: null }))),
  }));
}

/** Seeds (hosts, then the historical top finishers) head a group each; the rest go in pots by strength. */
export function drawGroups(entrants: NationId[], seeds: NationId[], format: { groups: number }, rng: Rng): NationId[][] {
  const lists = Array.from({ length: format.groups }, (): NationId[] => []);
  const heads = seeds.filter((id) => entrants.includes(id)).slice(0, format.groups);
  heads.forEach((id, i) => lists[i].push(id));
  const rest = entrants.filter((id) => !heads.includes(id)).sort((a, b) => ratingOf(b) - ratingOf(a));
  while (rest.length) {
    const level = Math.min(...lists.map((g) => g.length));
    const open = lists.map((g, i) => (g.length === level ? i : -1)).filter((i) => i >= 0);
    rng.shuffle(rest.splice(0, open.length)).forEach((id, k) => lists[open[k]].push(id));
  }
  return lists;
}

/** Real groups; a nation that was not there takes the place of the lowest finisher. */
export function realGroups(edition: Edition, userId: NationId): { lists: NationId[][]; replaced: NationId | null | undefined } {
  const lists = edition.groups!.map((g) => [...g]);
  const all = lists.flat();
  if (all.includes(userId) || edition.byes?.includes(userId)) return { lists, replaced: null };
  // Groups are in standings order, so the lowest finisher is the last team missing from the
  // recorded line-up (which may list only the knockout sides), or else that line-up's last.
  const order = edition.field ?? [];
  const missing = all.filter((id) => !order.includes(id));
  const replaced = missing.length ? missing[missing.length - 1] : order.filter((id) => all.includes(id)).pop();
  return { lists: lists.map((g) => g.map((id) => (id === replaced ? userId : id))), replaced };
}

/**
 * Standings for one group. Three points per shootout won, then head-to-head among the
 * tied teams, overall penalty difference, penalties scored, and finally draw position
 * (the seeding order), which stands in for UEFA's coefficient ranking.
 */
export function groupTable(group: Group): TableRow[] {
  const rows = new Map(group.teams.map((id) => [id, { id, p: 0, w: 0, l: 0, gf: 0, ga: 0, pts: 0 }]));
  const played: PlayedFixture[] = [];
  for (const day of group.days) {
    for (const m of day) {
      if (!isPlayed(m)) continue;
      played.push(m);
      const a = rows.get(m.a)!;
      const b = rows.get(m.b)!;
      a.p += 1;
      b.p += 1;
      a.gf += m.s[0];
      a.ga += m.s[1];
      b.gf += m.s[1];
      b.ga += m.s[0];
      const [win, loss] = m.w === m.a ? [a, b] : [b, a];
      win.w += 1;
      win.pts += 3;
      loss.l += 1;
    }
  }
  const order = (id: NationId) => group.teams.indexOf(id);
  const sorted = [...rows.values()].sort((x, y) => y.pts - x.pts);
  const out: Omit<TableRow, 'gd' | 'pos'>[] = [];
  for (let i = 0; i < sorted.length;) {
    let j = i;
    while (j < sorted.length && sorted[j].pts === sorted[i].pts) j += 1;
    const tied = sorted.slice(i, j);
    if (tied.length > 1) {
      const ids = new Set(tied.map((r) => r.id));
      const h2h = new Map(tied.map((r) => [r.id, { pts: 0, gd: 0, gf: 0 }]));
      for (const m of played) {
        if (!ids.has(m.a) || !ids.has(m.b)) continue;
        const ha = h2h.get(m.a)!;
        const hb = h2h.get(m.b)!;
        ha.gf += m.s[0];
        hb.gf += m.s[1];
        ha.gd += m.s[0] - m.s[1];
        hb.gd += m.s[1] - m.s[0];
        (m.w === m.a ? ha : hb).pts += 3;
      }
      tied.sort((x, y) => {
        const hx = h2h.get(x.id)!;
        const hy = h2h.get(y.id)!;
        return hy.pts - hx.pts || hy.gd - hx.gd || hy.gf - hx.gf || y.gf - y.ga - (x.gf - x.ga) || y.gf - x.gf || order(x.id) - order(y.id);
      });
    }
    out.push(...tied);
    i = j;
  }
  return out.map((r, k) => ({ ...r, gd: r.gf - r.ga, pos: k + 1 }));
}

export const groupTables = (t: Pick<Tournament, 'groups'>): TableRow[][] => (t.groups ?? []).map((g) => groupTable(g));

/** Ranking across groups, for the best third-placed teams (or best runner-up). */
export const acrossGroups = (x: GroupedRow, y: GroupedRow): number =>
  y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || y.w - x.w || ratingOf(y.id) - ratingOf(x.id) || x.group - y.group;

export function qualifiers(t: Tournament, tables: TableRow[][] = groupTables(t)): Qualifiers {
  const f = t.format as GroupsFormat;
  const direct: Qualifier[] = [];
  tables.forEach((rows, group) => rows.slice(0, f.advance).forEach((r) => direct.push({ id: r.id, pos: r.pos, group, row: { ...r, group } })));
  const extras = f.extra
    ? tables
        .map((rows, group) => rows[f.advance] && { ...rows[f.advance], group })
        .filter((r): r is GroupedRow => !!r)
        .sort(acrossGroups)
        .slice(0, f.extra)
        .map((r) => ({ id: r.id, pos: r.pos, group: r.group, row: r }))
    : [];
  return { direct, extras };
}
