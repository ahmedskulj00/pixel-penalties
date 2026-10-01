import type { Edition } from '@/types';
import { ed, upcoming, G } from './helpers';

/**
 * UEFA competitions and the Baltic Cup. Edition fields are listed in finishing order
 * (champion first); editions without a known line-up are drawn from eligible nations.
 */

// ─── Senior men ────────────────────────────────────────────────────────────────

export const EURO: Edition[] = [
  ed(1960, 'FRA', 'URS YUG TCH FRA', { bracket: 4, note: "The first European Nations' Cup." }),
  ed(1964, 'ESP', 'ESP URS HUN DEN', { bracket: 4 }),
  ed(1968, 'ITA', 'ITA YUG ENG URS', { bracket: 4 }),
  ed(1972, 'BEL', 'FRG URS BEL HUN', { bracket: 4 }),
  ed(1976, 'YUG', 'TCH FRG NED YUG', {
    bracket: 4,
    note: 'The first EURO final settled on penalties, won with Antonín Panenka’s chip.',
  }),
  ed(1980, 'ITA', 'FRG BEL TCH ITA NED GRE ENG ESP', { groups: G('FRG TCH NED GRE', 'BEL ITA ENG ESP') }),
  ed(1984, 'FRA', 'FRA ESP DEN POR BEL YUG FRG ROU', { groups: G('FRA DEN BEL YUG', 'ESP POR FRG ROU') }),
  ed(1988, 'FRG', 'NED URS ITA FRG DEN ESP ENG IRL', { groups: G('FRG ITA ESP DEN', 'URS NED IRL ENG') }),
  ed(1992, 'SWE', 'DEN GER NED SWE FRA ENG SCO CIS', {
    groups: G('SWE DEN FRA ENG', 'NED GER SCO CIS'),
    note: 'Denmark replaced Yugoslavia at ten days’ notice, then won it.',
  }),
  ed(1996, 'ENG', 'GER CZE ENG FRA CRO POR ESP NED ITA DEN SUI SCO RUS BUL ROU TUR', {
    groups: G('ENG NED SCO SUI', 'FRA ESP BUL ROU', 'GER CZE ITA RUS', 'POR CRO DEN TUR'),
    note: 'Germany beat England on penalties in the Wembley semi-final.',
  }),
  ed(2000, 'BEL NED', 'FRA ITA POR NED ESP SCG TUR ROU BEL NOR SVN SWE CZE DEN GER ENG', {
    groups: G('POR ROU ENG GER', 'ITA TUR BEL SWE', 'ESP SCG NOR SVN', 'NED FRA CZE DEN'),
  }),
  ed(2004, 'POR', 'GRE POR CZE NED FRA ENG SWE DEN ESP RUS CRO SUI LVA GER ITA BUL', {
    groups: G('POR GRE ESP RUS', 'FRA ENG CRO SUI', 'SWE DEN ITA BUL', 'CZE NED GER LVA'),
  }),
  ed(2008, 'AUT SUI', 'ESP GER RUS TUR NED CRO POR ITA AUT SUI CZE POL ROU FRA GRE SWE', {
    groups: G('POR TUR CZE SUI', 'CRO GER AUT POL', 'NED ITA ROU FRA', 'ESP RUS SWE GRE'),
  }),
  ed(2012, 'POL UKR', 'ESP ITA GER POR CZE GRE ENG FRA CRO DEN NED RUS POL UKR SWE IRL', {
    groups: G('CZE GRE RUS POL', 'GER POR DEN NED', 'ESP ITA CRO IRL', 'ENG FRA UKR SWE'),
  }),
  ed(2016, 'FRA', 'POR FRA GER WAL BEL POL ISL ITA CRO SUI SVK NIR ENG ESP HUN IRL AUT ROU ALB RUS CZE SWE TUR UKR', {
    groups: G('FRA SUI ALB ROU', 'WAL ENG SVK RUS', 'GER POL NIR UKR', 'CRO ESP TUR CZE', 'ITA BEL IRL SWE', 'HUN ISL POR AUT'),
  }),
  ed(2020, 'ENG ITA GER ESP NED DEN HUN ROU SCO AZE RUS', 'ITA ENG ESP DEN BEL SUI UKR CZE NED POR FRA CRO SWE WAL AUT GER FIN RUS SVK POL SCO MKD HUN TUR', {
    groups: G('ITA WAL SUI TUR', 'BEL DEN FIN RUS', 'NED AUT UKR MKD', 'ENG CRO CZE SCO', 'SWE ESP SVK POL', 'FRA GER POR HUN'),
    hostNote: '11 host cities',
    note: 'Played in 2021; Italy won the Wembley final on penalties.',
  }),
  ed(2024, 'GER', 'ESP ENG FRA NED GER POR TUR SUI GEO DEN SVN BEL ROU AUT SVK ITA CRO CZE SCO ALB POL SRB UKR HUN', {
    groups: G('GER SUI HUN SCO', 'ESP ITA CRO ALB', 'ENG DEN SVN SRB', 'AUT FRA NED POL', 'ROU BEL SVK UKR', 'POR TUR GEO CZE'),
    note: 'Spain became the first nation to win four EUROs.',
  }),
  upcoming(2028, 'ENG SCO WAL IRL', { hostNote: 'UK & Ireland' }),
  upcoming(2032, 'ITA TUR'),
];

