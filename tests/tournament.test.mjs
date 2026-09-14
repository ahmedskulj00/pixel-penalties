import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPETITIONS, eligibleIds, formatOf, getCompetition, getEdition, championIds, leagueSpot } from '../src/data/competitions.js';
import { NATIONS, NATION_BY_ID } from '../src/data/nations.js';
import {
  createTournament, recordUserResult, userMatch, championOf, exitRound, validateTournament, roundName,
  roundRobin, groupTable, groupTables, assignExtras, knockoutPreview, stageLabel, userGroupIndex, leagueFate, bracketOrder,
} from '../src/engine/tournament.js';
import { createRng } from '../src/engine/rng.js';

function playThrough(t, rng) {
  let guard = 0;
  while (t.status === 'playing') {
    const m = userMatch(t);
    assert.ok(m, 'the user always has something to play while the tournament is live');
    assert.ok(stageLabel(t).length > 0);
    if (m.rest || m.bye) {
      t = recordUserResult(t, {});
    } else {
      const won = rng.chance(0.6);
      const loser = rng.int(4);
      t = recordUserResult(t, { won, score: won ? [loser + 1, loser] : [loser, loser + 1] });
    }
    assert.ok(++guard < 40, 'tournament terminates');
  }
  return t;
}

function assertKnockout(t) {
  if (!t.rounds.length) return;
  const sizes = t.rounds.map((r) => r.length);
  for (let i = 1; i < sizes.length; i++) assert.equal(sizes[i], sizes[i - 1] / 2, 'rounds halve');
  assert.equal(sizes[sizes.length - 1], 1, 'ends with a final');
  for (let r = 0; r < t.rounds.length; r++) {
    t.rounds[r].forEach((m, idx) => {
      assert.ok(m.w === m.a || m.w === m.b, `round ${r} winner is one of the two teams`);
      if (r > 0) {
        assert.equal(m.a, t.rounds[r - 1][idx * 2].w);
        assert.equal(m.b, t.rounds[r - 1][idx * 2 + 1].w);
      }
    });
  }
  const first = t.rounds[0].flatMap((m) => [m.a, m.b]).filter(Boolean);
  assert.equal(new Set(first).size, first.length, 'no nation twice in the first knockout round');
}

function assertGroups(t) {
  if (t.firstGroups) assertGroups({ groups: t.firstGroups });
  if (!t.groups) return;
  const everyone = t.groups.flatMap((g) => g.teams);
  assert.equal(new Set(everyone).size, everyone.length, 'nobody is in two groups');
  for (const id of t.byes ?? []) assert.ok(!everyone.includes(id), 'seeded teams skip the groups');
  for (const g of t.groups) {
    const pairs = new Set();
    for (const day of g.days) {
      const today = day.flatMap((m) => [m.a, m.b]);
      assert.equal(new Set(today).size, today.length, 'one match per team per matchday');
      for (const m of day) {
        assert.ok(m.w === m.a || m.w === m.b, 'every group match has a winner');
        assert.ok(m.s[m.w === m.a ? 0 : 1] > m.s[m.w === m.a ? 1 : 0], 'the winner scored more penalties');
        pairs.add([m.a, m.b].sort().join('-'));
      }
    }
    const n = g.teams.length;
    assert.equal(pairs.size, (n * (n - 1)) / 2, 'everyone meets everyone once');
  }
}

