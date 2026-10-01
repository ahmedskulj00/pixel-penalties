import type { Edition, Fate, FateTable, NationId, PromotionFormat } from '@/types';
import { WORD } from './formats';

/** Where a nation plays in an edition with leagues. */
export interface LeagueSpot {
  league: string;
  group: number;
  /** e.g. 'B3'. */
  name: string;
  teams: NationId[];
}

// ─── Leagues (Nations League editions split into A, B, C and D) ──────────────

const LEAGUE_UP: Record<string, string> = { B: 'A', C: 'B', D: 'C' };
const LEAGUE_DOWN: Record<string, string> = { A: 'B', B: 'C', C: 'D' };

/** Where a nation plays in an edition with leagues: { league, group, name, teams }, or null. */
export function leagueSpot(edition: Edition, nationId: NationId): LeagueSpot | null {
  const all: [string, NationId[][] | undefined][] = [['A', edition.groups], ...Object.entries(edition.leagues ?? {})];
  for (const [league, groups] of all) {
    const group = groups ? groups.findIndex((g) => g.includes(nationId)) : -1;
    if (groups && group >= 0) return { league, group, name: `${league}${group + 1}`, teams: groups[group] };
  }
  return null;
}

function leagueRuleText(league: string, fates: FateTable, teams: number): string {
  const values = Object.values(fates);
  if (values.length && values.every((f) => f === 'promoted')) {
    return `League ${league} is being wound up, so all ${WORD[teams] ?? teams} teams move up to League ${LEAGUE_UP[league]}. Winning the group is for the glory.`;
  }
  const parts: string[] = [];
  if (fates[1] === 'promoted') parts.push(`Group winners go up to League ${LEAGUE_UP[league]}`);
  if (fates[2] === 'playoff-up') parts.push('runners-up get a promotion play-off');
  const last = fates[Math.max(...Object.keys(fates).map(Number))];
  if (last === 'playoff-down') parts.push('the bottom team faces a play-off to stay up');
  else if (last === 'relegated') parts.push(`the bottom team drops to League ${LEAGUE_DOWN[league]}`);
  else parts.push('nobody goes down this season');
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}.`;
}

/** Format for a lower league: groups only, with promotion and relegation at stake. */
export function leagueFormat(edition: Edition, league: string): PromotionFormat {
  const groups = edition.leagues![league];
  const fates: FateTable = edition.fates?.[league] ?? { 1: 'promoted' };
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
export function fateText(fate: Fate | null | undefined, { league, name, edition }: { league: string; name: string; edition: Edition }): string {
  const up = LEAGUE_UP[league];
  const down = LEAGUE_DOWN[league];
  const when = (boundary: string) => (edition.playoffs?.[boundary] ? ` in ${edition.playoffs[boundary]}` : '');
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
