import type { Competition, Edition, NationId } from '@/types';
import { eligibleIds } from '@/data/competitions';
import { NATIONS, NATION_BY_ID, existsIn } from '@/data/nations';
import type { Rng } from '@/utils/random';
import { ratingOf } from './shared';

export interface FieldOptions {
  comp: Competition;
  edition: Edition;
  /** The user's nation; null gives every place to the computer. */
  userId: NationId | null;
  size: number;
  rng: Rng;
  /** Seeded teams (byes) to keep out of the field. */
  exclude?: readonly NationId[];
}

/**
 * Historical line-up first, then the strongest eligible nations, drawn with weighting.
 * `exclude` keeps seeded teams (byes) out; with no `userId` every place goes to the AI.
 */
export function buildField({ comp, edition, userId, size, rng, exclude = [] }: FieldOptions): { entrants: NationId[]; replaced: NationId | null } {
  const skip = new Set(exclude);
  const seedList = (edition.field ?? edition.hosts ?? []).filter((id) => NATION_BY_ID.has(id) && !skip.has(id));
  const slots = userId ? size - 1 : size;
  const known = seedList.filter((id) => id !== userId);
  const chosen = known.slice(0, slots);
  const replaced = userId && !seedList.includes(userId) && known.length > slots ? known[slots] : null;

  if (chosen.length < slots) {
    const pool = eligibleIds(comp, edition).filter((id) => id !== userId && !chosen.includes(id) && !skip.has(id));
    while (chosen.length < slots && pool.length) {
      const i = rng.weighted(pool.map((id) => ratingOf(id) ** 2));
      chosen.push(pool.splice(i, 1)[0]);
    }
  }
  if (chosen.length === 0) {
    const fallback = NATIONS.filter((n) => existsIn(n, edition.year) && n.id !== userId && !skip.has(n.id));
    chosen.push(fallback[rng.int(fallback.length)].id);
  }
  return { entrants: userId ? [userId, ...chosen] : chosen, replaced };
}
