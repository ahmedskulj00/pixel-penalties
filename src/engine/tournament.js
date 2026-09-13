import { COMPETITION_BY_ID, eligibleIds, formatOf, knockoutSize, leagueSpot, leagueFormat } from '../data/competitions.js';
import { NATIONS, NATION_BY_ID, existsIn, nameIn } from '../data/nations.js';
import { createRng, deriveSeed } from './rng.js';
import { simulateShootout } from './shootout.js';

/**
 * A tournament is an optional group stage (mini-leagues where every match is a shootout)
 * followed by a knockout bracket, or a single league table (the old round-robin cups).
 * State is plain JSON (v2) so it can be saved and resumed; v1 saves are migrated on load.
 *
 *   phase 'groups'    → group matchdays are being played (t.day is the next one)
 *   phase 'knockout'  → t.rounds[t.round] is the current knockout round
 *   phase 'done'      → a league table (or a lower Nations League tier) has finished
 *
 * Nations League editions with leagues put each nation in its real tier; Leagues B–D play
 * their groups for promotion (format type 'promotion'), League A goes on to the knockouts.
 *
 * Some formats add a second group stage (t.stage 2, with the first stage kept in
 * t.firstGroups), and some seed teams straight into the knockouts (t.byes). A user with
 * a bye watches the groups resolve at creation and starts in the knockouts.
 */

const nextPow2 = (n) => 2 ** Math.ceil(Math.log2(Math.max(2, n)));
const ratingOf = (id) => NATION_BY_ID.get(id)?.rating ?? 2;
const makeMatch = (a, b) => ({ a, b, w: b === null ? a : null, s: null, bye: b === null });
const LETTERS = 'ABCDEFGHIJKL';
const GROUP_SALT = 7919;
const DRAW_SALT = 4241;

export function ordinal(n) {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  return `${n}${teen ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th')}`;
}

// ─── Entrants ───────────────────────────────────────────────────────────────

/**
 * Historical line-up first, then the strongest eligible nations, drawn with weighting.
 * `exclude` keeps seeded teams (byes) out; with no `userId` every place goes to the AI.
 */
export function buildField({ comp, edition, userId, size, rng, exclude = [] }) {
  const skip = new Set(exclude);
  const seedList = (edition.field ?? edition.hosts ?? []).filter((id) => NATION_BY_ID.has(id) && !skip.has(id));
  const slots = userId ? size - 1 : size;
  const known = seedList.filter((id) => id !== userId);
  const chosen = known.slice(0, slots);
  const replaced = userId && !seedList.includes(userId) && known.length > slots ? known[slots] : null;

  if (chosen.length < slots) {
    const pool = eligibleIds(comp, edition).filter((id) => id !== userId && !chosen.includes(id) && !skip.has(id));
    while (chosen.length < slots && pool.length) {
      const i = rng.weighted(pool.map((id) => ratingOf(id) ** 2));
      chosen.push(pool.splice(i, 1)[0]);
    }
  }
  if (chosen.length === 0) {
    const fallback = NATIONS.filter((n) => existsIn(n, edition.year) && n.id !== userId && !skip.has(n.id));
    chosen.push(fallback[rng.int(fallback.length)].id);
  }
  return { entrants: userId ? [userId, ...chosen] : chosen, replaced };
}

// ─── Groups ─────────────────────────────────────────────────────────────────

/** Round-robin matchdays by the circle method: [[[i, j], …] per day]. Odd sizes get a rest day. */
export function roundRobin(n) {
  const ids = Array.from({ length: n }, (_, i) => i);
  if (n % 2) ids.push(-1);
  const m = ids.length;
  const days = [];
  for (let d = 0; d < m - 1; d++) {
    const pairs = [];
    for (let i = 0; i < m / 2; i++) {
      const a = ids[i];
      const b = ids[m - 1 - i];
      if (a >= 0 && b >= 0) pairs.push(d % 2 ? [b, a] : [a, b]);
    }
    days.push(pairs);
    ids.splice(1, 0, ids.pop());
  }
  return days;
}

