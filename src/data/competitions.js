import { NATIONS, existsIn, memberOf, fifaMember } from './nations.js';
import { EURO, NATIONS_LEAGUE, WOMENS_EURO, WOMENS_NATIONS_LEAGUE, BALTIC } from './editions/uefa.js';
import { WORLD_CUP, WOMENS_WORLD_CUP, WOMENS_OLYMPICS, ARAB_CUP, FINALISSIMA, WOMENS_FINALISSIMA } from './editions/fifa.js';
import { COPA_AMERICA, COPA_FEMENINA } from './editions/conmebol.js';
import { GOLD_CUP, CONCACAF_NATIONS_LEAGUE, W_CHAMPIONSHIP, W_GOLD_CUP } from './editions/concacaf.js';
import { ASIAN_CUP, WOMENS_ASIAN_CUP, ASEAN, FIFA_ASEAN_CUP, EAFF_E1, SAFF, GULF_CUP, CAFA } from './editions/afc.js';
import { AFCON, WAFCON, CHAN, COSAFA } from './editions/caf.js';
import { OFC_NATIONS_CUP, OFC_WOMENS } from './editions/ofc.js';

/**
 * Every senior international competition still being played, worldwide, with every
 * edition played or confirmed (checked September 2026). Youth tournaments and
 * competitions that have been discontinued are left out.
 */

// ─── Formats ────────────────────────────────────────────────────────────────
// How each final tournament was played. A group stage is a set of mini-leagues of
// shootouts: `advance` teams per group go through, plus the `extra` best teams in the
// next place (the best third-placed teams at EURO 2016–2032, for example). `byes` teams
// skip the groups, and `second` describes a second group stage (World Cup 1950–82).

const KO = (size) => ({ type: 'knockout', size });
const LEAGUE = { type: 'league' };
const groupStage = (groups, size, advance, extra = 0, names = null, more = {}) => ({
  type: 'groups',
  groups,
  size,
  advance,
  extra,
  ...(names ? { names } : {}),
  ...more,
});
const LEAGUE_A = ['A1', 'A2', 'A3', 'A4'];
const NUMBERED = ['1', '2'];
const NUM4 = ['1', '2', '3', '4'];
const NUM6 = ['1', '2', '3', '4', '5', '6'];

/**
 * A second group stage. `lists` name the teams by first-stage finish: '1A' is the winner
 * of the first group, '2C' the runner-up of the third. With `league` the stage is a
 * single table that decides the title; otherwise its winners play the `pairs` knockouts.
 */
const second = (lists, extra = {}) => ({ lists, advance: 1, ...extra });
const finalRound = (labels) => second([labels], { names: ['Final round'], league: true });
const HOLDERS = { byes: 1, byeLabel: 'the holders' };
const TOP_SEEDS = { byes: 4, byeLabel: 'the four top seeds' };

