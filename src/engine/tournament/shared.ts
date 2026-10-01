/** Small helpers shared by the tournament modules. */
import type { Edition, Fixture, NationId, Tournament } from '@/types';
import { COMPETITION_BY_ID } from '@/data/competitions';
import { NATION_BY_ID } from '@/data/nations';

export const ratingOf = (id: NationId | null): number => NATION_BY_ID.get(id as NationId)?.rating ?? 2;

export const makeMatch = (a: NationId, b: NationId | null): Fixture => ({ a, b, w: b === null ? a : null, s: null, bye: b === null });

export const LETTERS = 'ABCDEFGHIJKL';

export const GROUP_SALT = 7919;

export const DRAW_SALT = 4241;

export const editionOf = (t: Tournament): Edition | undefined => COMPETITION_BY_ID.get(t.compId)?.editions.find((e) => e.id === t.editionId);
