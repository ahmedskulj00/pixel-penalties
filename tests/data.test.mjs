import test from 'node:test';
import assert from 'node:assert/strict';
import { NATIONS, NATION_BY_ID, GROUP_LABELS, nameIn, uefaEligible, existsIn, memberOf, fifaMember, sectionIn } from '../src/data/nations.js';
import {
  COMPETITIONS,
  GROUPS,
  TOTAL_EDITIONS,
  eligibleIds,
  championIds,
  getCompetition,
  getEdition,
  formatOf,
  knockoutSize,
  formatLabel,
  qualifyRule,
} from '../src/data/competitions.js';
import { FLAG_SPECS, getFlagArt, FLAG_W, FLAG_H } from '../src/pixel/flags.js';

const STATUSES = new Set(['played', 'upcoming', 'cancelled', 'unfinished', 'nowinner', 'void', 'disputed', 'shared']);
const n = (id) => NATION_BY_ID.get(id);

test('236 national teams with unique ids, valid sections and kits', () => {
  assert.equal(NATIONS.length, 236);
  assert.equal(NATION_BY_ID.size, 236);
  for (const x of NATIONS) {
    assert.ok(GROUP_LABELS[x.group], `${x.id} has a known section`);
    for (const key of ['shirt', 'shorts', 'socks', 'trim']) assert.match(x.kit[key], /^#[0-9a-f]{6}$/i, `${x.id} ${key} colour`);
    assert.ok(x.rating >= 1 && x.rating <= 5, `${x.id} rating in range`);
    assert.ok(x.years.length > 0, `${x.id} has years`);
    for (const [conf, from, to] of x.confs) {
      assert.ok(['UEFA', 'CONMEBOL', 'CONCACAF', 'AFC', 'CAF', 'OFC'].includes(conf), `${x.id} confederation ${conf}`);
      assert.ok(to == null || to >= from, `${x.id} membership range`);
    }
  }
  const count = (conf) => NATIONS.filter((x) => memberOf(x, conf, 2026)).length;
  // FIFA has 211 members; Russia is suspended.
  assert.equal(NATIONS.filter((x) => fifaMember(x, 2026)).length, 210);
  assert.deepEqual(
    { UEFA: count('UEFA'), CONMEBOL: count('CONMEBOL'), CONCACAF: count('CONCACAF'), AFC: count('AFC'), CAF: count('CAF'), OFC: count('OFC') },
    { UEFA: 54, CONMEBOL: 10, CONCACAF: 41, AFC: 47, CAF: 54, OFC: 11 },
  );
});

test('every nation has a hand-drawn pixel flag', () => {
  for (const x of NATIONS) {
    assert.ok(FLAG_SPECS[x.id], `flag spec for ${x.id}`);
    const art = getFlagArt(x.id);
    assert.equal(art.w, FLAG_W);
    assert.equal(art.h, FLAG_H);
    assert.ok(!art.paths.some(([c]) => c === '#888888'), `${x.id} flag has no unpainted pixels`);
  }
  assert.equal(Object.keys(FLAG_SPECS).length, NATIONS.length, 'no orphan flags');
});

test('era names follow history', () => {
  assert.equal(nameIn(n('IRL'), 1930), 'Irish Free State');
  assert.equal(nameIn(n('IRL'), 1960), 'Republic of Ireland');
  assert.equal(nameIn(n('TUR'), 2016), 'Turkey');
  assert.equal(nameIn(n('TUR'), 2024), 'Türkiye');
  assert.equal(nameIn(n('MKD'), 2000), 'FYR Macedonia');
  assert.equal(nameIn(n('SCG'), 2004), 'Serbia & Montenegro');
  assert.equal(nameIn(n('COD'), 1974), 'Zaire');
  assert.equal(nameIn(n('COD'), 2023), 'DR Congo');
  assert.equal(nameIn(n('MYA'), 1968), 'Burma');
  assert.equal(nameIn(n('SRI'), 1960), 'Ceylon');
  assert.equal(nameIn(n('BEN'), 1970), 'Dahomey');
  assert.equal(nameIn(n('BFA'), 1978), 'Upper Volta');
  assert.equal(nameIn(n('CUW'), 1969), 'Netherlands Antilles');
  assert.equal(nameIn(n('CUW'), 2026), 'Curaçao');
  assert.equal(nameIn(n('MAS'), 1960), 'Malaya');
  assert.equal(nameIn(n('EGY'), 1959), 'United Arab Republic');
  assert.equal(nameIn(n('SWZ'), 2016), 'Swaziland');
  assert.equal(uefaEligible(n('RUS'), 2024), false, 'Russia suspended since 2022');
  assert.equal(uefaEligible(n('RUS'), 2008), true);
  assert.equal(existsIn(n('URS'), 1988), true);
  assert.equal(existsIn(n('URS'), 1996), false);
});

test('confederation membership changes over time', () => {
  assert.ok(memberOf(n('AUS'), 'OFC', 2004) && !memberOf(n('AUS'), 'AFC', 2004));
  assert.ok(memberOf(n('AUS'), 'AFC', 2007) && !memberOf(n('AUS'), 'OFC', 2007));
  assert.ok(memberOf(n('ISR'), 'AFC', 1964) && memberOf(n('ISR'), 'UEFA', 2024));
  assert.ok(memberOf(n('KAZ'), 'AFC', 1996) && memberOf(n('KAZ'), 'UEFA', 2004));
  assert.ok(memberOf(n('RSA'), 'CAF', 1957) && !memberOf(n('RSA'), 'CAF', 1980) && memberOf(n('RSA'), 'CAF', 1996));
  assert.ok(memberOf(n('TPE'), 'OFC', 1986) && memberOf(n('TPE'), 'AFC', 2026));
  assert.equal(fifaMember(n('GLP'), 2026), false, 'Guadeloupe plays in CONCACAF but is not a FIFA member');
  assert.ok(memberOf(n('GLP'), 'CONCACAF', 2023));
  assert.equal(sectionIn(n('AUS'), 1974), 'ofc', 'pickers file Australia under Oceania in 1974');
  assert.equal(sectionIn(n('URS'), 1988), 'uefa');
});

test('31 current competitions, every edition consistent with its format', () => {
  assert.equal(COMPETITIONS.length, 31);
  const groupIds = new Set(GROUPS.map((g) => g.id));
  let total = 0;
  for (const c of COMPETITIONS) {
    assert.ok(groupIds.has(c.group), `${c.id} region`);
    assert.ok(['gold', 'silver', 'bronze'].includes(c.trophy), `${c.id} trophy`);
    const ids = new Set();
    let lastYear = -Infinity;
    for (const e of c.editions) {
      const tag = `${c.id} ${e.id}`;
      total += 1;
      assert.ok(!ids.has(e.id), `${tag} unique`);
      ids.add(e.id);
      assert.ok(STATUSES.has(e.status), `${tag} status ${e.status}`);
      assert.ok(e.year >= lastYear, `${c.id} editions in chronological order at ${e.id}`);
      lastYear = e.year;
      const refs = [...e.hosts, ...(e.field ?? []), ...championIds(e), ...(e.groups?.flat() ?? []), ...(e.byes ?? []), ...(e.pairs?.flat() ?? [])];
      for (const id of refs) assert.ok(NATION_BY_ID.has(id), `${tag} references ${id}`);
      if (e.field) assert.equal(new Set(e.field).size, e.field.length, `${tag} nobody twice in the line-up`);
      if (e.status === 'upcoming') {
        assert.ok(e.year >= 2026, `${tag} upcoming is in the future`);
        assert.equal(championIds(e).length, 0);
      }
      if (e.status === 'played') {
        assert.ok(e.field?.length >= 2, `${tag} has a line-up`);
        assert.equal(championIds(e)[0], e.field[0], `${tag} champion leads the field`);
      }

      const f = formatOf(c, e);
      assert.ok(formatLabel(f).length > 0, `${tag} has a format label`);
      if (f.type === 'groups') {
        assert.ok(qualifyRule(f).length > 0, `${tag} explains who goes through`);
        const ko = knockoutSize(f);
        if (!f.second) assert.ok([2, 4, 8, 16, 32].includes(ko), `${tag} knockout size ${ko}`);
        assert.equal(e.byes?.length ?? 0, f.byes ?? 0, `${tag} seeded byes match the format`);
        if (f.second) {
          for (const label of f.second.lists.flat()) {
            assert.ok('ABCDEFGHIJKL'.indexOf(label[1]) < f.groups && Number(label[0]) <= f.advance, `${tag} second-stage slot ${label}`);
          }
        }
      }
      if (e.groups) {
        assert.equal(f.type, 'groups', `${tag} real groups need a group format`);
        assert.equal(e.groups.length, f.groups, `${tag} group count`);
        assert.equal(Math.max(...e.groups.map((g) => g.length)), f.size, `${tag} group size`);
      }
      const need = f.type === 'knockout' ? 2 : 3;
      assert.ok(eligibleIds(c, e).length >= need, `${tag} has enough eligible nations`);
    }
  }
  assert.equal(total, TOTAL_EDITIONS);
  assert.ok(TOTAL_EDITIONS > 450, `expected ~460 editions, got ${TOTAL_EDITIONS}`);
});

test('youth and discontinued competitions are gone; everything left is still played', () => {
  const ids = new Set(COMPETITIONS.map((c) => c.id));
  for (const gone of ['u21', 'u19', 'u17', 'wu19', 'wu17', 'amateur', 'bhc', 'cei', 'nordic', 'balkan', 'celtic']) {
    assert.ok(!ids.has(gone), `${gone} removed`);
  }
  for (const c of COMPETITIONS) {
    const last = Math.max(...c.editions.map((e) => e.year));
    assert.ok(last >= 2022, `${c.id} is a live competition (latest edition ${last})`);
  }
  // The long history of live competitions stays, e.g. EURO 2008 and the 1930 World Cup.
  assert.equal(getEdition(getCompetition('euro'), '2008').champion, 'ESP');
  assert.equal(getEdition(getCompetition('wc'), '1930').champion, 'URU');
});

test('confirmed future tournaments are present', () => {
  const hosts = (comp, id) => getEdition(getCompetition(comp), id).hosts;
  assert.deepEqual(hosts('euro', '2028'), ['ENG', 'SCO', 'WAL', 'IRL']);
  assert.deepEqual(hosts('euro', '2032'), ['ITA', 'TUR']);
  assert.deepEqual(hosts('weuro', '2029'), ['GER']);
  assert.deepEqual(hosts('wc', '2030'), ['MAR', 'POR', 'ESP']);
  assert.deepEqual(hosts('wc', '2034'), ['KSA']);
  assert.deepEqual(hosts('wwc', '2027'), ['BRA']);
  assert.deepEqual(hosts('wwc', '2031'), ['USA', 'MEX', 'CRC', 'JAM']);
  assert.deepEqual(hosts('wwc', '2035'), ['ENG', 'SCO', 'WAL', 'NIR']);
  assert.deepEqual(hosts('afcon', '2027'), ['KEN', 'TAN', 'UGA']);
  assert.deepEqual(hosts('asiancup', '2027'), ['KSA']);
  assert.deepEqual(hosts('wolympics', '2028'), ['USA']);
  assert.equal(getEdition(getCompetition('gold'), '2027').status, 'upcoming');
  assert.equal(getEdition(getCompetition('wc'), '2026').champion, 'ESP');
  assert.equal(getEdition(getCompetition('wc'), '2026').groups.length, 12);
});

function tally(compId) {
  const out = {};
  for (const e of getCompetition(compId).editions) for (const id of championIds(e)) out[id] = (out[id] ?? 0) + 1;
  return out;
}

test('title counts match the record books', () => {
  const wc = tally('wc');
  assert.deepEqual(
    { BRA: wc.BRA, ITA: wc.ITA, GER: (wc.FRG ?? 0) + (wc.GER ?? 0), ARG: wc.ARG, FRA: wc.FRA, URU: wc.URU, ESP: wc.ESP, ENG: wc.ENG },
    { BRA: 5, ITA: 4, GER: 4, ARG: 3, FRA: 2, URU: 2, ESP: 2, ENG: 1 },
  );
  const copa = tally('copa');
  assert.deepEqual(
    { ARG: copa.ARG, URU: copa.URU, BRA: copa.BRA, PAR: copa.PAR, PER: copa.PER, CHI: copa.CHI, COL: copa.COL, BOL: copa.BOL },
    { ARG: 16, URU: 15, BRA: 9, PAR: 2, PER: 2, CHI: 2, COL: 1, BOL: 1 },
  );
  const afcon = tally('afcon');
  assert.deepEqual(
    { EGY: afcon.EGY, CMR: afcon.CMR, GHA: afcon.GHA, NGA: afcon.NGA, CIV: afcon.CIV, MAR: afcon.MAR, COD: afcon.COD, ALG: afcon.ALG },
    { EGY: 7, CMR: 5, GHA: 4, NGA: 3, CIV: 3, MAR: 2, COD: 2, ALG: 2 },
  );
  const asia = tally('asiancup');
  assert.deepEqual({ JPN: asia.JPN, KSA: asia.KSA, IRN: asia.IRN, KOR: asia.KOR, QAT: asia.QAT }, { JPN: 4, KSA: 3, IRN: 3, KOR: 2, QAT: 2 });
  const gold = tally('gold');
  assert.deepEqual({ MEX: gold.MEX, USA: gold.USA, CRC: gold.CRC, CAN: gold.CAN }, { MEX: 13, USA: 7, CRC: 3, CAN: 2 });
  assert.equal(tally('wwc').USA, 4);
  assert.equal(tally('gulf').KUW, 10);
});

test('eligibility follows each region and era', () => {
  const ids = (comp, edition) => new Set(eligibleIds(getCompetition(comp), getEdition(getCompetition(comp), edition)));
  const wc = ids('wc', '2030');
  assert.equal(wc.size, 210, 'every FIFA member bar suspended Russia');
  assert.ok(!wc.has('RUS') && !wc.has('GLP'));
  assert.ok(!ids('asiancup', '1976').has('AUS') && ids('asiancup', '2027').has('AUS'), 'Australia joined the AFC in 2006');
  assert.ok(ids('saff', '2011').has('AFG') && !ids('saff', '2023').has('AFG'), 'Afghanistan left SAFF for CAFA');
  assert.ok(ids('gulf', '2026').has('YEM') && !ids('gulf', '2026').has('JOR'));
  assert.deepEqual([...ids('finalissima', '2022')].sort(), ['ARG', 'ITA']);
  const copa = ids('copa', '2024');
  assert.ok(copa.has('USA') && copa.has('CAN'), 'guests in the real line-up are eligible');
});