const FORMAT_BY_ERA = {
  wc: (y) =>
    y === 1930 ? groupStage(4, 4, 1, 0, NUM4)
    : y <= 1938 ? KO(16)
    : y === 1950 ? groupStage(4, 4, 1, 0, NUM4, { second: finalRound(['1A', '1B', '1C', '1D']) })
    : y <= 1970 ? groupStage(4, 4, 2, 0, NUM4)
    : y === 1974 ? groupStage(4, 4, 2, 0, NUM4, {
        second: second([['1C', '2B', '1A', '2D'], ['1B', '2A', '1D', '2C']], { names: ['A', 'B'], pairs: [['1A', '1B']] }),
      })
    : y === 1978 ? groupStage(4, 4, 2, 0, NUM4, {
        second: second([['1A', '2B', '1C', '2D'], ['2A', '1B', '2C', '1D']], { names: ['A', 'B'], pairs: [['1A', '1B']] }),
      })
    : y === 1982 ? groupStage(6, 4, 2, 0, NUM6, {
        second: second([['1A', '1C', '2F'], ['1B', '1D', '2E'], ['2A', '2C', '1F'], ['2B', '2D', '1E']], {
          names: ['A', 'B', 'C', 'D'],
          pairs: [['1A', '1C'], ['1B', '1D']],
        }),
      })
    : y <= 1994 ? groupStage(6, 4, 2, 4)
    : y <= 2022 ? groupStage(8, 4, 2)
    : groupStage(12, 4, 2, 8),
  wwc: (y) =>
    y <= 1995 ? groupStage(3, 4, 2, 2)
    : y <= 2011 ? groupStage(4, 4, 2)
    : y <= 2019 ? groupStage(6, 4, 2, 4)
    : y <= 2027 ? groupStage(8, 4, 2)
    : groupStage(12, 4, 2, 8),
  wolympics: (y) => (y <= 2000 ? groupStage(2, 4, 2) : y <= 2024 ? groupStage(3, 4, 2, 2) : groupStage(4, 4, 2)),
  finalissima: () => KO(2),
  wfinalissima: () => KO(2),
  arabcup: (y) =>
    y <= 1964 ? LEAGUE
    : y === 1985 || y === 1992 ? groupStage(2, 3, 2)
    : y === 1998 ? groupStage(4, 3, 1)
    : y === 2012 ? groupStage(3, 4, 1, 1)
    : y <= 2002 ? groupStage(2, 5, 2)
    : groupStage(4, 4, 2),

  euro: (y) =>
    y <= 1976 ? KO(4)
    : y === 1980 ? groupStage(2, 4, 1, 0, NUMBERED)
    : y <= 1992 ? groupStage(2, 4, 2, 0, NUMBERED)
    : y <= 2012 ? groupStage(4, 4, 2)
    : groupStage(6, 4, 2, 4),
  unl: (y) => (y === 2019 ? groupStage(4, 3, 1, 0, LEAGUE_A) : y <= 2023 ? groupStage(4, 4, 1, 0, LEAGUE_A) : groupStage(4, 4, 2, 0, LEAGUE_A)),
  weuro: (y) => (y <= 1995 ? KO(4) : y <= 2005 ? groupStage(2, 4, 2) : y <= 2013 ? groupStage(3, 4, 2, 2) : groupStage(4, 4, 2)),
  wnl: () => groupStage(4, 4, 1, 0, LEAGUE_A),
  // The four-team Baltic Cups since 2012 used semi-finals; the rest were round-robins.
  baltic: (y, e) => ((e.field?.length ?? 3) === 4 ? KO(4) : LEAGUE),

  copa: (y) =>
    y <= 1967 ? LEAGUE
    : y <= 1987 ? groupStage(3, 3, 1, 0, null, HOLDERS)
    : y <= 1991 ? groupStage(2, 5, 2, 0, null, { second: finalRound(['1A', '2A', '1B', '2B']) })
    : y === 2016 || y === 2024 ? groupStage(4, 4, 2)
    : y === 2021 ? groupStage(2, 5, 4)
    : groupStage(3, 4, 2, 2),
  copaf: (y) =>
    y <= 1995 ? LEAGUE
    : y === 1998 || y >= 2022 ? groupStage(2, 5, 2)
    : groupStage(2, 5, 2, 0, null, { second: finalRound(['1A', '2A', '1B', '2B']) }),

  gold: (y) =>
    y === 1963 ? groupStage(2, 5, 2, 0, null, { second: finalRound(['1A', '2A', '1B', '2B']) })
    : y <= 1981 ? LEAGUE
    : y === 1985 ? groupStage(3, 3, 1, 0, null, { second: finalRound(['1A', '1B', '1C']) })
    : y === 1989 ? LEAGUE
    : y <= 1993 ? groupStage(2, 4, 2)
    : y === 1996 ? groupStage(3, 3, 1, 1)
    : y === 1998 ? groupStage(3, 4, 1, 1)
    : y <= 2003 ? groupStage(4, 3, 2)
    : y <= 2017 ? groupStage(3, 4, 2, 2)
    : groupStage(4, 4, 2),
  cnl: (y) => (y <= 2023 ? groupStage(4, 3, 1) : y <= 2025 ? groupStage(2, 4, 2, 0, null, TOP_SEEDS) : groupStage(2, 6, 2, 0, null, TOP_SEEDS)),
  wchamp: (y) => (y === 1993 || y === 1994 ? LEAGUE : y === 2006 || y >= 2026 ? KO(8) : groupStage(2, 4, 2)),
  wgold: () => groupStage(3, 4, 2, 2),

  asiancup: (y) =>
    y <= 1968 ? LEAGUE
    : y <= 1976 ? groupStage(2, 3, 2)
    : y <= 1988 ? groupStage(2, 5, 2)
    : y === 1992 ? groupStage(2, 4, 2)
    : y <= 2000 ? groupStage(3, 4, 2, 2)
    : y <= 2015 ? groupStage(4, 4, 2)
    : groupStage(6, 4, 2, 4),
  wasiancup: (y) =>
    y <= 1983 ? groupStage(2, 3, 2)
    : y <= 1999 ? groupStage(2, 4, 2)
    : y <= 2003 ? groupStage(4, 4, 1)
    : y <= 2018 ? groupStage(2, 4, 2)
    : groupStage(3, 4, 2, 2),
  asean: (y) => (y === 1998 || (y >= 2007 && y <= 2016) ? groupStage(2, 4, 2) : groupStage(2, 5, 2)),
  fifaasean: () => groupStage(2, 4, 1),
  e1: () => LEAGUE,
  saff: (y) => (y === 1993 || y === 2021 ? LEAGUE : y <= 1999 || y === 2026 ? groupStage(2, 3, 2) : groupStage(2, 4, 2)),
  gulf: (y) => (y === 1974 ? groupStage(2, 3, 2) : y <= 2003 ? LEAGUE : groupStage(2, 4, 2)),
  cafa: (y) => (y === 2023 ? groupStage(2, 3, 1) : groupStage(2, 4, 1)),

  afcon: (y) =>
    y === 1957 || y === 1962 ? KO(4)
    : y === 1959 ? LEAGUE
    : y <= 1965 ? groupStage(2, 3, 1)
    : y === 1976 ? groupStage(2, 4, 2, 0, null, { second: finalRound(['1A', '2A', '1B', '2B']) })
    : y <= 1990 ? groupStage(2, 4, 2)
    : y <= 1994 ? groupStage(4, 3, 2)
    : y <= 2017 ? groupStage(4, 4, 2)
    : groupStage(6, 4, 2, 4),
  wafcon: (y) => (y <= 1995 ? KO(4) : y <= 2018 ? groupStage(2, 4, 2) : y <= 2024 ? groupStage(3, 4, 2, 2) : groupStage(4, 4, 2)),
  chan: (y) => (y === 2009 ? groupStage(2, 4, 2) : groupStage(4, 4, 2)),
  cosafa: (y) => (y === 1997 ? LEAGUE : y <= 2019 ? KO(8) : y <= 2024 ? groupStage(3, 4, 1, 1) : groupStage(4, 4, 1)),

  ofc: (y) =>
    y === 1973 ? groupStage(1, 5, 2)
    : y === 1980 ? groupStage(2, 4, 1)
    : y === 1996 ? KO(4)
    : y <= 2000 ? groupStage(2, 3, 2)
    : y === 2004 ? groupStage(1, 6, 2)
    : y === 2008 ? LEAGUE
    : groupStage(2, 4, 2),
  ofcw: (y) =>
    y === 1998 ? groupStage(2, 3, 2)
    : y === 2022 ? groupStage(3, 3, 2, 2)
    : y === 2010 || y === 2018 || y >= 2025 ? groupStage(2, 4, 2)
    : LEAGUE,
};

