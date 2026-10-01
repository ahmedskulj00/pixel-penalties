import type { Competition, CompetitionGroupId, Edition, Eligibility, NationId, TrophyTier, Trophy } from '@/types';
import { EURO, NATIONS_LEAGUE, WOMENS_EURO, WOMENS_NATIONS_LEAGUE, BALTIC } from '../editions/uefa';
import { WORLD_CUP, WOMENS_WORLD_CUP, WOMENS_OLYMPICS, ARAB_CUP, FINALISSIMA, WOMENS_FINALISSIMA } from '../editions/fifa';
import { COPA_AMERICA, COPA_FEMENINA } from '../editions/conmebol';
import { GOLD_CUP, CONCACAF_NATIONS_LEAGUE, W_CHAMPIONSHIP, W_GOLD_CUP } from '../editions/concacaf';
import { ASIAN_CUP, WOMENS_ASIAN_CUP, ASEAN, FIFA_ASEAN_CUP, EAFF_E1, SAFF, GULF_CUP, CAFA } from '../editions/afc';
import { AFCON, WAFCON, CHAN, COSAFA } from '../editions/caf';
import { OFC_NATIONS_CUP, OFC_WOMENS } from '../editions/ofc';
import { ARAB, GULF, AFF, EAFF, SAFF_MEMBERS, CAFA_MEMBERS, COSAFA_MEMBERS, BALTIC_MEMBERS } from './eligibility';

export interface EditionStats {
  played: number;
  upcoming: number;
  first: number;
  last: number;
}

/**
 * Every senior international competition still being played, worldwide, with every
 * edition played or confirmed (checked September 2026). Youth tournaments and
 * competitions that have been discontinued are left out.
 */

// ─── Registry ───────────────────────────────────────────────────────────────

export const GROUPS: readonly { id: CompetitionGroupId; label: string }[] = [
  { id: 'world', label: 'World' },
  { id: 'uefa', label: 'Europe' },
  { id: 'conmebol', label: 'South America' },
  { id: 'concacaf', label: 'North & Central America, Caribbean' },
  { id: 'afc', label: 'Asia' },
  { id: 'caf', label: 'Africa' },
  { id: 'ofc', label: 'Oceania' },
];

const comp = (
  id: string,
  group: CompetitionGroupId,
  trophy: TrophyTier,
  name: string,
  short: string,
  eligibility: Eligibility,
  blurb: string,
  editions: Edition[],
  extra: Partial<Competition> = {},
): Competition => ({
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
const WOMEN: Partial<Competition> = { women: true };

export const COMPETITIONS: readonly Competition[] = [
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

export function getCompetition(id: string): Competition {
  const c = COMPETITION_BY_ID.get(id);
  if (!c) throw new Error(`Unknown competition "${id}"`);
  return c;
}

export function getEdition(comp: Competition, editionId: string): Edition {
  const e = comp.editions.find((x) => x.id === editionId);
  if (!e) throw new Error(`Unknown edition "${editionId}" of ${comp.id}`);
  return e;
}

export const TOTAL_EDITIONS = COMPETITIONS.reduce((n, c) => n + c.editions.length, 0);

/** Saved trophies whose competition and edition still exist (retired competitions stay saved, unseen). */
export const knownTrophies = (list: readonly Trophy[]): Trophy[] =>
  list.filter((t) => COMPETITION_BY_ID.get(t.compId)?.editions.some((e) => e.id === t.editionId));

/** First calendar year of an edition: a season label such as '2018–19' starts in 2018. */
const startYear = (e: Edition): number => (/^\d{4}–\d/.test(e.label) ? Number(e.label.slice(0, 4)) : e.year);

export function editionStats(comp: Competition): EditionStats {
  const upcomingCount = comp.editions.filter((e) => e.status === 'upcoming').length;
  const years = comp.editions.flatMap((e) => [startYear(e), e.year]);
  return {
    played: comp.editions.length - upcomingCount,
    upcoming: upcomingCount,
    first: Math.min(...years),
    last: Math.max(...years),
  };
}

export function championIds(edition: Edition): NationId[] {
  if (!edition.champion) return [];
  return Array.isArray(edition.champion) ? edition.champion : [edition.champion];
}