test('every edition of every competition can be played to the end', () => {
  const rng = createRng(2026);
  let played = 0;
  for (const comp of COMPETITIONS) {
    for (const edition of comp.editions) {
      const eligible = eligibleIds(comp, edition);
      for (const userId of [eligible[0], eligible[eligible.length - 1]]) {
        let t = createTournament({ compId: comp.id, editionId: edition.id, userId, seed: rng.int(1e9) + 1 });
        const format = formatOf(comp, edition);
        const seeded = t.byes?.includes(userId);
        assert.equal(t.phase, format.type === 'knockout' || seeded ? 'knockout' : 'groups');
        t = playThrough(t, rng);
        assertGroups(t);
        assert.ok(validateTournament(JSON.parse(JSON.stringify(t))), 'survives a storage round trip');
        played += 1;
        if (t.format.type === 'promotion') {
          assert.ok(t.status === 'promoted' || t.status === 'out');
          assert.equal(t.rounds.length, 0, 'lower leagues have no knockouts');
          assert.ok(leagueFate(t), `${comp.id} ${edition.id} says what the finish means`);
          continue;
        }
        assert.ok(t.status === 'champion' || t.status === 'out');
        assertKnockout(t);
        const champ = championOf(t);
        assert.ok(champ, `${comp.id} ${edition.id} has a champion`);
        if (t.status === 'champion') assert.equal(champ, userId);
        else assert.ok(exitRound(t), `${comp.id} ${edition.id} says where the user went out`);
      }
    }
  }
  assert.ok(played > 900);
});

test('group formats produce the right knockout size and pairings', () => {
  const rng = createRng(9);
  for (const [compId, editionId, koSize] of [
    ['euro', '2024', 8], ['euro', '2012', 4], ['euro', '1980', 1], ['weuro', '2013', 4], ['unl', '2022–23', 2],
    ['wc', '2026', 16], ['wc', '2022', 8], ['wc', '1994', 8], ['wc', '1966', 4], ['wwc', '1991', 4], ['copa', '2021', 4],
    ['asiancup', '2023', 8], ['afcon', '2025', 8], ['gold', '2025', 4], ['ofc', '1973', 1], ['cafa', '2025', 1],
  ]) {
    let t = createTournament({ compId, editionId, userId: getEdition(getCompetition(compId), editionId).field[0], seed: 77 });
    while (t.phase === 'groups') t = recordUserResult(t, { won: true, score: [5, 4] });
    assert.equal(t.rounds[0].length, koSize, `${compId} ${editionId} first knockout round`);
    const groupOf = new Map(t.groups.flatMap((g, i) => g.teams.map((id) => [id, i])));
    if (t.groups.length > 1) {
      for (const m of t.rounds[0]) assert.notEqual(groupOf.get(m.a), groupOf.get(m.b), `${compId} ${editionId}: group-mates never meet straight away`);
    }
    void rng;
  }
});

test('round-robin schedules: everyone once, never twice in a day', () => {
  for (let n = 2; n <= 7; n++) {
    const days = roundRobin(n);
    const seen = new Set();
    for (const day of days) {
      const ids = day.flat();
      assert.equal(new Set(ids).size, ids.length);
      for (const [a, b] of day) seen.add([a, b].sort().join('-'));
    }
    assert.equal(seen.size, (n * (n - 1)) / 2, `n=${n}`);
    assert.equal(days.length, n % 2 ? n : n - 1);
  }
});

test('tiebreakers: points, then head-to-head, then penalty difference', () => {
  const m = (a, b, sa, sb) => ({ a, b, s: [sa, sb], w: sa > sb ? a : b });
  // A, B, C all win twice; D loses everything. A beat B, B beat C, C beat A: a perfect triangle.
  const group = {
    teams: ['A', 'B', 'C', 'D'],
    days: [[m('A', 'B', 5, 4), m('C', 'D', 3, 0)], [m('B', 'C', 4, 2), m('A', 'D', 5, 4)], [m('C', 'A', 5, 4), m('B', 'D', 7, 6)]],
  };
  const table = groupTable(group);
  assert.deepEqual(table.map((r) => r.pts), [6, 6, 6, 0]);
  // Head-to-head difference among A/B/C: A 0, B +1, C -1  →  B, A, C.
  assert.deepEqual(table.map((r) => r.id), ['B', 'A', 'C', 'D']);
  const two = { teams: ['X', 'Y', 'Z'], days: [[m('X', 'Y', 3, 5)], [m('Z', 'X', 1, 3)], [m('Y', 'Z', 0, 3)]] };
  // All on 3 points and a head-to-head triangle; penalty difference decides: Z +1, X 0, Y -1.
  assert.deepEqual(groupTable(two).map((r) => r.id), ['Z', 'X', 'Y']);
});

