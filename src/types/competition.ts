import type { Confederation, NationId } from './nation';

export type CompetitionGroupId = 'world' | 'uefa' | 'conmebol' | 'concacaf' | 'afc' | 'caf' | 'ofc';

export type TrophyTier = 'gold' | 'silver' | 'bronze';

/** Who may enter: FIFA members, one confederation, only the listed field, or a list of members. */
export type Eligibility = 'FIFA' | 'field' | Confederation | { readonly members: string };

/** What a Nations League group finish means for a team's league. */
export type Fate = 'promoted' | 'playoff-up' | 'stay' | 'reprieved' | 'playoff-down' | 'playout' | 'relegated';

/** Group position → fate; a list gives the fates by ranking among the teams in that position. */
export type FateTable = Readonly<Record<number, Fate | Fate[]>>;

/**
 * A second group stage. `lists` name the teams by first-stage finish: '1A' is the winner of
 * the first group, '2C' the runner-up of the third.
 */
interface StageBase {
  lists: readonly (readonly string[])[];
  advance: number;
  names?: readonly string[];
}

/** A final round: one table that decides the title. */
export interface FinalRoundStage extends StageBase {
  league: true;
}

/** A second group stage whose winners play the `pairs` knockouts. */
export interface KnockoutStage extends StageBase {
  league?: false;
  pairs: readonly (readonly [string, string])[];
}

export type SecondStage = FinalRoundStage | KnockoutStage;

export interface KnockoutFormat {
  type: 'knockout';
  size: number;
}

export interface LeagueFormat {
  type: 'league';
}

export interface GroupsFormat {
  type: 'groups';
  groups: number;
  size: number;
  /** Teams through from each group. */
  advance: number;
  /** Best-placed teams from the next position that also go through. */
  extra: number;
  names?: readonly string[];
  /** Seeded teams that skip the groups and join in the knockouts. */
  byes?: number;
  byeLabel?: string;
  second?: SecondStage;
  rule?: string;
}

/** A lower Nations League tier: groups only, with promotion and relegation at stake. */
export interface PromotionFormat {
  type: 'promotion';
  league: string;
  groups: number;
  size: number;
  sizes: number[];
  names: string[];
  fates: FateTable;
  rule: string;
}

export type Format = KnockoutFormat | LeagueFormat | GroupsFormat | PromotionFormat;

export type EditionStatus = 'played' | 'upcoming' | 'cancelled' | 'unfinished' | 'nowinner' | 'void' | 'disputed' | 'shared';

export interface Edition {
  id: string;
  label: string;
  year: number;
  hosts: NationId[];
  /** The field in finishing order, champion first (null when the line-up is not known). */
  field: NationId[] | null;
  champion: NationId | NationId[] | null;
  status: EditionStatus;
  /** A label for the era, shown on the edition card. */
  era?: string;
  note?: string;
  hostNote?: string;
  /** Real groups, each in final standings order. */
  groups?: NationId[][];
  byes?: NationId[];
  format?: Format;
  /** Bracket size for knockout editions without a known format. */
  bracket?: number;
  /** Real first-round pairings. */
  pairs?: readonly (readonly [NationId, NationId])[];
  /** Nations League tiers below League A. */
  leagues?: Readonly<Record<string, NationId[][]>>;
  fates?: Readonly<Record<string, FateTable>>;
  /** When each promotion or relegation play-off was played, by boundary such as 'A/B'. */
  playoffs?: Readonly<Record<string, string>>;
  /** Plain-language promotion and relegation rule per league. */
  rules?: Readonly<Record<string, string>>;
}

export interface Competition {
  id: string;
  name: string;
  short: string;
  group: CompetitionGroupId;
  trophy: TrophyTier;
  eligibility: Eligibility;
  blurb: string;
  editions: Edition[];
  women?: boolean;
}
