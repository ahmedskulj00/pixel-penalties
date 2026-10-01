/** Creating a tournament and playing it forward, one matchday or round at a time. */
import type { Edition, Fixture, GroupsFormat, NationId, NewTournament, TableRow, Tournament, UserResult } from '@/types';
import { COMPETITION_BY_ID, formatOf, leagueFormat, leagueSpot } from '@/data/competitions';
import { simulateShootout } from '@/engine/shootout';
import { nextPow2 } from '@/utils/math';
import { createRng, deriveSeed } from '@/utils/random';
import { buildField } from './field';
import { drawGroups, groupTables, makeGroups, qualifiers, realGroups } from './groups';
import { seedKnockout } from './knockout';
import { dayCount, leagueFate, userGroupIndex } from './queries';
import { GROUP_SALT, LETTERS, makeMatch, ratingOf } from './shared';

type TournamentBase = Pick<Tournament, 'v' | 'compId' | 'editionId' | 'userId' | 'dream' | 'seed' | 'format' | 'day' | 'round' | 'status'>;

export function createTournament({ compId, editionId, userId, dream = false, seed }: NewTournament): Tournament {
  const comp = COMPETITION_BY_ID.get(compId);
  const edition = comp?.editions.find((e) => e.id === editionId);
  if (!comp || !edition) throw new Error(`Unknown edition ${compId}/${editionId}`);
  const rng = createRng(seed);
  const format = formatOf(comp, edition);
  const base: TournamentBase = { v: 2, compId, editionId, userId, dream, seed, format, day: 0, round: 0, status: 'playing' };

  if (format.type === 'knockout') {
    if (edition.pairs) return fixedBracket(base, edition, userId);
    const { entrants, replaced } = buildField({ comp, edition, userId, size: format.size, rng });
    const size = Math.min(format.size, nextPow2(entrants.length));
    const draw = rng.shuffle(entrants);
    const byes = size - draw.length;
    const first: Fixture[] = [];
    let k = 0;
    for (let i = 0; i < size / 2; i++) {
      first.push(i < byes ? makeMatch(draw[k++], null) : makeMatch(draw[k++], draw[k++]));
    }
    return { ...base, replaced, phase: 'knockout', groups: null, rounds: [rng.shuffle(first)] };
  }

  // Seeded teams that skip the groups (CONCACAF Nations League top seeds, Copa América holders).
  const byes = format.type === 'groups' && format.byes ? (edition.byes ?? []).slice(0, format.byes) : [];
  const userSeeded = byes.includes(userId);

  let lists: NationId[][];
  let replaced: NationId | null | undefined;
  if (format.type === 'groups' && edition.groups) {
    const spot = edition.leagues && !dream ? leagueSpot(edition, userId) : null;
    if (spot && spot.league !== 'A') {
      const tier = leagueFormat(edition, spot.league);
      return { ...base, format: tier, replaced: null, phase: 'groups', groups: makeGroups(tier, edition.leagues![spot.league]), rounds: [] };
    }
    ({ lists, replaced } = realGroups(edition, userId));
  } else if (format.type === 'league') {
    const built = buildField({ comp, edition, userId, size: Math.max(2, edition.field?.length ?? 4), rng });
    lists = [built.entrants];
    replaced = built.replaced;
  } else {
    const built = buildField({
      comp,
      edition,
      userId: userSeeded ? null : userId,
      size: format.groups * format.size,
      rng,
      exclude: byes,
    });
    const seeds = [...new Set([...edition.hosts, ...(edition.field ?? []).filter((id) => !byes.includes(id)).slice(0, format.groups)])];
    lists = drawGroups(built.entrants, seeds, format, rng);
    replaced = built.replaced;
  }
  const t: Tournament = { ...base, replaced, phase: 'groups', groups: makeGroups(format, lists), rounds: [], ...(byes.length ? { byes } : {}) };
  return userSeeded ? playOutGroups(t) : t;
}

/** Real first-round pairings (W Championship 2026). A new nation takes the weakest team's place. */
function fixedBracket(base: TournamentBase, edition: Edition, userId: NationId): Tournament {
  const pairs = edition.pairs!;
  const teams = pairs.flat();
  let replaced: NationId | null = null;
  if (!teams.includes(userId)) {
    replaced = [...teams].reverse().reduce((low, id) => (ratingOf(id) < ratingOf(low) ? id : low));
  }
  const swap = (id: NationId) => (id === replaced ? userId : id);
  const first = pairs.map(([a, b]) => makeMatch(swap(a), swap(b)));
  return { ...base, replaced, phase: 'knockout', groups: null, rounds: [first] };
}

function simulatePending(matches: Fixture[], seed: number, round: number): void {
  matches.forEach((m, i) => {
    if (m.w || m.b === null) return;
    const sim = simulateShootout(ratingOf(m.a), ratingOf(m.b), deriveSeed(seed, round, i));
    m.w = sim.winner === 'a' ? m.a : m.b;
    m.s = sim.score;
  });
}

function pairWinners(matches: Fixture[]): Fixture[] {
  const next: Fixture[] = [];
  // Every match in a finished round has a winner.
  for (let i = 0; i < matches.length; i += 2) next.push(makeMatch(matches[i].w!, matches[i + 1].w!));
  return next;
}