// Groups are in final standings order (2026–27: draw order). `fates` say what each finishing
// place meant for a team's league next season, as arrays when it depended on how that place
// ranked across the groups (best first); `rules` say it in a sentence and `playoffs` date the
// play-offs at each league boundary.
export const NATIONS_LEAGUE: Edition[] = [
  ed(2019, 'POR', 'POR NED ENG SUI', {
    label: '2018–19',
    groups: G('NED FRA GER', 'SUI BEL ISL', 'POR ITA POL', 'ENG ESP CRO'),
    leagues: {
      B: G('UKR CZE SVK', 'SWE RUS TUR', 'BIH AUT NIR', 'DEN WAL IRL'),
      C: G('SCO ISR ALB', 'FIN HUN GRE EST', 'NOR BUL CYP SVN', 'SRB ROU MNE LTU'),
      D: G('GEO KAZ LVA AND', 'BLR LUX MDA SMR', 'KOS AZE FRO MLT', 'MKD ARM LIE GIB'),
    },
    // UEFA enlarged the leagues for 2020–21: nobody went down and extra teams went up.
    fates: {
      A: { 2: 'stay', 3: 'reprieved' },
      B: { 1: 'promoted', 2: 'stay', 3: 'reprieved' },
      C: { 1: 'promoted', 2: 'promoted', 3: 'stay', 4: 'stay' },
      D: { 1: 'promoted', 2: 'promoted', 3: ['promoted', 'stay', 'stay', 'stay'], 4: 'stay' },
    },
    rules: {
      B: 'Group winners go up to League A. The bottom sides were due to go down, but UEFA enlarged the leagues for 2020–21 and nobody was relegated.',
      C: 'Group winners and runners-up go up to League B, because UEFA enlarged the leagues for 2020–21.',
      D: 'Group winners, runners-up and the best third-placed team go up to League C, because UEFA enlarged the leagues for 2020–21.',
    },
    note: 'Portugal won the first edition at home, beating the Netherlands 1–0 in Porto.',
  }),
  ed(2021, 'ITA', 'FRA ESP ITA BEL', {
    label: '2020–21',
    groups: G('ITA NED POL BIH', 'BEL DEN ENG ISL', 'FRA POR CRO SWE', 'ESP GER SUI UKR'),
    leagues: {
      B: G('AUT NOR ROU NIR', 'CZE SCO ISR SVK', 'HUN RUS SRB TUR', 'WAL FIN IRL BUL'),
      C: G('MNE LUX AZE CYP', 'ARM MKD GEO EST', 'SVN GRE KOS MDA', 'ALB BLR LTU KAZ'),
      D: G('FRO MLT LVA AND', 'GIB LIE SMR'),
    },
    fates: {
      A: { 2: 'stay', 3: 'stay', 4: 'relegated' },
      B: { 1: 'promoted', 2: 'stay', 3: 'stay', 4: 'relegated' },
      C: { 1: 'promoted', 2: 'stay', 3: 'stay', 4: 'playout' },
      D: { 1: 'promoted', 2: 'stay', 3: 'stay', 4: 'stay' },
    },
    rules: {
      B: 'Group winners go up to League A, and the bottom team drops to League C.',
      C: 'Group winners go up to League B, and the bottom teams face relegation play-outs.',
      D: 'Group winners go up to League C.',
    },
    playoffs: { 'C/D': 'March 2022' },
    note: 'France beat Spain 2–1 in the Milan final.',
  }),
  ed(2023, 'NED', 'ESP CRO ITA NED', {
    label: '2022–23',
    groups: G('CRO DEN FRA AUT', 'ESP POR SUI CZE', 'ITA HUN GER ENG', 'NED BEL POL WAL'),
    leagues: {
      B: G('SCO UKR IRL ARM', 'ISR ISL ALB', 'BIH FIN MNE ROU', 'SRB NOR SVN SWE'),
      C: G('TUR LUX FRO LTU', 'GRE KOS NIR CYP', 'KAZ AZE SVK BLR', 'GEO BUL MKD GIB'),
      D: G('LVA MDA AND LIE', 'EST MLT SMR'),
    },
    // Russia's suspension left Group B2 with three teams and only one League C side to go down.
    fates: {
      A: { 2: 'stay', 3: 'stay', 4: 'relegated' },
      B: { 1: 'promoted', 2: 'stay', 3: 'stay', 4: 'relegated' },
      C: { 1: 'promoted', 2: 'stay', 3: 'stay', 4: ['stay', 'stay', 'playout', 'playout'] },
      D: { 1: 'promoted', 2: 'stay', 3: 'stay', 4: 'stay' },
    },
    rules: {
      B: 'Group winners go up to League A, and fourth-placed teams drop to League C.',
      C: 'Group winners go up to League B, and the two worst fourth-placed teams face a relegation play-out.',
      D: 'Group winners go up to League C.',
    },
    playoffs: { 'C/D': 'March 2024' },
    note: 'Spain beat Croatia on penalties in the Rotterdam final.',
  }),
  ed(2025, 'GER', 'POR ESP FRA GER DEN NED CRO ITA', {
    label: '2024–25',
    groups: G('POR CRO SCO POL', 'FRA ITA BEL ISR', 'GER NED HUN BIH', 'ESP DEN SRB SUI'),
    leagues: {
      B: G('CZE UKR GEO ALB', 'ENG GRE IRL FIN', 'NOR AUT SVN KAZ', 'WAL TUR ISL MNE'),
      C: G('SWE SVK EST AZE', 'ROU KOS CYP LTU', 'NIR BUL BLR LUX', 'MKD ARM FRO LVA'),
      D: G('SMR GIB LIE', 'MDA MLT AND'),
    },
    fates: {
      A: { 3: 'playoff-down', 4: 'relegated' },
      B: { 1: 'promoted', 2: 'playoff-up', 3: 'playoff-down', 4: 'relegated' },
      C: { 1: 'promoted', 2: 'playoff-up', 3: 'stay', 4: ['playoff-down', 'playoff-down', 'relegated', 'relegated'] },
      D: { 1: 'promoted', 2: 'playoff-up', 3: 'stay' },
    },
    rules: {
      B: 'Group winners go up to League A and runners-up get a promotion play-off. Third place faces a play-off to stay up, and the bottom team drops to League C.',
      C: 'Group winners go up to League B and runners-up get a promotion play-off. The two worst fourth-placed teams drop to League D, and the other two face play-offs to stay up.',
      D: 'Group winners go up to League C, and runners-up get a promotion play-off.',
    },
    playoffs: { 'A/B': 'March 2025', 'B/C': 'March 2025', 'C/D': 'March 2026' },
    note: 'Portugal beat Spain on penalties in the Munich final.',
  }),
  upcoming(2027, null, {
    label: '2026–27',
    groups: G('FRA ITA BEL TUR', 'GER NED SRB GRE', 'ESP CRO ENG CZE', 'POR DEN NOR WAL'),
    leagues: {
      B: G('SCO SUI SVN MKD', 'HUN UKR GEO NIR', 'AUT KOS IRL ISR', 'POL BIH ROU SWE'),
      C: G('ALB FIN BLR SMR', 'MNE ARM CYP LVA', 'KAZ SVK FRO MDA', 'ISL BUL EST LUX'),
      D: G('MLT GIB AND', 'LTU AZE LIE'),
    },
    // The last edition with League D: promotion and relegation were rebalanced for three
    // leagues of 18 from 2028–29.
    fates: {
      A: { 3: ['stay', 'stay', 'playoff-down', 'playoff-down'], 4: ['playoff-down', 'playoff-down', 'relegated', 'relegated'] },
      B: { 1: 'promoted', 2: 'playoff-up', 3: 'stay', 4: 'playoff-down' },
      C: { 1: 'promoted', 2: 'playoff-up', 3: 'stay', 4: 'stay' },
      D: { 1: 'promoted', 2: 'promoted', 3: 'promoted' },
    },
    rules: {
      B: 'Group winners go up to League A, runners-up get a promotion play-off, and the bottom team faces a play-off to stay up.',
      C: 'Group winners go up to League B, runners-up get a promotion play-off, and nobody goes down this season.',
      D: 'League D is being wound up, so all six teams move up to League C. Winning the group is for the glory.',
    },
    playoffs: { 'A/B': 'March 2027', 'B/C': 'March 2027' },
    note: 'League phase under way since 24 September 2026. Finals: June 2027, host to be named.',
  }),
];

