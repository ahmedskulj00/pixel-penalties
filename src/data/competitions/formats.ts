/** How each final tournament was played, and plain-language descriptions of its format. */
import type { Competition, Edition, FinalRoundStage, Format, GroupsFormat, KnockoutFormat, KnockoutStage, LeagueFormat, SecondStage } from '@/types';

// ─── Formats ────────────────────────────────────────────────────────────────
// How each final tournament was played. A group stage is a set of mini-leagues of
// shootouts: `advance` teams per group go through, plus the `extra` best teams in the
// next place (the best third-placed teams at EURO 2016–2032, for example). `byes` teams
// skip the groups, and `second` describes a second group stage (World Cup 1950–82).

const KO = (size: number): KnockoutFormat => ({ type: 'knockout', size });
const LEAGUE: LeagueFormat = { type: 'league' };
const groupStage = (
  groups: number,
  size: number,
  advance: number,
  extra = 0,
  names: readonly string[] | null = null,
  more: Partial<GroupsFormat> = {},
): GroupsFormat => ({
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
type StageLists = SecondStage['lists'];
function second(lists: StageLists, extra: { names?: readonly string[]; league: true }): FinalRoundStage;
function second(lists: StageLists, extra: { names?: readonly string[]; pairs: KnockoutStage['pairs'] }): KnockoutStage;
function second(lists: StageLists, extra: object): SecondStage {
  return { lists, advance: 1, ...extra } as SecondStage;
}
const finalRound = (labels: readonly string[]): FinalRoundStage => second([labels], { names: ['Final round'], league: true });
const HOLDERS: Partial<GroupsFormat> = { byes: 1, byeLabel: 'the holders' };
const TOP_SEEDS: Partial<GroupsFormat> = { byes: 4, byeLabel: 'the four top seeds' };

const FORMAT_BY_ERA: Record<string, (year: number, edition: Edition) => Format> = {
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
  baltic: (_year, e) => ((e.field?.length ?? 3) === 4 ? KO(4) : LEAGUE),

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

/** The format of one edition: group stage, single league table, or straight knockout. */
export function formatOf(comp: Competition, edition: Edition): Format {
  if (edition.format) return edition.format;
  return FORMAT_BY_ERA[comp.id]?.(edition.year, edition) ?? KO(edition.bracket ?? 4);
}

const KO_ENTRY: Record<number, string> = { 2: 'the final', 4: 'the semi-finals', 8: 'the quarter-finals', 16: 'the round of 16', 32: 'the round of 32' };
const KO_ONLY: Record<number, string> = { 2: 'Straight to the final', 4: 'Semi-finals and final', 8: 'Knockout from the quarter-finals', 16: 'Knockout from the round of 16' };
export const WORD: readonly string[] = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const PLACE: readonly string[] = ['', 'first', 'second', 'third', 'fourth'];

/** Short description for edition cards, e.g. "6 groups of 4, then the round of 16". */
export function formatLabel(format: Format): string {
  if (format.type === 'league') return 'One league table';
  if (format.type === 'promotion') return `League ${format.league}: ${format.groups} groups of ${(format.sizes ?? [format.size]).join(' or ')}`;
  if (format.type === 'knockout') return KO_ONLY[format.size] ?? 'Knockout';
  const groups = `${format.groups} ${format.groups === 1 ? 'group' : 'groups'} of ${format.size}`;
  if (format.second) return `${groups}, then ${format.second.league ? 'a final round' : 'a second group stage'}`;
  const seeds = format.byes ? ` with ${format.byeLabel}` : '';
  return `${groups}, then ${KO_ENTRY[knockoutSize(format)] ?? 'knockouts'}${seeds}`;
}

/** Teams in the first knockout round: group qualifiers plus any byes. */
export function knockoutSize(format: GroupsFormat): number {
  return format.groups * format.advance + format.extra + (format.byes ?? 0);
}

/** Who goes through, in one plain sentence. */
export function qualifyRule(format: Format): string | null {
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