// ─── Who can enter ──────────────────────────────────────────────────────────

const ARAB = 'ALG BHR COM DJI EGY IRQ JOR KUW LBN LBY MTN MAR OMA PLE QAT KSA SOM SDN SYR TUN UAE YEM';
const GULF = 'BHR IRQ KUW OMA QAT KSA UAE YEM';
const AFF = 'BRU CAM IDN LAO MAS MYA PHI SGP THA VIE TLS';
const EAFF = 'JPN KOR CHN PRK TPE HKG MAC GUM MNG NMI';
const SAFF_MEMBERS = 'IND PAK BAN SRI NEP MDV BHU AFG:2005-2014';
const CAFA_MEMBERS = 'AFG IRN KGZ TJK TKM UZB';
const COSAFA_MEMBERS = 'ANG BOT COM SWZ LES MAD MWI MRI MOZ NAM SEY RSA ZAM ZIM';
const BALTIC_MEMBERS = 'EST LVA LTU';

/** 'IND AFG:2005-2014' → Map { IND → [-∞, ∞], AFG → [2005, 2014] } */
function memberSpans(spec) {
  return new Map(
    spec.split(' ').map((entry) => {
      const [id, range] = entry.split(':');
      const [from, to] = range ? range.split('-').map(Number) : [-Infinity, Infinity];
      return [id, [from, to]];
    }),
  );
}