test('best third-placed teams can always be slotted in without group-mates meeting', () => {
  const euroSlots = ['ADEF', 'ABC', 'ABCD', 'DEF'].map((s) => new Set([...s].map((c) => 'ABCDEF'.indexOf(c))));
  const groups = [0, 1, 2, 3, 4, 5];
  let combos = 0;
  for (let a = 0; a < 6; a++)
    for (let b = a + 1; b < 6; b++)
      for (let c = b + 1; c < 6; c++)
        for (let d = c + 1; d < 6; d++) {
          combos += 1;
          const extras = [a, b, c, d].map((group) => ({ group }));
          assert.ok(assignExtras(euroSlots, extras), `EURO thirds from ${[a, b, c, d].map((i) => 'ABCDEF'[i]).join('')}`);
        }
  assert.equal(combos, 15);
  const weuroSlots = ['BC', 'AB'].map((s) => new Set([...s].map((c) => 'ABC'.indexOf(c))));
  for (const pair of [[0, 1], [0, 2], [1, 2]]) assert.ok(assignExtras(weuroSlots, pair.map((group) => ({ group }))));
  void groups;

  // World Cup 2026: eight of twelve third-placed teams, 495 possible combinations.
  const L = 'ABCDEFGHIJKL';
  const wcSlots = ['ABCDF', 'CDFGH', 'BEFIJ', 'AEHIJ', 'CEFHI', 'EHIJK', 'EFGIJ', 'DEIJL'].map((s) => new Set([...s].map((c) => L.indexOf(c))));
  let wcCombos = 0;
  for (let mask = 0; mask < 4096; mask++) {
    const picked = [...Array(12).keys()].filter((g) => mask & (1 << g));
    if (picked.length !== 8) continue;
    wcCombos += 1;
    assert.ok(assignExtras(wcSlots, picked.map((group) => ({ group }))), `World Cup thirds from ${picked.map((g) => L[g]).join('')}`);
  }
  assert.equal(wcCombos, 495);
});

test('real groups match the historical line-ups', () => {
  for (const comp of COMPETITIONS) {
    for (const e of comp.editions) {
      if (!e.groups) continue;
      const f = formatOf(comp, e);
      assert.equal(f.type, 'groups', `${comp.id} ${e.id} has a group format`);
      assert.equal(e.groups.length, f.groups, `${comp.id} ${e.id} group count`);
      for (const g of e.groups) {
        assert.ok(g.length >= 2 && g.length <= f.size, `${comp.id} ${e.id} group size`);
        for (const id of g) assert.ok(NATION_BY_ID.has(id), `${comp.id} ${e.id} ${id} exists`);
      }
      const all = e.groups.flat();
      const byes = e.byes ?? [];
      assert.equal(new Set(all).size, all.length, `${comp.id} ${e.id} no duplicates`);
      for (const id of byes) assert.ok(!all.includes(id), `${comp.id} ${e.id} seeded ${id} is not in a group`);
      if (e.field && e.field.length === all.length + byes.length) {
        assert.deepEqual([...all, ...byes].sort(), [...e.field].sort(), `${comp.id} ${e.id} groups and seeds are exactly the line-up`);
      }
      if (e.field && e.status === 'played') {
        const finalists = e.field.slice(0, Math.min(e.field.length, f.groups * f.advance + f.extra + byes.length));
        for (const id of finalists) assert.ok(all.includes(id) || byes.includes(id), `${comp.id} ${e.id} knockout team ${id} was in the draw`);
      }
      const winners = championIds(e);
      for (const id of winners) assert.ok(all.includes(id) || byes.includes(id), `${comp.id} ${e.id} champion was in the draw`);
    }
  }
});

