import type { Competition, Edition, NationId } from '@/types';
import { formatOf, leagueFormat, leagueSpot, qualifyRule } from '@/data/competitions';
import { getNation, nameIn } from '@/data/nations';
import { formatList } from '@/utils/format';
import './LeagueLine.css';

export interface LeagueLineProps {
  comp: Competition;
  edition: Edition;
  nationId: NationId | null;
  dream: boolean;
}

/** Where the chosen nation plays in an edition split into leagues. */
export function LeagueLine({ comp, edition, nationId, dream }: LeagueLineProps) {
  const nation = nationId ? getNation(nationId) : null;
  if (!nation) return <p className="edition-summary__league">Every nation plays in its real league. Pick one to see its group.</p>;
  const name = nameIn(nation, edition.year);
  const spot = leagueSpot(edition, nation.id);
  if (!spot || (dream && spot.league !== 'A')) {
    return <p className="edition-summary__league">Dream entry: {name} take a place in League A and play for the trophy.</p>;
  }
  const mates = spot.teams.filter((id) => id !== nationId).map((id) => nameIn(getNation(id), edition.year));
  const rule = spot.league === 'A' ? qualifyRule(formatOf(comp, edition)) : leagueFormat(edition, spot.league).rule;
  return (
    <p className="edition-summary__league">
      {name} play in League {spot.league}, Group {spot.name}, with {formatList(mates)}. {rule}
      {spot.league !== 'A' && ' Switch on dream mode to take a League A place instead.'}
    </p>
  );
}