// ─── Registry ───────────────────────────────────────────────────────────────

export const GROUPS = [
  { id: 'world', label: 'World' },
  { id: 'uefa', label: 'Europe' },
  { id: 'conmebol', label: 'South America' },
  { id: 'concacaf', label: 'North & Central America, Caribbean' },
  { id: 'afc', label: 'Asia' },
  { id: 'caf', label: 'Africa' },
  { id: 'ofc', label: 'Oceania' },
];

const comp = (id, group, trophy, name, short, eligibility, blurb, editions, extra = {}) => ({
  id,
  name,
  short,
  group,
  trophy,
  eligibility,
  blurb,
  editions,
  ...extra,
});
const WOMEN = { women: true };

export const COMPETITIONS = [
  comp('wc', 'world', 'gold', 'FIFA World Cup', 'World Cup', 'FIFA', 'The biggest prize in football, contested since 1930.', WORLD_CUP),
  comp('wwc', 'world', 'gold', 'FIFA Women’s World Cup', 'Women’s World Cup', 'FIFA', 'The women’s world championship, played since 1991.', WOMENS_WORLD_CUP, WOMEN),
  comp('wolympics', 'world', 'gold', 'Olympic Women’s Football Tournament', 'Women’s Olympics', 'FIFA', 'Full national teams competing for Olympic gold since 1996.', WOMENS_OLYMPICS, WOMEN),
  comp('finalissima', 'world', 'gold', 'Finalissima', 'Finalissima', 'field', 'The champions of Europe against the champions of South America.', FINALISSIMA),
  comp('wfinalissima', 'world', 'gold', 'Women’s Finalissima', 'Women’s Finalissima', 'field', 'The European and South American women’s champions, face to face.', WOMENS_FINALISSIMA, WOMEN),
  comp('arabcup', 'world', 'silver', 'FIFA Arab Cup', 'Arab Cup', { members: ARAB }, 'The Arab world’s championship, run by FIFA since 2021.', ARAB_CUP),

  comp('euro', 'uefa', 'silver', 'European Championship', 'EURO', 'UEFA', 'Europe’s biggest national-team tournament, first played in 1960.', EURO),
  comp('unl', 'uefa', 'silver', 'UEFA Nations League', 'Nations League', 'UEFA', 'League phase, then a final four, since 2018.', NATIONS_LEAGUE),
  comp('weuro', 'uefa', 'silver', 'Women’s European Championship', 'Women’s EURO', 'UEFA', 'Played since 1984. Germany host again in 2029.', WOMENS_EURO, WOMEN),
  comp('wnl', 'uefa', 'silver', 'UEFA Women’s Nations League', 'Women’s Nations League', 'UEFA', 'The newest UEFA trophy, first won in 2024.', WOMENS_NATIONS_LEAGUE, WOMEN),
  comp('baltic', 'uefa', 'bronze', 'Baltic Cup', 'Baltic Cup', { members: BALTIC_MEMBERS }, 'Estonia, Latvia and Lithuania, on and off since 1928.', BALTIC),

  comp('copa', 'conmebol', 'silver', 'Copa América', 'Copa América', 'CONMEBOL', 'The oldest continental championship in the world, first played in 1916.', COPA_AMERICA),
  comp('copaf', 'conmebol', 'silver', 'Copa América Femenina', 'Copa América Femenina', 'CONMEBOL', 'South America’s women’s championship, played since 1991.', COPA_FEMENINA, WOMEN),

  comp('gold', 'concacaf', 'silver', 'CONCACAF Gold Cup', 'Gold Cup', 'CONCACAF', 'The CONCACAF Championship from 1963, the Gold Cup since 1991.', GOLD_CUP),
  comp('cnl', 'concacaf', 'silver', 'CONCACAF Nations League', 'CONCACAF Nations League', 'CONCACAF', 'League A and the finals, played since 2019.', CONCACAF_NATIONS_LEAGUE),
  comp('wchamp', 'concacaf', 'silver', 'CONCACAF W Championship', 'W Championship', 'CONCACAF', 'CONCACAF’s women’s championship, played since 1991.', W_CHAMPIONSHIP, WOMEN),
  comp('wgold', 'concacaf', 'silver', 'CONCACAF W Gold Cup', 'W Gold Cup', 'CONCACAF', 'The women’s Gold Cup, first played in 2024.', W_GOLD_CUP, WOMEN),

  comp('asiancup', 'afc', 'silver', 'AFC Asian Cup', 'Asian Cup', 'AFC', 'Asia’s championship, first played in Hong Kong in 1956.', ASIAN_CUP),
  comp('wasiancup', 'afc', 'silver', 'AFC Women’s Asian Cup', 'Women’s Asian Cup', 'AFC', 'Asia’s women’s championship, played since 1975.', WOMENS_ASIAN_CUP, WOMEN),
  comp('asean', 'afc', 'bronze', 'ASEAN Championship', 'ASEAN Championship', { members: AFF }, 'Southeast Asia’s championship, born as the Tiger Cup in 1996.', ASEAN),
  comp('fifaasean', 'afc', 'bronze', 'FIFA ASEAN Cup', 'FIFA ASEAN Cup', { members: AFF }, 'FIFA’s new Southeast Asian tournament, first played in 2026.', FIFA_ASEAN_CUP),
  comp('e1', 'afc', 'bronze', 'EAFF E-1 Football Championship', 'E-1 Championship', { members: EAFF }, 'East Asia’s championship, played since 2003.', EAFF_E1),
  comp('saff', 'afc', 'bronze', 'SAFF Championship', 'SAFF Championship', { members: SAFF_MEMBERS }, 'South Asia’s championship, played since 1993.', SAFF),
  comp('gulf', 'afc', 'bronze', 'Arabian Gulf Cup', 'Gulf Cup', { members: GULF }, 'The Gulf’s fiercest rivalries, settled since 1970.', GULF_CUP),
  comp('cafa', 'afc', 'bronze', 'CAFA Nations Cup', 'CAFA Nations Cup', { members: CAFA_MEMBERS }, 'Central Asia’s championship, first played in 2023.', CAFA),

  comp('afcon', 'caf', 'silver', 'Africa Cup of Nations', 'AFCON', 'CAF', 'Africa’s championship, played since 1957.', AFCON),
  comp('wafcon', 'caf', 'silver', 'Women’s Africa Cup of Nations', 'WAFCON', 'CAF', 'Africa’s women’s championship, played since 1991.', WAFCON, WOMEN),
  comp('chan', 'caf', 'bronze', 'African Nations Championship', 'CHAN', 'CAF', 'Africa’s championship for players from their home leagues.', CHAN),
  comp('cosafa', 'caf', 'bronze', 'COSAFA Cup', 'COSAFA Cup', { members: COSAFA_MEMBERS }, 'Southern Africa’s regional cup, played since 1997.', COSAFA),

  comp('ofc', 'ofc', 'silver', 'OFC Nations Cup', 'OFC Nations Cup', 'OFC', 'Oceania’s championship, played since 1973.', OFC_NATIONS_CUP),
  comp('ofcw', 'ofc', 'silver', 'OFC Women’s Nations Cup', 'OFC Women’s Nations Cup', 'OFC', 'Oceania’s women’s championship, played since 1983.', OFC_WOMENS, WOMEN),
];

