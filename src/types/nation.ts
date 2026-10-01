/** Three-letter team code, e.g. 'BRA' or 'TCH'. */
export type NationId = string;

export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'AFC' | 'CAF' | 'OFC';

/** Picker section: a confederation, teams that no longer exist, or teams outside the confederations. */
export type NationGroup = 'uefa' | 'conmebol' | 'concacaf' | 'afc' | 'caf' | 'ofc' | 'former' | 'other';

export type KitPattern = 'checks' | 'sash' | 'halves' | 'stripes';

export interface Kit {
  shirt: string;
  shorts: string;
  socks: string;
  trim: string;
  pattern?: KitPattern;
  /** Second colour of the pattern. */
  alt?: string;
}

/** A period in which the team existed: [from] while it still does, or [from, to]. */
export type YearSpan = readonly [from: number, to?: number];

/** Confederation membership: [confederation, from, to], with `to` null while it lasts. */
export type Membership = readonly [conf: Confederation, from: number, to: number | null];

/** Era names: [[fromYear, name], …] in date order. */
export type EraName = readonly [from: number, name: string];

export interface Nation {
  id: NationId;
  name: string;
  years: readonly YearSpan[];
  confs: readonly Membership[];
  /** Year from which the team could enter FIFA competitions (null: not a FIFA member). */
  fifa: number | null;
  /** Strength from 1 to 5, used by the computer players and the simulator. */
  rating: number;
  kit: Kit;
  group: NationGroup;
  names?: readonly EraName[];
  /** Year from which the team is suspended from all competitions. */
  ban?: number;
  /** Shown instead of the active years for teams outside the confederations. */
  note?: string;
}