// ─── Women ────────────────────────────────────────────────────────────────────

export const WOMENS_EURO: Edition[] = [
  ed(1984, null, 'SWE ENG DEN ITA', { hostNote: 'Two-legged final' }),
  ed(1987, 'NOR', 'NOR SWE ITA ENG'),
  ed(1989, 'FRG', 'FRG NOR SWE ITA'),
  ed(1991, 'DEN', 'GER NOR DEN ITA'),
  ed(1993, 'ITA', 'NOR ITA DEN GER'),
  ed(1995, null, 'GER SWE NOR ENG', { hostNote: 'Home and away' }),
  ed(1997, 'NOR SWE', 'GER ITA SWE ESP NOR DEN FRA RUS', { groups: G('SWE ESP FRA RUS', 'ITA GER NOR DEN') }),
  ed(2001, 'GER', 'GER SWE NOR DEN ITA RUS ENG FRA', { groups: G('GER SWE RUS ENG', 'DEN NOR ITA FRA') }),
  ed(2005, 'ENG', 'GER NOR SWE FIN DEN FRA ITA ENG', { groups: G('SWE FIN DEN ENG', 'GER NOR FRA ITA') }),
  ed(2009, 'FIN', 'GER ENG NED NOR FRA FIN SWE ITA DEN ISL RUS UKR', {
    groups: G('FIN NED DEN UKR', 'SWE ITA ENG RUS', 'GER FRA NOR ISL'),
  }),
  ed(2013, 'SWE', 'GER NOR SWE DEN ITA FRA ESP ISL ENG NED FIN RUS', {
    groups: G('SWE ITA DEN FIN', 'NOR GER ISL NED', 'FRA ESP RUS ENG'),
  }),
  ed(2017, 'NED', 'NED DEN ENG AUT SWE GER FRA ESP NOR BEL SUI ISL ITA RUS SCO POR', {
    groups: G('NED DEN BEL NOR', 'GER SWE RUS ITA', 'AUT FRA SUI ISL', 'ENG ESP SCO POR'),
  }),
  ed(2022, 'ENG', 'ENG GER FRA SWE ESP NED AUT BEL NOR NIR ITA ISL DEN FIN SUI POR', {
    groups: G('ENG AUT NOR NIR', 'GER ESP DEN FIN', 'SWE NED SUI POR', 'FRA BEL ISL ITA'),
    bracket: 8,
    note: 'England won the final at Wembley.',
  }),
  ed(2025, 'SUI', 'ENG ESP GER ITA SWE SUI FRA NOR POR ISL FIN BEL NED WAL DEN POL', {
    groups: G('NOR SUI FIN ISL', 'ESP ITA BEL POR', 'SWE GER POL DEN', 'FRA ENG NED WAL'),
    bracket: 8,
    note: 'England retained the title on penalties against Spain in Basel.',
  }),
  upcoming(2029, 'GER'),
];

