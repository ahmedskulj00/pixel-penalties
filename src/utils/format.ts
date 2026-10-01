/** 1 → '1st', 2 → '2nd', 11 → '11th', 23 → '23rd'. */
export function ordinal(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  return `${n}${teen ? 'th' : (suffixes[n % 10] ?? 'th')}`;
}

/** a out of b as a whole percentage, or a dash when b is zero. */
export const percent = (a: number, b: number): string => (b ? `${Math.round((a / b) * 100)}%` : '–');

/** +3, −2 (with a true minus sign) or 0. */
export const signed = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

const LIST = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

/** ['a', 'b', 'c'] → 'a, b, and c'. */
export const formatList = (items: readonly string[]): string => LIST.format(items);