test('historical line-ups come first, dream entries take the last place', () => {
  const t = createTournament({ compId: 'euro', editionId: '1976', userId: 'TCH', seed: 5 });
  assert.deepEqual(t.rounds[0].flatMap((m) => [m.a, m.b]).sort(), ['FRG', 'NED', 'TCH', 'YUG']);
  const dream = createTournament({ compId: 'euro', editionId: '1976', userId: 'WAL', dream: true, seed: 5 });
  assert.deepEqual(dream.rounds[0].flatMap((m) => [m.a, m.b]).sort(), ['FRG', 'NED', 'TCH', 'WAL']);
  assert.equal(dream.replaced, 'YUG');

  const g = createTournament({ compId: 'euro', editionId: '2024', userId: 'WAL', dream: true, seed: 5 });
  assert.equal(g.replaced, 'HUN', 'the lowest finisher in the real line-up makes way');
  assert.ok(g.groups[0].teams.includes('WAL'), 'and the newcomer takes their group slot');
});

test('dream mode works with a nation that no longer exists', () => {
  const t = createTournament({ compId: 'euro', editionId: '2032', userId: 'URS', dream: true, seed: 11 });
  assert.equal(t.groups.length, 6);
  const everyone = t.groups.flatMap((g) => g.teams);
  assert.equal(everyone.length, 24);
  assert.ok(everyone.includes('ITA') && everyone.includes('TUR'), 'hosts qualify automatically');
  assert.equal(t.groups[0].teams[0], 'ITA', 'first host heads group A');
  assert.ok(!everyone.includes('RUS'), 'suspended nations are not drawn');
  assert.equal(knockoutPreview(t).size, 16);
});

test('round-robin cups crown the top of the table', () => {
  let t = createTournament({ compId: 'copa', editionId: '1916', userId: 'CHI', seed: 8 });
  assert.equal(t.groups.length, 1);
  assert.deepEqual([...t.groups[0].teams].sort(), ['ARG', 'BRA', 'CHI', 'URU']);
  while (t.status === 'playing') t = recordUserResult(t, { won: true, score: [3, 1] });
  assert.equal(t.status, 'champion');
  assert.equal(championOf(t), 'CHI');
  assert.deepEqual(groupTables(t)[0][0], { ...groupTables(t)[0][0], id: 'CHI', w: 3, pts: 9 });
  const three = createTournament({ compId: 'baltic', editionId: '1928', userId: 'EST', seed: 2 });
  assert.equal(three.groups[0].days.length, 3, 'three teams: one rests each matchday');
  assert.ok([0, 1, 2].some((d) => userMatch({ ...three, day: d }).rest));
});

test('storage validation rejects anything malformed and migrates old saves', () => {
  assert.equal(validateTournament(null), null);
  assert.equal(validateTournament({ v: 2 }), null);
  const t = createTournament({ compId: 'euro', editionId: '1984', userId: 'FRA', seed: 9 });
  assert.equal(validateTournament({ ...t, userId: 'XXX' }), null);
  assert.equal(validateTournament({ ...t, day: 9 }), null);
  assert.ok(validateTournament(t));
  const v1 = { v: 1, compId: 'euro', editionId: '1976', userId: 'TCH', dream: false, seed: 1, replaced: null, rounds: [[{ a: 'TCH', b: 'NED', w: null, s: null, bye: false }, { a: 'FRG', b: 'YUG', w: null, s: null, bye: false }]], round: 0, status: 'playing' };
  const migrated = validateTournament(v1);
  assert.equal(migrated.v, 2);
  assert.equal(migrated.phase, 'knockout');
  assert.equal(userMatch(migrated).opponent, 'NED');
  assert.equal(roundName(migrated.rounds[0].length), 'Semi-final');
  assert.equal(NATIONS.length, 236);

  // Second group stages and seeded byes survive a round trip, and broken ones are rejected.
  let two = createTournament({ compId: 'wc', editionId: '1982', userId: 'ITA', seed: 4 });
  while (two.stage !== 2) two = recordUserResult(two, { won: true, score: [4, 2] });
  assert.ok(validateTournament(JSON.parse(JSON.stringify(two))));
  assert.equal(validateTournament({ ...two, firstGroups: undefined }), null);
  assert.equal(validateTournament({ ...two, stage: 3 }), null);
  const seeded = createTournament({ compId: 'cnl', editionId: '2023–24', userId: 'USA', seed: 4 });
  assert.ok(validateTournament(JSON.parse(JSON.stringify(seeded))));
  assert.equal(validateTournament({ ...seeded, byes: ['XXX'] }), null);
  assert.equal(validateTournament({ ...seeded, byes: undefined, phase: 'groups' }), null, 'a live user must be in a group');
});