export const COMPETITION_BY_ID = new Map(COMPETITIONS.map((c) => [c.id, c]));

export function getCompetition(id) {
  const c = COMPETITION_BY_ID.get(id);
  if (!c) throw new Error(`Unknown competition "${id}"`);
  return c;
}

export function getEdition(comp, editionId) {
  const e = comp.editions.find((x) => x.id === editionId);
  if (!e) throw new Error(`Unknown edition "${editionId}" of ${comp.id}`);
  return e;
}

/** The format of one edition: group stage, single league table, or straight knockout. */
export function formatOf(comp, edition) {
  if (edition.format) return edition.format;
  return FORMAT_BY_ERA[comp.id]?.(edition.year, edition) ?? KO(edition.bracket ?? 4);
}

const KO_ENTRY = { 2: 'the final', 4: 'the semi-finals', 8: 'the quarter-finals', 16: 'the round of 16', 32: 'the round of 32' };
const KO_ONLY = { 2: 'Straight to the final', 4: 'Semi-finals and final', 8: 'Knockout from the quarter-finals', 16: 'Knockout from the round of 16' };
const WORD = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const PLACE = ['', 'first', 'second', 'third', 'fourth'];

/** Short description for edition cards, e.g. "6 groups of 4, then the round of 16". */
export function formatLabel(format) {
  if (format.type === 'league') return 'One league table';
  if (format.type === 'promotion') return `League ${format.league}: ${format.groups} groups of ${(format.sizes ?? [format.size]).join(' or ')}`;
  if (format.type === 'knockout') return KO_ONLY[format.size] ?? 'Knockout';
  const groups = `${format.groups} ${format.groups === 1 ? 'group' : 'groups'} of ${format.size}`;
  if (format.second) return `${groups}, then ${format.second.league ? 'a final round' : 'a second group stage'}`;
  const seeds = format.byes ? ` with ${format.byeLabel}` : '';
  return `${groups}, then ${KO_ENTRY[knockoutSize(format)] ?? 'knockouts'}${seeds}`;
}

