/** Lower case without accents, for forgiving search: 'Curaçao' → 'curacao'. */
export const foldText = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