test('second group stages follow the real formats', () => {
  const play = (compId, editionId, userId, won = true) => {
    let t = createTournament({ compId, editionId, userId, seed: 12 });
    const seen = [];
    while (t.status === 'playing') {
      seen.push(stageLabel(t, { short: true }));
      t = recordUserResult(t, userMatch(t).rest ? {} : { won, score: won ? [5, 3] : [3, 5] });
    }
    return { t, seen };
  };
  // 1950: no final, four group winners play a final round.
  const wc50 = play('wc', '1950', 'URU');
  assert.equal(wc50.t.status, 'champion');
  assert.equal(wc50.t.rounds.length, 0, 'decided by the final round table');
  assert.equal(wc50.t.groups.length, 1);
  assert.equal(wc50.t.groups[0].teams.length, 4);
  assert.ok(wc50.seen.includes('Final round'));
  // 1982: winners and runners-up of six groups make four groups of three, then semi-finals.
  const wc82 = createTournament({ compId: 'wc', editionId: '1982', userId: 'ITA', seed: 3 });
  let t = wc82;
  while (t.stage !== 2) t = recordUserResult(t, { won: true, score: [5, 4] });
  const first = t.firstGroups.map((g) => groupTable(g).map((r) => r.id));
  assert.deepEqual(t.groups.map((g) => g.teams), [
    [first[0][0], first[2][0], first[5][1]],
    [first[1][0], first[3][0], first[4][1]],
    [first[0][1], first[2][1], first[5][0]],
    [first[1][1], first[3][1], first[4][0]],
  ]);
  while (t.phase === 'groups') t = recordUserResult(t, userMatch(t).rest ? {} : { won: true, score: [5, 4] });
  assert.equal(t.rounds[0].length, 2, 'the second-round winners meet in the semi-finals');
  // 1974: two second-round groups of four, whose winners play the final.
  const wc74 = play('wc', '1974', 'NED');
  assert.equal(wc74.t.rounds[0].length, 1);
  assert.ok(wc74.seen.some((s) => s.startsWith('Second round')));
  // Out in the first round: the rest of the tournament still finishes.
  const early = play('copa', '1989', 'VEN', false);
  assert.equal(early.t.status, 'out');
  assert.equal(exitRound(early.t), 'Group stage');
  assert.ok(championOf(early.t));
  assert.equal(early.t.stage, 2);
  for (const [comp, ed, user] of [['afcon', '1976', 'MAR'], ['gold', '1985', 'CAN'], ['copaf', '2018', 'BRA'], ['gold', '1963', 'CRC']]) {
    assert.equal(play(comp, ed, user).t.status, 'champion', `${comp} ${ed}`);
  }
  const finalRound = play('wc', '1950', 'BRA', false);
  assert.equal(exitRound(finalRound.t), 'Group stage');
});