function simulateToEnd(t: Tournament): Tournament {
  const rounds = [...t.rounds];
  let r = rounds.length - 1;
  for (;;) {
    const matches = rounds[r].map((m) => ({ ...m }));
    simulatePending(matches, t.seed, r);
    rounds[r] = matches;
    if (matches.length === 1) break;
    rounds.push(pairWinners(matches));
    r += 1;
  }
  return { ...t, rounds, round: r };
}

/** Play out one group matchday: the user's shootout (if any) plus every other fixture. */
function playGroupDay(t: Tournament, result: UserResult | null): Tournament {
  const groups = t.groups!.map((g, gi) => ({
    ...g,
    days: g.days.map((day, d) =>
      d !== t.day
        ? day
        : day.map((m, mi): Fixture => {
            if (m.w) return m;
            if (m.a === t.userId || m.b === t.userId) {
              const userIsA = m.a === t.userId;
              const score = result?.score ?? [0, 0];
              return {
                ...m,
                w: result?.won ? t.userId : userIsA ? m.b : m.a,
                s: userIsA ? [score[0], score[1]] : [score[1], score[0]],
              };
            }
            const sim = simulateShootout(ratingOf(m.a), ratingOf(m.b), deriveSeed(t.seed, GROUP_SALT, gi, d, mi));
            return { ...m, w: sim.winner === 'a' ? m.a : m.b, s: sim.score };
          }),
    ),
  }));
  const next = { ...t, groups, day: t.day + 1 };
  return next.day >= dayCount(next) ? finishGroups(next) : next;
}

/** Resolve '1A' (winner of the first group) against final group tables. */
const byLabel =
  (tables: TableRow[][]) =>
  (label: string): NationId | undefined =>
    tables[LETTERS.indexOf(label[1])]?.[Number(label[0]) - 1]?.id;

/** Play every remaining group matchday without the user (a seeded team, or one knocked out). */
function playOutGroups(t: Tournament): Tournament {
  let next = t;
  while (next.phase === 'groups') {
    const before = next;
    next = playGroupDay(next, null);
    if (next === before) break;
  }
  return next;
}

function finishGroups(t: Tournament): Tournament {
  const tables = groupTables(t);
  if (t.format.type === 'league') {
    return { ...t, phase: 'done', status: tables[0][0].id === t.userId ? 'champion' : 'out' };
  }
  if (t.format.type === 'promotion') {
    const done: Tournament = { ...t, phase: 'done' };
    const row = tables[userGroupIndex(t)].find((r) => r.id === t.userId)!;
    const everyoneUp = Object.values(t.format.fates).every((f) => f === 'promoted');
    const up = !everyoneUp && leagueFate(done) === 'promoted';
    return { ...done, status: row.pos === 1 || up ? 'promoted' : 'out' };
  }
  // Only group formats get this far.
  const second = (t.format as GroupsFormat).second;
  if (second && t.stage !== 2) {
    const lists = second.lists.map((labels) => labels.map(byLabel(tables))) as NationId[][];
    const next: Tournament = {
      ...t,
      stage: 2,
      firstGroups: t.groups!,
      groups: makeGroups({ names: second.names }, lists),
      day: 0,
    };
    const through = lists.flat().includes(t.userId);
    return through ? next : playOutGroups({ ...next, status: 'out' });
  }
  if (second && t.stage === 2) {
    if (second.league) {
      const status = t.status === 'out' ? 'out' : tables[0][0].id === t.userId ? 'champion' : 'out';
      return { ...t, phase: 'done', status };
    }
    const first = second.pairs.map(([x, y]) => makeMatch(byLabel(tables)(x)!, byLabel(tables)(y)!));
    const next: Tournament = { ...t, phase: 'knockout', rounds: [first], round: 0 };
    const through = first.some((m) => m.a === t.userId || m.b === t.userId);
    return through && t.status !== 'out' ? next : simulateToEnd({ ...next, status: 'out' });
  }
  const q = qualifiers(t, tables);
  const next: Tournament = { ...t, phase: 'knockout', rounds: [seedKnockout(t, q)], round: 0 };
  const through = [...q.direct, ...q.extras].some((x) => x.id === t.userId) || !!t.byes?.includes(t.userId);
  return through && t.status !== 'out' ? next : simulateToEnd({ ...next, status: 'out' });
}

/**
 * Record the user's shootout (or a rest day / bye) and move everything else forward.
 * `score` is [user, opponent].
 */
export function recordUserResult(t: Tournament, result: UserResult = {}): Tournament {
  if (t.status !== 'playing') return t;
  if (t.phase === 'groups') return playGroupDay(t, result);
  const { won, score = [0, 0] } = result;
  const r = t.round;
  const matches = t.rounds[r].map((m) => ({ ...m }));
  const m = matches.find((x) => x.a === t.userId || x.b === t.userId);
  if (!m) return t;
  if (!m.bye) {
    const userIsA = m.a === t.userId;
    m.w = won ? t.userId : userIsA ? m.b : m.a;
    m.s = userIsA ? [score[0], score[1]] : [score[1], score[0]];
  }
  simulatePending(matches, t.seed, r);
  const rounds = [...t.rounds.slice(0, r), matches];
  const alive = m.w === t.userId;
  if (matches.length === 1) return { ...t, rounds, status: alive ? 'champion' : 'out' };
  const next: Tournament = { ...t, rounds: [...rounds, pairWinners(matches)], round: r + 1, status: alive ? 'playing' : 'out' };
  return alive ? next : simulateToEnd(next);
}
