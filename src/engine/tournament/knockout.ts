import type { Fixture, GroupsFormat, NationId, Tournament } from '@/types';
import { knockoutSize } from '@/data/competitions';
import { NATION_BY_ID, nameIn } from '@/data/nations';
import { ordinal } from '@/utils/format';
import { createRng, deriveSeed, type Rng } from '@/utils/random';
import { acrossGroups, type Qualifiers } from './groups';
import { DRAW_SALT, LETTERS, editionOf, makeMatch } from './shared';

/** A team entering the draw, with its group (seeded teams get a negative one). */
type Drawn = { id: NationId; group: number };

/** Placeholder labels for the first knockout round while the groups are still being played. */
export interface KnockoutPreview {
  size: number;
  first: [string, string][];
}

/**
 * First knockout round, listed in bracket order (neighbours meet in the next round).
 * "1A" = winner of group A, "2C" = runner-up of C, "3ADEF" = a best third-placed team from
 * A, D, E or F. The 24-team layout is the one UEFA used at EURO 2016, 2020 and 2024.
 */
const TEMPLATES: Record<string, [string, string][]> = {
  '1x2': [['1A', '2A']],
  '2x1': [['1A', '1B']],
  '2x2': [
    ['1A', '2B'],
    ['1B', '2A'],
  ],
  '4x2': [
    ['1A', '2B'],
    ['1C', '2D'],
    ['1B', '2A'],
    ['1D', '2C'],
  ],
  '3x2+2': [
    ['1A', '3BC'],
    ['2A', '2B'],
    ['1B', '2C'],
    ['1C', '3AB'],
  ],
  '6x2+4': [
    ['1B', '3ADEF'],
    ['1A', '2C'],
    ['1F', '3ABC'],
    ['2D', '2E'],
    ['1E', '3ABCD'],
    ['1D', '2F'],
    ['1C', '3DEF'],
    ['2A', '2B'],
  ],
  '2x4': [
    ['1A', '4B'],
    ['2B', '3A'],
    ['1B', '4A'],
    ['2A', '3B'],
  ],
  // World Cup 1998–2022.
  '8x2': [
    ['1A', '2B'],
    ['1C', '2D'],
    ['1E', '2F'],
    ['1G', '2H'],
    ['1B', '2A'],
    ['1D', '2C'],
    ['1F', '2E'],
    ['1H', '2G'],
  ],
  // World Cup 2026: FIFA's round of 32, with the eight best third-placed teams.
  '12x2+8': [
    ['1E', '3ABCDF'],
    ['1I', '3CDFGH'],
    ['2A', '2B'],
    ['1F', '2C'],
    ['2K', '2L'],
    ['1H', '2J'],
    ['1D', '3BEFIJ'],
    ['1G', '3AEHIJ'],
    ['1C', '2F'],
    ['2E', '2I'],
    ['1A', '3CEFHI'],
    ['1L', '3EHIJK'],
    ['1J', '2H'],
    ['2D', '2G'],
    ['1B', '3EFGIJ'],
    ['1K', '3DEIJL'],
  ],
};

const templateKey = (f: GroupsFormat): string => `${f.groups}x${f.advance}${f.extra ? `+${f.extra}` : ''}`;

const isPool = (label: string): boolean => label.length > 2;

/** Match qualified extra teams to template slots (allowed group sets) so no group-mates meet. */
export function assignExtras(slots: Set<number>[], extras: readonly { group: number }[]): number[] | null {
  const used = new Array<boolean>(extras.length).fill(false);
  const pick = new Array<number>(slots.length);
  const place = (s: number): boolean => {
    if (s === slots.length) return true;
    for (let i = 0; i < extras.length; i++) {
      if (used[i] || !slots[s].has(extras[i].group)) continue;
      used[i] = true;
      pick[s] = i;
      if (place(s + 1)) return true;
      used[i] = false;
    }
    return false;
  };
  return place(0) ? pick : null;
}

/** Pair qualifiers by lot, never two from the same group. */
function drawPairs(list: Drawn[], rng: Rng): Fixture[] {
  const pool = rng.shuffle(list);
  const pairs: [Drawn, Drawn][] = [];
  const pair = (rest: Drawn[]): boolean => {
    if (!rest.length) return true;
    const [first, ...others] = rest;
    for (let i = 0; i < others.length; i++) {
      if (others[i].group === first.group) continue;
      pairs.push([first, others[i]]);
      if (pair(others.filter((_, k) => k !== i))) return true;
      pairs.pop();
    }
    return false;
  };
  if (!pair(pool)) {
    pairs.length = 0;
    for (let i = 0; i < pool.length; i += 2) pairs.push([pool[i], pool[i + 1]]);
  }
  return pairs.map(([x, y]) => makeMatch(x.id, y.id));
}