test('seeded teams skip the groups and meet the group qualifiers', () => {
  const us = createTournament({ compId: 'cnl', editionId: '2023–24', userId: 'USA', seed: 21 });
  assert.equal(us.phase, 'knockout', 'a seeded user starts in the quarter-finals');
  assert.deepEqual(us.byes, ['USA', 'MEX', 'CAN', 'PAN']);
  assert.equal(us.rounds[0].length, 4);
  const seeds = new Set(us.byes);
  for (const m of us.rounds[0]) assert.ok(seeds.has(m.a) && !seeds.has(m.b), 'every seed faces a group qualifier');
  // The top two seeds can only meet in the final.
  const half = (id) => us.rounds[0].findIndex((m) => m.a === id || m.b === id) < 2;
  assert.notEqual(half('USA'), half('MEX'));
  assert.equal(userGroupIndex(us), -1);
  assert.ok(us.groups.every((g) => g.days.every((d) => d.every((m) => m.w))), 'the groups were played out');

  let jam = createTournament({ compId: 'cnl', editionId: '2023–24', userId: 'JAM', seed: 21 });
  assert.equal(jam.phase, 'groups');
  assert.ok(!jam.groups.flatMap((g) => g.teams).some((id) => seeds.has(id)));
  assert.ok(knockoutPreview(jam).first.every(([a, b]) => a !== 'Group qualifier' && b === 'Group qualifier'));
  while (jam.phase === 'groups') jam = recordUserResult(jam, { won: true, score: [4, 3] });
  assert.ok(jam.rounds[0].some((m) => m.b === 'JAM'), 'a group winner meets a seed');

  // Copa América 1975: three group winners join the holders in the semi-finals.
  const uru = createTournament({ compId: 'copa', editionId: '1975', userId: 'URU', seed: 5 });
  assert.equal(uru.phase, 'knockout');
  assert.equal(uru.rounds[0].length, 2);
  assert.ok(uru.rounds[0].some((m) => m.a === 'URU' || m.b === 'URU'));
  let bol = createTournament({ compId: 'copa', editionId: '1975', userId: 'BOL', seed: 5 });
  while (bol.phase === 'groups') bol = recordUserResult(bol, userMatch(bol).rest ? {} : { won: true, score: [4, 3] });
  assert.ok(bol.rounds[0].flatMap((m) => [m.a, m.b]).includes('URU'), 'the holders wait in the semi-finals');
  assert.deepEqual(bracketOrder(8), [0, 7, 3, 4, 1, 6, 2, 5]);
});

test('fixed first-round pairings and fields smaller than the format', () => {
  const w = createTournament({ compId: 'wchamp', editionId: '2026', userId: 'USA', seed: 1 });
  assert.deepEqual(w.rounds[0].map((m) => [m.a, m.b]), [['USA', 'SLV'], ['JAM', 'CRC'], ['CAN', 'PAN'], ['MEX', 'HAI']]);
  const gua = createTournament({ compId: 'wchamp', editionId: '2026', userId: 'GUA', seed: 1 });
  assert.equal(gua.replaced, 'HAI');
  assert.deepEqual(gua.rounds[0][3], { ...gua.rounds[0][3], a: 'MEX', b: 'GUA' });

  // SAFF 2018 had seven teams: groups of four and three.
  const saff = createTournament({ compId: 'saff', editionId: '2018', userId: 'BHU', seed: 2 });
  assert.deepEqual(saff.groups.map((g) => g.teams.length).sort(), [3, 4]);

  // The first 48-team World Cup: real groups, then the round of 32.
  let wc = createTournament({ compId: 'wc', editionId: '2026', userId: 'SCO', seed: 6 });
  assert.equal(wc.groups.length, 12);
  assert.deepEqual(wc.groups[2].teams, ['BRA', 'MAR', 'SCO', 'HAI']);
  assert.equal(knockoutPreview(wc).size, 32);
  while (wc.phase === 'groups') wc = recordUserResult(wc, { won: true, score: [5, 4] });
  assert.equal(wc.rounds[0].length, 16);
  assert.equal(roundName(wc.rounds[0].length), 'Round of 32');
});

const UP = { B: 'A', C: 'B', D: 'C' };
const DOWN = { A: 'B', B: 'C', C: 'D' };
const LANDS = {
  promoted: (l) => [UP[l]],
  stay: (l) => [l],
  reprieved: (l) => [l],
  relegated: (l) => [DOWN[l]],
  'playoff-up': (l) => [l, UP[l]],
  'playoff-down': (l) => [l, DOWN[l]],
  playout: (l) => [l, DOWN[l]],
};

