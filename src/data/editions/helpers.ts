import type { Edition, NationId } from '@/types';

/**
 * Building blocks for edition data. Every edition lists its field in finishing order
 * (champion first), so the first N teams are always the real knockout line-up; editions
 * without a known line-up are topped up from the nations eligible that year.
 */

export function split(s: string): NationId[];
export function split(s: string | null | undefined): NationId[] | null;
export function split(s: string | null | undefined): NationId[] | null {
  return s ? s.split(' ') : null;
}

export type EditionExtra = Partial<Edition>;

/** Edition details for `grouped`, where `byes` may be written as a space-separated string. */
export type GroupedExtra = Omit<EditionExtra, 'byes'> & { byes?: string | NationId[] };

type Teams = string | NationId[] | null;

export function ed(year: number, hosts: Teams, field: Teams, extra: EditionExtra = {}): Edition {
  const f = typeof field === 'string' ? split(field) : field;
  const label = extra.label ?? String(year);
  return {
    id: label,
    label,
    year,
    hosts: hosts ? (typeof hosts === 'string' ? (split(hosts) ?? []) : hosts) : [],
    field: f,
    champion: extra.champion !== undefined ? extra.champion : f ? f[0] : null,
    status: 'played',
    ...extra,
  };
}

export const upcoming = (year: number, hosts: Teams, extra: EditionExtra = {}): Edition =>
  ed(year, hosts, null, { status: 'upcoming', champion: null, ...extra });

/** Real group line-ups, in final standings order: G('GER SUI HUN SCO', 'ESP ITA CRO ALB', …). */
export const G = (...groups: string[]): NationId[][] => groups.map((g) => split(g) ?? []);

/**
 * An edition with its real groups. `top` is the final placing (champion, runner-up, …);
 * everyone else follows in group order. `byes` are teams seeded straight into the knockouts.
 */
export function grouped(year: number, hosts: Teams, top: string | null, groups: string[], extra: GroupedExtra = {}): Edition {
  const gs = G(...groups);
  const first = split(top) ?? [];
  const byes = typeof extra.byes === 'string' ? (split(extra.byes) ?? []) : (extra.byes ?? []);
  const rest = [...new Set([...gs.flat(), ...byes])].filter((id) => !first.includes(id));
  return ed(year, hosts, [...first, ...rest], {
    // A `byes` string is replaced by the parsed list below.
    ...(extra as EditionExtra),
    groups: gs,
    ...(byes.length ? { byes } : {}),
    ...(extra.status === 'upcoming' ? { champion: null } : {}),
  });
}

export const seasonLabel = (end: number): string => (end % 100 === 0 ? `${end - 1}–${end}` : `${end - 1}–${String(end).slice(2)}`);