/** Teams in the first knockout round: group qualifiers plus any byes. */
export function knockoutSize(format) {
  return format.groups * format.advance + format.extra + (format.byes ?? 0);
}

/** Who goes through, in one plain sentence. */
export function qualifyRule(format) {
  if (format.type === 'league') return 'Everyone plays everyone once. Top of the table takes the title.';
  if (format.type === 'promotion') return format.rule;
  if (format.type !== 'groups') return null;
  if (format.rule) return format.rule;
  const k = knockoutSize(format);
  const direct =
    format.groups === 1
      ? format.advance === 2 ? 'The top two' : `The top ${WORD[format.advance]}`
      : format.advance === 1 ? 'Group winners' : `The top ${WORD[format.advance]} in each group`;
  const nextPlace = format.advance + 1;
  const extra = !format.extra
    ? ''
    : nextPlace === 2
      ? `, plus the best runner-up,`
      : `, plus the ${format.extra === 1 ? 'best' : `${WORD[format.extra]} best`} ${PLACE[nextPlace]}-placed ${format.extra === 1 ? 'team' : 'teams'},`;
  if (format.second) {
    const s = format.second;
    if (s.league) return `${direct}${extra} go into a final round. Top of that table takes the title.`;
    const next = s.pairs.length === 1 ? 'meet in the final' : 'go through to the semi-finals';
    return `${direct}${extra} go into a second group stage, whose winners ${next}.`;
  }
  if (format.byes) return `${direct}${extra} join ${format.byeLabel} in ${KO_ENTRY[k]}.`;
  return `${direct}${extra} ${k === 2 ? 'meet in the final' : `go through to ${KO_ENTRY[k]}`}.`;
}

// ─── Leagues (Nations League editions split into A, B, C and D) ──────────────

const LEAGUE_UP = { B: 'A', C: 'B', D: 'C' };
const LEAGUE_DOWN = { A: 'B', B: 'C', C: 'D' };

/** Where a nation plays in an edition with leagues: { league, group, name, teams }, or null. */
export function leagueSpot(edition, nationId) {
  const all = [['A', edition.groups], ...Object.entries(edition.leagues ?? {})];
  for (const [league, groups] of all) {
    const group = groups ? groups.findIndex((g) => g.includes(nationId)) : -1;
    if (group >= 0) return { league, group, name: `${league}${group + 1}`, teams: groups[group] };
  }
  return null;
}

