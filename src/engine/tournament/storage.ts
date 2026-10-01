import type { Tournament } from '@/types';
import { COMPETITION_BY_ID } from '@/data/competitions';
import { NATION_BY_ID } from '@/data/nations';
import { dayCount, userGroupIndex } from './queries';

// Anything loaded from storage is untrusted, so it is read loosely and checked field by field.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validMatch = (m: any): boolean => m && NATION_BY_ID.has(m.a) && (m.b === null || NATION_BY_ID.has(m.b));

/** Guard for anything loaded from storage. Returns a valid (v2) tournament or null. */
export function validateTournament(raw: unknown): Tournament | null {
  try {
    if (!raw) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let t: any = raw;
    if (t.v === 1 && Array.isArray(t.rounds) && t.rounds.length) {
      t = { ...t, v: 2, phase: 'knockout', groups: null, day: 0, format: { type: 'knockout', size: t.rounds[0].length * 2 } };
    }
    if (t.v !== 2 || !t.format || !Array.isArray(t.rounds)) return null;
    const comp = COMPETITION_BY_ID.get(t.compId);
    if (!comp || !comp.editions.some((e) => e.id === t.editionId)) return null;
    if (!NATION_BY_ID.has(t.userId)) return null;
    if (!['playing', 'champion', 'promoted', 'out'].includes(t.status)) return null;
    if (!['groups', 'knockout', 'done'].includes(t.phase)) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validGroups = (groups: any): boolean =>
      Array.isArray(groups) &&
      groups.every(
        (g) =>
          Array.isArray(g.teams) &&
          g.teams.every((id: string) => NATION_BY_ID.has(id)) &&
          Array.isArray(g.days) &&
          g.days.every((d: unknown) => Array.isArray(d) && d.every(validMatch)),
      );
    if (t.stage !== undefined && t.stage !== 2) return null;
    if (t.stage === 2 && (!t.format.second || !validGroups(t.firstGroups))) return null;
    if (t.byes !== undefined && (!Array.isArray(t.byes) || !t.byes.every((id: string) => NATION_BY_ID.has(id)))) return null;
    if (t.groups) {
      // The user may sit outside the groups when seeded into the knockouts or already out.
      const absentOk = !!t.byes?.includes(t.userId) || t.status === 'out' || t.stage === 2;
      if (!validGroups(t.groups) || (userGroupIndex(t) < 0 && !absentOk)) return null;
      if (t.phase === 'groups' && t.status === 'playing' && userGroupIndex(t) < 0) return null;
      if (!Number.isInteger(t.day) || t.day < 0 || t.day > dayCount(t)) return null;
    }
    if (t.phase === 'groups' && !t.groups) return null;
    if (t.phase === 'knockout' && (!Number.isInteger(t.round) || t.round < 0 || t.round >= t.rounds.length)) return null;
    if (!t.rounds.every((ms: unknown) => Array.isArray(ms) && ms.every(validMatch))) return null;
    return t;
  } catch {
    return null;
  }
}