function makeGroups(format, lists) {
  return lists.map((teams, i) => ({
    name: format.names?.[i] ?? LETTERS[i],
    teams,
    days: roundRobin(teams.length).map((pairs) => pairs.map(([x, y]) => ({ a: teams[x], b: teams[y], w: null, s: null }))),
  }));
}

/** Seeds (hosts, then the historical top finishers) head a group each; the rest go in pots by strength. */
export function drawGroups(entrants, seeds, format, rng) {
  const lists = Array.from({ length: format.groups }, () => []);
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
function realGroups(edition, userId) {
  const lists = edition.groups.map((g) => [...g]);
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
export function groupTable(group) {
  const rows = new Map(group.teams.map((id) => [id, { id, p: 0, w: 0, l: 0, gf: 0, ga: 0, pts: 0 }]));
  const played = [];
  for (const day of group.days) {
    for (const m of day) {
      if (!m.w || !m.s) continue;
      played.push(m);
      const a = rows.get(m.a);
      const b = rows.get(m.b);
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
  const order = (id) => group.teams.indexOf(id);
  const sorted = [...rows.values()].sort((x, y) => y.pts - x.pts);
  const out = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    while (j < sorted.length && sorted[j].pts === sorted[i].pts) j += 1;
    const tied = sorted.slice(i, j);
    if (tied.length > 1) {
      const ids = new Set(tied.map((r) => r.id));
      const h2h = new Map(tied.map((r) => [r.id, { pts: 0, gd: 0, gf: 0 }]));
      for (const m of played) {
        if (!ids.has(m.a) || !ids.has(m.b)) continue;
        const ha = h2h.get(m.a);
        const hb = h2h.get(m.b);
        ha.gf += m.s[0];
        hb.gf += m.s[1];
        ha.gd += m.s[0] - m.s[1];
        hb.gd += m.s[1] - m.s[0];
        (m.w === m.a ? ha : hb).pts += 3;
      }
      tied.sort((x, y) => {
        const hx = h2h.get(x.id);
        const hy = h2h.get(y.id);
        return hy.pts - hx.pts || hy.gd - hx.gd || hy.gf - hx.gf || y.gf - y.ga - (x.gf - x.ga) || y.gf - x.gf || order(x.id) - order(y.id);
      });
    }
    out.push(...tied);
    i = j;
  }
  return out.map((r, k) => ({ ...r, gd: r.gf - r.ga, pos: k + 1 }));
}

export const groupTables = (t) => (t.groups ?? []).map((g) => groupTable(g));

/** Ranking across groups, for the best third-placed teams (or best runner-up). */
const acrossGroups = (x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || y.w - x.w || ratingOf(y.id) - ratingOf(x.id) || x.group - y.group;

export function qualifiers(t, tables = groupTables(t)) {
  const f = t.format;
  const direct = [];
  tables.forEach((rows, group) => rows.slice(0, f.advance).forEach((r) => direct.push({ id: r.id, pos: r.pos, group, row: { ...r, group } })));
  const extras = f.extra
    ? tables
        .map((rows, group) => rows[f.advance] && { ...rows[f.advance], group })
        .filter(Boolean)
        .sort(acrossGroups)
        .slice(0, f.extra)
        .map((r) => ({ id: r.id, pos: r.pos, group: r.group, row: r }))
    : [];
  return { direct, extras };
}

// ─── Knockout seeding ───────────────────────────────────────────────────────

/**
 * First knockout round, listed in bracket order (neighbours meet in the next round).
 * "1A" = winner of group A, "2C" = runner-up of C, "3ADEF" = a best third-placed team from
 * A, D, E or F. The 24-team layout is the one UEFA used at EURO 2016, 2020 and 2024.
 */
const TEMPLATES = {
  '1x2': [['1A', '2A']],
  '2x1': [['1A', '1B']],
  '2x2': [
    ['1A', '2B'],
    ['1B', '2A'],
  ],
  '4x2': [
    ['1A', '2B'],
    ['1C', '2D'],
    ['1B', '2A'],
    ['1D', '2C'],
  ],
  '3x2+2': [
    ['1A', '3BC'],
    ['2A', '2B'],
    ['1B', '2C'],
    ['1C', '3AB'],
  ],
  '6x2+4': [
    ['1B', '3ADEF'],
    ['1A', '2C'],
    ['1F', '3ABC'],
    ['2D', '2E'],
    ['1E', '3ABCD'],
    ['1D', '2F'],
    ['1C', '3DEF'],
    ['2A', '2B'],
  ],
  '2x4': [
    ['1A', '4B'],
    ['2B', '3A'],
    ['1B', '4A'],
    ['2A', '3B'],
  ],
  // World Cup 1998–2022.
  '8x2': [
    ['1A', '2B'],
    ['1C', '2D'],
    ['1E', '2F'],
    ['1G', '2H'],
    ['1B', '2A'],
    ['1D', '2C'],
    ['1F', '2E'],
    ['1H', '2G'],
  ],
  // World Cup 2026: FIFA's round of 32, with the eight best third-placed teams.
  '12x2+8': [
    ['1E', '3ABCDF'],
    ['1I', '3CDFGH'],
    ['2A', '2B'],
    ['1F', '2C'],
    ['2K', '2L'],
    ['1H', '2J'],
    ['1D', '3BEFIJ'],
    ['1G', '3AEHIJ'],
    ['1C', '2F'],
    ['2E', '2I'],
    ['1A', '3CEFHI'],
    ['1L', '3EHIJK'],
    ['1J', '2H'],
    ['2D', '2G'],
    ['1B', '3EFGIJ'],
    ['1K', '3DEIJL'],
  ],
};

const templateKey = (f) => `${f.groups}x${f.advance}${f.extra ? `+${f.extra}` : ''}`;
const isPool = (label) => label.length > 2;

/** Match qualified extra teams to template slots (allowed group sets) so no group-mates meet. */
export function assignExtras(slots, extras) {
  const used = new Array(extras.length).fill(false);
  const pick = new Array(slots.length);
  const place = (s) => {
    if (s === slots.length) return true;
    for (let i = 0; i < extras.length; i++) {
      if (used[i] || !slots[s].has(extras[i].group)) continue;
      used[i] = true;
      pick[s] = i;
      if (place(s + 1)) return true;
      used[i] = false;
    }
    return false;
  };
  return place(0) ? pick : null;
}

/** Pair qualifiers by lot, never two from the same group. */
function drawPairs(list, rng) {
  const pool = rng.shuffle(list);
  const pairs = [];
  const pair = (rest) => {
    if (!rest.length) return true;
    const [first, ...others] = rest;
    for (let i = 0; i < others.length; i++) {
      if (others[i].group === first.group) continue;
      pairs.push([first, others[i]]);
      if (pair(others.filter((_, k) => k !== i))) return true;
      pairs.pop();
    }
    return false;
  };
  if (!pair(pool)) {
    pairs.length = 0;
    for (let i = 0; i < pool.length; i += 2) pairs.push([pool[i], pool[i + 1]]);
  }
  return pairs.map(([x, y]) => makeMatch(x.id, y.id));
}

/** Standard seeding order for a bracket of n slots: 4 → [0, 3, 1, 2], 8 → [0, 7, 3, 4, 1, 6, 2, 5]. */
export function bracketOrder(n) {
  let order = [0];
  while (order.length < n) {
    const m = order.length * 2;
    order = order.flatMap((i) => [i, m - 1 - i]);
  }
  return order;
}

/**
 * Seeded teams join the group qualifiers: the best seed meets the weakest qualifier, and
 * the top two seeds can only meet in the final. Uneven numbers (the holders at the Copa
 * América of 1975–87) are drawn instead.
 */
function seedWithByes(byes, { direct, extras }, rng) {
  const quals = [...direct, ...extras].sort((x, y) => x.pos - y.pos || acrossGroups(x.row, y.row));
  const seeds = byes.map((id, i) => ({ id, group: -1 - i }));
  if (seeds.length !== quals.length) return drawPairs([...seeds, ...quals], rng);
  const pairs = seeds.map((seed, i) => makeMatch(seed.id, quals[quals.length - 1 - i].id));
  return bracketOrder(pairs.length).map((i) => pairs[i]);
}

function seedKnockout(t, { direct, extras }) {
  const rng = createRng(deriveSeed(t.seed, DRAW_SALT));
  if (t.byes?.length) return seedWithByes(t.byes, { direct, extras }, rng);
  const template = TEMPLATES[templateKey(t.format)];
  if (!template) return drawPairs([...direct, ...extras], rng);
  const poolSlots = template.flatMap((pair, p) => pair.map((label, s) => ({ label, p, s }))).filter((x) => isPool(x.label));
  const pick = poolSlots.length ? assignExtras(poolSlots.map((x) => new Set([...x.label.slice(1)].map((c) => LETTERS.indexOf(c)))), extras) : [];
  const resolve = (label, p, s) => {
    if (!isPool(label)) return direct.find((q) => q.pos === Number(label[0]) && q.group === LETTERS.indexOf(label[1]))?.id;
    const k = poolSlots.findIndex((x) => x.p === p && x.s === s);
    return extras[pick ? pick[k] : k]?.id;
  };
  const matches = template.map((pair, p) => makeMatch(resolve(pair[0], p, 0), resolve(pair[1], p, 1)));
  return matches.every((m) => m.a && m.b) ? matches : drawPairs([...direct, ...extras], rng);
}

/** Placeholder labels for the knockout round while the groups are still being played. */
export function knockoutPreview(t) {
  const f = t.format;
  if (f?.type !== 'groups' || f.second || t.stage === 2) return null;
  const size = knockoutSize(f);
  const name = (c) => f.names?.[LETTERS.indexOf(c)] ?? c;
  if (t.byes?.length) {
    const edition = editionOf(t);
    const seedName = (id) => nameIn(NATION_BY_ID.get(id), edition?.year);
    const quals = size - t.byes.length;
    const first =
      t.byes.length === quals
        ? t.byes.map((id) => [seedName(id), 'Group qualifier'])
        : [[t.byes.map(seedName).join(', '), 'Group winner'], ...Array.from({ length: size / 2 - 1 }, () => ['Group winner', 'Group winner'])];
    return { size, first };
  }
  const template = TEMPLATES[templateKey(f)];
  const label = (l) => {
    if (isPool(l)) return `3rd ${[...l.slice(1)].map(name).join('/')}`;
    return `${l[0] === '1' ? 'Winner' : l[0] === '2' ? 'Runner-up' : `${ordinal(Number(l[0]))} in`} ${name(l[1])}`;
  };
  const first = template
    ? template.map(([x, y]) => [label(x), label(y)])
    : Array.from({ length: size / 2 }, (_, i) => ['Group winner', f.extra && i === 0 ? 'Best runner-up' : 'Group winner']);
  return { size, first };
}

const editionOf = (t) => COMPETITION_BY_ID.get(t.compId)?.editions.find((e) => e.id === t.editionId);

// ─── Creation ───────────────────────────────────────────────────────────────

export function createTournament({ compId, editionId, userId, dream = false, seed }) {
  const comp = COMPETITION_BY_ID.get(compId);
  const edition = comp?.editions.find((e) => e.id === editionId);
  if (!comp || !edition) throw new Error(`Unknown edition ${compId}/${editionId}`);
  const rng = createRng(seed);
  const format = formatOf(comp, edition);
  const base = { v: 2, compId, editionId, userId, dream, seed, format, day: 0, round: 0, status: 'playing' };

  if (format.type === 'knockout') {
    if (edition.pairs) return fixedBracket(base, edition, userId);
    const { entrants, replaced } = buildField({ comp, edition, userId, size: format.size, rng });
    const size = Math.min(format.size, nextPow2(entrants.length));
    const draw = rng.shuffle(entrants);
    const byes = size - draw.length;
    const first = [];
    let k = 0;
    for (let i = 0; i < size / 2; i++) {
      first.push(i < byes ? makeMatch(draw[k++], null) : makeMatch(draw[k++], draw[k++]));
    }
    return { ...base, replaced, phase: 'knockout', groups: null, rounds: [rng.shuffle(first)] };
  }

  // Seeded teams that skip the groups (CONCACAF Nations League top seeds, Copa América holders).
  const byes = format.byes ? (edition.byes ?? []).slice(0, format.byes) : [];
  const userSeeded = byes.includes(userId);

  let lists;
  let replaced;
  if (format.type === 'groups' && edition.groups) {
    const spot = edition.leagues && !dream ? leagueSpot(edition, userId) : null;
    if (spot && spot.league !== 'A') {
      const tier = leagueFormat(edition, spot.league);
      return { ...base, format: tier, replaced: null, phase: 'groups', groups: makeGroups(tier, edition.leagues[spot.league]), rounds: [] };
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
  const t = { ...base, replaced, phase: 'groups', groups: makeGroups(format, lists), rounds: [], ...(byes.length ? { byes } : {}) };
  return userSeeded ? playOutGroups(t) : t;
}

/** Real first-round pairings (W Championship 2026). A new nation takes the weakest team's place. */
function fixedBracket(base, edition, userId) {
  const teams = edition.pairs.flat();
  let replaced = null;
  if (!teams.includes(userId)) {
    replaced = [...teams].reverse().reduce((low, id) => (ratingOf(id) < ratingOf(low) ? id : low));
  }
  const swap = (id) => (id === replaced ? userId : id);
  const first = edition.pairs.map(([a, b]) => makeMatch(swap(a), swap(b)));
  return { ...base, replaced, phase: 'knockout', groups: null, rounds: [first] };
}

// ─── Progress ───────────────────────────────────────────────────────────────

const dayCount = (t) => Math.max(0, ...(t.groups ?? []).map((g) => g.days.length));
export const userGroupIndex = (t) => (t.groups ?? []).findIndex((g) => g.teams.includes(t.userId));
/** The second group stage (World Cup 1950–82, final rounds), once it has been drawn. */
export const inSecondStage = (t) => t.stage === 2;

/** The user's next fixture: a group match, a rest day, or a knockout match (possibly a bye). */
export function userMatch(t) {
  if (t.phase === 'groups') {
    const group = userGroupIndex(t);
    const days = t.groups[group]?.days ?? [];
    const m = days[t.day]?.find((x) => x.a === t.userId || x.b === t.userId);
    const base = { stage: 'group', group, day: t.day, days: days.length };
    if (!m) return { ...base, rest: true, opponent: null };
    return { ...base, ...m, opponent: m.a === t.userId ? m.b : m.a };
  }
  const matches = t.rounds[t.round] ?? [];
  const index = matches.findIndex((m) => m.a === t.userId || m.b === t.userId);
  if (index < 0) return null;
  const m = matches[index];
  return { stage: 'knockout', ...m, index, opponent: m.a === t.userId ? m.b : m.a };
}

export function roundName(matchCount) {
  return { 1: 'Final', 2: 'Semi-final', 4: 'Quarter-final', 8: 'Round of 16' }[matchCount] ?? `Round of ${matchCount * 2}`;
}

/** Where the user is now, e.g. "Group B, matchday 2 of 3" or "Semi-final". */
export function stageLabel(t, { short = false } = {}) {
  if (t.phase === 'groups') {
    const m = userMatch(t);
    const g = t.groups[m.group];
    if (t.format.type === 'league') return short ? `Matchday ${t.day + 1}` : `Matchday ${t.day + 1} of ${m.days}`;
    if (t.stage === 2) {
      const stage = t.format.second.league ? 'Final round' : `Second round, group ${g.name}`;
      return short ? stage : `${stage}, matchday ${t.day + 1} of ${m.days}`;
    }
    return short ? `Group ${g.name}` : `Group ${g.name}, matchday ${t.day + 1} of ${m.days}`;
  }
  return roundName(t.rounds[t.round]?.length ?? 1);
}

function simulatePending(matches, seed, round) {
  matches.forEach((m, i) => {
    if (m.w || m.b === null) return;
    const sim = simulateShootout(ratingOf(m.a), ratingOf(m.b), deriveSeed(seed, round, i));
    m.w = sim.winner === 'a' ? m.a : m.b;
    m.s = sim.score;
  });
}

function pairWinners(matches) {
  const next = [];
  for (let i = 0; i < matches.length; i += 2) next.push(makeMatch(matches[i].w, matches[i + 1].w));
  return next;
}

function simulateToEnd(t) {
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
function playGroupDay(t, result) {
  const groups = t.groups.map((g, gi) => ({
    ...g,
    days: g.days.map((day, d) =>
      d !== t.day
        ? day
        : day.map((m, mi) => {
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
const byLabel = (tables) => (label) => tables[LETTERS.indexOf(label[1])]?.[Number(label[0]) - 1]?.id;

/** Play every remaining group matchday without the user (a seeded team, or one knocked out). */
function playOutGroups(t) {
  let next = t;
  while (next.phase === 'groups' && next.status !== 'done') {
    const before = next;
    next = playGroupDay(next, null);
    if (next === before) break;
  }
  return next;
}

function finishGroups(t) {
  const tables = groupTables(t);
  if (t.format.type === 'league') {
    return { ...t, phase: 'done', status: tables[0][0].id === t.userId ? 'champion' : 'out' };
  }
  if (t.format.type === 'promotion') {
    const done = { ...t, phase: 'done' };
    const row = tables[userGroupIndex(t)].find((r) => r.id === t.userId);
    const everyoneUp = Object.values(t.format.fates).every((f) => f === 'promoted');
    const up = !everyoneUp && leagueFate(done) === 'promoted';
    return { ...done, status: row.pos === 1 || up ? 'promoted' : 'out' };
  }
  const second = t.format.second;
  if (second && t.stage !== 2) {
    const lists = second.lists.map((labels) => labels.map(byLabel(tables)));
    const next = {
      ...t,
      stage: 2,
      firstGroups: t.groups,
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
    const first = second.pairs.map(([x, y]) => makeMatch(byLabel(tables)(x), byLabel(tables)(y)));
    const next = { ...t, phase: 'knockout', rounds: [first], round: 0 };
    const through = first.some((m) => m.a === t.userId || m.b === t.userId);
    return through && t.status !== 'out' ? next : simulateToEnd({ ...next, status: 'out' });
  }
  const q = qualifiers(t, tables);
  const next = { ...t, phase: 'knockout', rounds: [seedKnockout(t, q)], round: 0 };
  const through = [...q.direct, ...q.extras].some((x) => x.id === t.userId) || !!t.byes?.includes(t.userId);
  return through && t.status !== 'out' ? next : simulateToEnd({ ...next, status: 'out' });
}

/**
 * Record the user's shootout (or a rest day / bye) and move everything else forward.
 * `score` is [user, opponent].
 */
export function recordUserResult(t, result = {}) {
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
  const next = { ...t, rounds: [...rounds, pairWinners(matches)], round: r + 1, status: alive ? 'playing' : 'out' };
  return alive ? next : simulateToEnd(next);
}

export function championOf(t) {
  if (t.format?.type === 'promotion') return null;
  if (t.format?.type === 'league' || (t.stage === 2 && t.format.second?.league)) {
    return t.phase === 'done' ? groupTables(t)[0][0].id : null;
  }
  const final = t.rounds[t.rounds.length - 1];
  return final?.length === 1 ? final[0].w : null;
}

/** How far the user got: a knockout round name, "Group stage", or a league position. */
export function exitRound(t) {
  for (const matches of t.rounds) {
    const m = matches.find((x) => x.a === t.userId || x.b === t.userId);
    if (m && m.w && m.w !== t.userId) return roundName(matches.length);
  }
  if (t.groups) {
    const group = userGroupIndex(t);
    if (group < 0) return t.stage === 2 ? 'Group stage' : null;
    const row = groupTable(t.groups[group]).find((r) => r.id === t.userId);
    if (t.stage === 2) return t.format.second.league ? `Finished ${ordinal(row.pos)} in the final round` : 'Second round';
    return t.format.type === 'groups' ? 'Group stage' : `Finished ${ordinal(row.pos)}`;
  }
  return null;
}

/**
 * What the group finish means for the user's league status (promotion, play-off, staying up,
 * relegation), for Nations League editions that define it. Null while groups are still running.
 */
export function leagueFate(t) {
  if (!t.groups || t.phase === 'groups') return null;
  const edition = COMPETITION_BY_ID.get(t.compId)?.editions.find((e) => e.id === t.editionId);
  const fates = t.format.type === 'promotion' ? t.format.fates : t.format.type === 'groups' ? edition?.fates?.A : null;
  if (!fates) return null;
  const tables = groupTables(t);
  const row = tables[userGroupIndex(t)].find((r) => r.id === t.userId);
  const rule = fates[row.pos];
  if (!Array.isArray(rule)) return rule ?? null;
  const samePlace = tables
    .map((rows, group) => rows[row.pos - 1] && { ...rows[row.pos - 1], group })
    .filter(Boolean)
    .sort(acrossGroups);
  return rule[samePlace.findIndex((r) => r.id === t.userId)] ?? null;
}

// ─── Storage ────────────────────────────────────────────────────────────────

const validMatch = (m) => m && NATION_BY_ID.has(m.a) && (m.b === null || NATION_BY_ID.has(m.b));

/** Guard for anything loaded from storage. Returns a valid (v2) tournament or null. */
export function validateTournament(raw) {
  try {
    if (!raw) return null;
    let t = raw;
    if (t.v === 1 && Array.isArray(t.rounds) && t.rounds.length) {
      t = { ...t, v: 2, phase: 'knockout', groups: null, day: 0, format: { type: 'knockout', size: t.rounds[0].length * 2 } };
    }
    if (t.v !== 2 || !t.format || !Array.isArray(t.rounds)) return null;
    const comp = COMPETITION_BY_ID.get(t.compId);
    if (!comp || !comp.editions.some((e) => e.id === t.editionId)) return null;
    if (!NATION_BY_ID.has(t.userId)) return null;
    if (!['playing', 'champion', 'promoted', 'out'].includes(t.status)) return null;
    if (!['groups', 'knockout', 'done'].includes(t.phase)) return null;
    const validGroups = (groups) =>
      Array.isArray(groups) &&
      groups.every(
        (g) =>
          Array.isArray(g.teams) &&
          g.teams.every((id) => NATION_BY_ID.has(id)) &&
          Array.isArray(g.days) &&
          g.days.every((d) => Array.isArray(d) && d.every(validMatch)),
      );
    if (t.stage !== undefined && t.stage !== 2) return null;
    if (t.stage === 2 && (!t.format.second || !validGroups(t.firstGroups))) return null;
    if (t.byes !== undefined && (!Array.isArray(t.byes) || !t.byes.every((id) => NATION_BY_ID.has(id)))) return null;
    if (t.groups) {
      // The user may sit outside the groups when seeded into the knockouts or already out.
      const absentOk = !!t.byes?.includes(t.userId) || t.status === 'out' || t.stage === 2;
      if (!validGroups(t.groups) || (userGroupIndex(t) < 0 && !absentOk)) return null;
      if (t.phase === 'groups' && t.status === 'playing' && userGroupIndex(t) < 0) return null;
      if (!Number.isInteger(t.day) || t.day < 0 || t.day > dayCount(t)) return null;
    }
    if (t.phase === 'groups' && !t.groups) return null;
    if (t.phase === 'knockout' && (!Number.isInteger(t.round) || t.round < 0 || t.round >= t.rounds.length)) return null;
    if (!t.rounds.every((ms) => Array.isArray(ms) && ms.every(validMatch))) return null;
    return t;
  } catch {
    return null;
  }
}