function leagueRuleText(league, fates, teams) {
  const values = Object.values(fates);
  if (values.length && values.every((f) => f === 'promoted')) {
    return `League ${league} is being wound up, so all ${WORD[teams] ?? teams} teams move up to League ${LEAGUE_UP[league]}. Winning the group is for the glory.`;
  }
  const parts = [];
  if (fates[1] === 'promoted') parts.push(`Group winners go up to League ${LEAGUE_UP[league]}`);
  if (fates[2] === 'playoff-up') parts.push('runners-up get a promotion play-off');
  const last = fates[Math.max(...Object.keys(fates).map(Number))];
  if (last === 'playoff-down') parts.push('the bottom team faces a play-off to stay up');
  else if (last === 'relegated') parts.push(`the bottom team drops to League ${LEAGUE_DOWN[league]}`);
  else parts.push('nobody goes down this season');
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}.`;
}

/** Format for a lower league: groups only, with promotion and relegation at stake. */
export function leagueFormat(edition, league) {
  const groups = edition.leagues[league];
  const fates = edition.fates?.[league] ?? { 1: 'promoted' };
  const sizes = [...new Set(groups.map((g) => g.length))].sort((a, b) => a - b);
  return {
    type: 'promotion',
    league,
    groups: groups.length,
    size: sizes[sizes.length - 1],
    sizes,
    names: groups.map((_, i) => `${league}${i + 1}`),
    fates,
    rule: edition.rules?.[league] ?? leagueRuleText(league, fates, groups.flat().length),
  };
}

/** One sentence on what a finish means, e.g. "Scotland go up to League A." */
export function fateText(fate, { league, name, edition }) {
  const up = LEAGUE_UP[league];
  const down = LEAGUE_DOWN[league];
  const when = (boundary) => (edition.playoffs?.[boundary] ? ` in ${edition.playoffs[boundary]}` : '');
  switch (fate) {
    case 'promoted':
      return `${name} go up to League ${up}.`;
    case 'playoff-up':
      return `${name} go into a promotion play-off against League ${up} opposition${when(`${up}/${league}`)}.`;
    case 'stay':
      return `${name} stay in League ${league}.`;
    case 'reprieved':
      return `${name} would have gone down, but UEFA enlarged the leagues for 2020–21 and nobody was relegated.`;
    case 'playoff-down':
      return `${name} face a play-off against League ${down} opposition${when(`${league}/${down}`)} to stay up.`;
    case 'playout':
      return `${name} face a relegation play-out against another League ${league} side${when(`${league}/${down}`)}.`;
    case 'relegated':
      return `${name} drop to League ${down}.`;
    default:
      return '';
  }
}

export const TOTAL_EDITIONS = COMPETITIONS.reduce((n, c) => n + c.editions.length, 0);

/** Saved trophies whose competition and edition still exist (retired competitions stay saved, unseen). */
export const knownTrophies = (list) =>
  list.filter((t) => COMPETITION_BY_ID.get(t.compId)?.editions.some((e) => e.id === t.editionId));

const memberTests = new Map();

/** (nation, year) → could it enter? One test per eligibility rule. */
function eligibilityTest(rule) {
  if (rule === 'field') return null;
  if (rule === 'FIFA') return fifaMember;
  if (typeof rule === 'string') return (n, year) => memberOf(n, rule, year);
  let test = memberTests.get(rule);
  if (!test) {
    const spans = memberSpans(rule.members);
    test = (n, year) => {
      const span = spans.get(n.id);
      return !!span && year >= span[0] && year <= span[1] && existsIn(n, year) && !(n.ban != null && year >= n.ban);
    };
    memberTests.set(rule, test);
  }
  return test;
}

/** Nations that could historically take part in this edition: its listed teams plus every eligible member. */
export function eligibleIds(comp, edition) {
  const listed = new Set([...(edition.field ?? []), ...(edition.byes ?? []), ...(edition.groups?.flat() ?? [])]);
  const test = eligibilityTest(comp.eligibility);
  if (!test) return NATIONS.filter((n) => listed.has(n.id) && existsIn(n, edition.year)).map((n) => n.id);
  return NATIONS.filter((n) => listed.has(n.id) || test(n, edition.year)).map((n) => n.id);
}

/** First calendar year of an edition: a season label such as '2018–19' starts in 2018. */
const startYear = (e) => (/^\d{4}–\d/.test(e.label) ? Number(e.label.slice(0, 4)) : e.year);

export function editionStats(comp) {
  const upcomingCount = comp.editions.filter((e) => e.status === 'upcoming').length;
  const years = comp.editions.flatMap((e) => [startYear(e), e.year]);
  return {
    played: comp.editions.length - upcomingCount,
    upcoming: upcomingCount,
    first: Math.min(...years),
    last: Math.max(...years),
  };
}

export function championIds(edition) {
  if (!edition.champion) return [];
  return Array.isArray(edition.champion) ? edition.champion : [edition.champion];
}