test('Nations League: every nation plays its real league and group in every edition', () => {
  const comp = getCompetition('unl');
  for (const ed of comp.editions) {
    const all = [...ed.groups.flat(), ...Object.values(ed.leagues).flat(2)];
    assert.equal(new Set(all).size, all.length, `${ed.label}: nobody is in two leagues`);
    assert.deepEqual([...all].sort(), [...eligibleIds(comp, ed)].sort(), `${ed.label}: the leagues hold exactly the entrants`);
    for (const id of all) {
      const t = createTournament({ compId: 'unl', editionId: ed.id, userId: id, seed: 3 });
      const spot = leagueSpot(ed, id);
      assert.equal(t.format.type, spot.league === 'A' ? 'groups' : 'promotion', `${ed.label} ${id}`);
      assert.deepEqual(t.groups[userGroupIndex(t)].teams, spot.teams, `${ed.label}: ${id} plays its real group`);
      assert.equal(t.replaced, null);
    }
    for (const [league, groups] of Object.entries(ed.leagues)) {
      const size = Math.max(...groups.map((g) => g.length));
      for (let place = 1; place <= size; place++) assert.ok(ed.fates[league][place], `${ed.label} League ${league} place ${place} has a fate`);
      assert.ok(ed.rules[league], `${ed.label} League ${league} has a rule sentence`);
    }
  }
  const ed = comp.editions.find((e) => e.year === 2027);
  assert.deepEqual(leagueSpot(ed, 'SCO').teams, ['SCO', 'SUI', 'SVN', 'MKD']);
  assert.equal(leagueSpot(ed, 'MLT').name, 'D1');

  const dream = createTournament({ compId: 'unl', editionId: ed.id, userId: 'SCO', dream: true, seed: 3 });
  assert.equal(dream.format.type, 'groups', 'dream mode puts a League B side into League A');
  assert.equal(dream.replaced, 'WAL');

  const run = (id, win) => {
    let t = createTournament({ compId: 'unl', editionId: ed.id, userId: id, seed: 4 });
    while (t.status === 'playing') t = recordUserResult(t, userMatch(t).rest ? {} : { won: win, score: win ? [4, 2] : [2, 4] });
    return t;
  };
  const up = run('SCO', true);
  assert.equal(up.status, 'promoted');
  assert.equal(leagueFate(up), 'promoted');
  assert.equal(leagueFate(run('SCO', false)), 'playoff-down', 'League B bottom side plays off to stay up');
  assert.equal(leagueFate(run('SMR', false)), 'stay', 'nobody goes down from League C this season');
  const malta = run('MLT', false);
  assert.equal(malta.status, 'out');
  assert.equal(leagueFate(malta), 'promoted', 'all of League D moves up');
  assert.ok(['playoff-down', 'relegated'].includes(leagueFate(run('WAL', false))), 'League A bottom side');
});

test('Nations League fates match the league each team played the following season', () => {
  const eds = getCompetition('unl').editions;
  let checked = 0;
  for (let i = 0; i + 1 < eds.length; i++) {
    const [ed, next] = [eds[i], eds[i + 1]];
    for (const [league, groups] of [['A', ed.groups], ...Object.entries(ed.leagues)]) {
      groups.forEach((group) =>
        group.forEach((id, k) => {
          const now = leagueSpot(next, id)?.league;
          if (!now) return; // suspended the following season
          const rule = ed.fates[league]?.[k + 1];
          const options = rule ? [rule].flat().flatMap((f) => LANDS[f](league)) : ['A'];
          assert.ok(options.includes(now), `${ed.label}: ${id} was ${k + 1} in League ${league} (${rule ?? 'knockouts'}) but played League ${now} next`);
          checked += 1;
        }),
      );
    }
  }
  assert.ok(checked > 200);
});

test('dream entries take the place of a bottom side, not a knockout team', () => {
  const t = createTournament({ compId: 'unl', editionId: '2024–25', userId: 'ENG', dream: true, seed: 1 });
  assert.equal(t.format.type, 'groups');
  assert.equal(t.replaced, 'SUI', 'the last side in the last group, not a quarter-finalist');
  const real = createTournament({ compId: 'unl', editionId: '2024–25', userId: 'ENG', seed: 1 });
  assert.deepEqual(real.groups[userGroupIndex(real)].teams, ['ENG', 'GRE', 'IRL', 'FIN'], 'without dream mode England play League B');
});