/** Standard seeding order for a bracket of n slots: 4 → [0, 3, 1, 2], 8 → [0, 7, 3, 4, 1, 6, 2, 5]. */
export function bracketOrder(n: number): number[] {
  let order = [0];
  while (order.length < n) {
    const m = order.length * 2;
    order = order.flatMap((i) => [i, m - 1 - i]);
  }
  return order;
}

/**
 * Seeded teams join the group qualifiers: the best seed meets the weakest qualifier, and
 * the top two seeds can only meet in the final. Uneven numbers (the holders at the Copa
 * América of 1975–87) are drawn instead.
 */
function seedWithByes(byes: NationId[], { direct, extras }: Qualifiers, rng: Rng): Fixture[] {
  const quals = [...direct, ...extras].sort((x, y) => x.pos - y.pos || acrossGroups(x.row, y.row));
  const seeds = byes.map((id, i) => ({ id, group: -1 - i }));
  if (seeds.length !== quals.length) return drawPairs([...seeds, ...quals], rng);
  const pairs = seeds.map((seed, i) => makeMatch(seed.id, quals[quals.length - 1 - i].id));
  return bracketOrder(pairs.length).map((i) => pairs[i]);
}

export function seedKnockout(t: Tournament, { direct, extras }: Qualifiers): Fixture[] {
  const rng = createRng(deriveSeed(t.seed, DRAW_SALT));
  if (t.byes?.length) return seedWithByes(t.byes, { direct, extras }, rng);
  const template = TEMPLATES[templateKey(t.format as GroupsFormat)];
  if (!template) return drawPairs([...direct, ...extras], rng);
  const poolSlots = template.flatMap((pair, p) => pair.map((label, s) => ({ label, p, s }))).filter((x) => isPool(x.label));
  const pick = poolSlots.length
    ? assignExtras(
        poolSlots.map((x) => new Set([...x.label.slice(1)].map((c) => LETTERS.indexOf(c)))),
        extras,
      )
    : [];
  const resolve = (label: string, p: number, s: number): NationId | undefined => {
    if (!isPool(label)) return direct.find((q) => q.pos === Number(label[0]) && q.group === LETTERS.indexOf(label[1]))?.id;
    const k = poolSlots.findIndex((x) => x.p === p && x.s === s);
    return extras[pick ? pick[k] : k]?.id;
  };
  // Unresolved slots are caught just below, and the pairs drawn by lot instead.
  const matches = template.map((pair, p) => makeMatch(resolve(pair[0], p, 0) as NationId, resolve(pair[1], p, 1) as NationId));
  return matches.every((m) => m.a && m.b) ? matches : drawPairs([...direct, ...extras], rng);
}

/** Placeholder labels for the knockout round while the groups are still being played. */
export function knockoutPreview(t: Tournament): KnockoutPreview | null {
  const f = t.format;
  if (f?.type !== 'groups' || f.second || t.stage === 2) return null;
  const size = knockoutSize(f);
  const name = (c: string) => f.names?.[LETTERS.indexOf(c)] ?? c;
  if (t.byes?.length) {
    const edition = editionOf(t);
    const seedName = (id: NationId) => nameIn(NATION_BY_ID.get(id)!, edition?.year);
    const quals = size - t.byes.length;
    const first: [string, string][] =
      t.byes.length === quals
        ? t.byes.map((id): [string, string] => [seedName(id), 'Group qualifier'])
        : [
            [t.byes.map(seedName).join(', '), 'Group winner'],
            ...Array.from({ length: size / 2 - 1 }, (): [string, string] => ['Group winner', 'Group winner']),
          ];
    return { size, first };
  }
  const template = TEMPLATES[templateKey(f)];
  const label = (l: string) => {
    if (isPool(l)) return `3rd ${[...l.slice(1)].map(name).join('/')}`;
    return `${l[0] === '1' ? 'Winner' : l[0] === '2' ? 'Runner-up' : `${ordinal(Number(l[0]))} in`} ${name(l[1])}`;
  };
  const first: [string, string][] = template
    ? template.map(([x, y]): [string, string] => [label(x), label(y)])
    : Array.from({ length: size / 2 }, (_, i): [string, string] => ['Group winner', f.extra && i === 0 ? 'Best runner-up' : 'Group winner']);
  return { size, first };
}