export const WOMENS_NATIONS_LEAGUE: Edition[] = [
  ed(2024, 'FRA NED ESP', 'ESP FRA GER NED', {
    label: '2023–24',
    groups: G('NED ENG BEL SCO', 'ESP ITA SWE SUI', 'FRA AUT NOR POR', 'GER DEN ISL WAL'),
  }),
  ed(2025, null, 'ESP GER FRA SWE', {
    hostNote: 'Home and away',
    groups: G('FRA NOR ISL SUI', 'ESP ENG BEL POR', 'GER NED AUT SCO', 'SWE ITA DEN WAL'),
  }),
  upcoming(2027, null, { note: 'Next edition confirmed by UEFA; dates to follow.' }),
];

// ─── Regional ───────────────────────────────────────────────────────────────

export const BALTIC: Edition[] = [
  ed(1928, 'EST', 'LVA EST LTU'),
  ed(1929, 'LVA', 'EST LVA LTU'),
  ed(1930, 'LTU', 'LTU LVA EST'),
  ed(1931, 'EST', 'EST LVA LTU'),
  ed(1932, 'LVA', 'LVA LTU EST'),
  ed(1933, 'LTU', 'LVA LTU EST', { status: 'disputed', note: 'Disputed result, so no tournament was held in 1934.' }),
  ed(1935, 'EST', 'LTU LVA EST'),
  ed(1936, 'LVA', 'LVA EST LTU'),
  ed(1937, 'LTU', 'LVA EST LTU'),
  ed(1938, 'EST', 'EST LVA LTU'),
  ed(1940, 'LVA', 'LVA EST LTU'),
  ed(1991, 'LTU', 'LTU LVA EST'),
  ed(1992, 'LVA', 'LTU LVA EST'),
  ed(1993, 'EST', 'LVA EST LTU'),
  ed(1994, 'LTU', 'LTU LVA EST'),
  ed(1995, 'LVA', 'LVA LTU EST'),
  ed(1996, 'EST', 'LTU EST LVA'),
  ed(1997, 'LTU', 'LTU LVA EST'),
  ed(1998, null, 'LTU LVA EST'),
  ed(2001, 'LVA', 'LVA LTU EST'),
  ed(2003, 'EST', 'LVA LTU EST'),
  ed(2005, 'LTU', 'LTU LVA', { note: 'Estonia did not enter.' }),
  ed(2008, 'LVA', 'LVA LTU EST'),
  ed(2010, 'LTU', 'LTU LVA EST'),
  ed(2012, 'EST', 'LVA FIN EST LTU', { note: 'Finland joined as guests.' }),
  ed(2014, 'LVA', 'LVA LTU FIN EST', { note: 'Finland joined as guests.' }),
  ed(2016, null, 'LVA LTU EST'),
  ed(2018, null, 'LVA EST LTU'),
  ed(2021, null, 'EST LVA LTU'),
  ed(2022, null, 'ISL LVA EST LTU', { note: 'Guests Iceland won it at the first attempt.' }),
  ed(2024, null, 'EST LTU LVA FRO', { note: 'The Faroe Islands joined as guests.' }),
  ed(2026, null, 'EST LTU FRO LVA'),
];
