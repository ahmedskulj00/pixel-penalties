import type { Confederation, Kit, KitPattern, Membership, Nation, NationGroup, NationId, YearSpan } from '@/types';

/**
 * Every national team that has played a FIFA or confederation competition, past and present.
 *
 * confs  – confederation membership periods, written 'AFC 1954-1974' or 'UEFA 1994' (open end)
 * fifa   – year from which the team could enter FIFA competitions (null = not a FIFA member)
 * years  – periods in which the team existed: [[from, to?], …] (open end = still active)
 * ban    – year from which the team is suspended from all competitions
 * rating – 1…5 strength used by the AI and the simulator
 * names  – optional era names: [[fromYear, name], …]
 * group  – picker section: a confederation, 'former', or 'other' (outside the confederations)
 */

const kit = (shirt: string, shorts: string, socks: string, trim: string, pattern?: KitPattern, alt?: string): Kit => ({
  shirt,
  shorts,
  socks,
  trim,
  pattern,
  alt,
});

/** 'AFC 1954-1974' → ['AFC', 1954, 1974]; 'UEFA 1994' → ['UEFA', 1994, null]. */
function parseConfs(spec: string | readonly string[] | null): Membership[] {
  if (!spec) return [];
  return (Array.isArray(spec) ? spec : [spec]).map((s) => {
    const [conf, range] = s.split(' ');
    const [from, to] = range.split('-').map(Number);
    return [conf as Confederation, from, to ?? null];
  });
}

type NationExtra = Partial<Pick<Nation, 'fifa' | 'group' | 'names' | 'ban' | 'note'>>;

const nation = (
  id: NationId,
  name: string,
  conf: string | readonly string[] | null,
  years: readonly YearSpan[],
  rating: number,
  k: Kit,
  extra: NationExtra = {},
): Nation => {
  const confs = parseConfs(conf);
  const latest = confs[confs.length - 1];
  return {
    id,
    name,
    years,
    confs,
    fifa: confs.length ? Math.max(1904, confs[0][1], years[0][0]) : null,
    rating,
    kit: k,
    group: (latest ? latest[0].toLowerCase() : 'other') as NationGroup,
    ...extra,
  };
};

export const NATIONS: readonly Nation[] = [
  nation('ALB', 'Albania', 'UEFA 1954', [[1946]], 2.5, kit('#e41e20', '#161616', '#e41e20', '#161616')),
  nation('AND', 'Andorra', 'UEFA 1996', [[1996]], 1, kit('#1f4aa8', '#1f4aa8', '#1f4aa8', '#f5d130')),
  nation('ARM', 'Armenia', 'UEFA 1992', [[1992]], 2, kit('#d90012', '#0033a0', '#f2a800', '#f2a800')),
  nation('AUT', 'Austria', 'UEFA 1902', [[1902, 1938], [1945]], 3.5, kit('#e4202c', '#ffffff', '#e4202c', '#ffffff')),
  nation('AZE', 'Azerbaijan', 'UEFA 1994', [[1992]], 2, kit('#1e88c7', '#1e88c7', '#1e88c7', '#e8112d')),
  nation('BLR', 'Belarus', 'UEFA 1993', [[1992]], 2, kit('#c8313e', '#ffffff', '#c8313e', '#4aa657')),
  nation('BEL', 'Belgium', 'UEFA 1904', [[1904]], 4, kit('#e30613', '#e30613', '#e30613', '#fcd116')),
  nation('BIH', 'Bosnia and Herzegovina', 'UEFA 1998', [[1995]], 2.5, kit('#1c3f94', '#1c3f94', '#1c3f94', '#fecb00')),
  nation('BUL', 'Bulgaria', 'UEFA 1924', [[1924]], 2.5, kit('#ffffff', '#00966e', '#d62612', '#00966e')),
  nation('CRO', 'Croatia', 'UEFA 1993', [[1940, 1944], [1990]], 4, kit('#ffffff', '#ffffff', '#171796', '#171796', 'checks', '#e21b23')),
  nation('CYP', 'Cyprus', 'UEFA 1962', [[1949]], 1.5, kit('#1d4fa3', '#ffffff', '#1d4fa3', '#ffffff')),
  nation('CZE', 'Czech Republic', 'UEFA 1994', [[1994]], 3.5, kit('#d7141a', '#ffffff', '#11457e', '#ffffff'), {
    names: [
      [1994, 'Czech Republic'],
      [2022, 'Czechia'],
    ],
  }),
  nation('DEN', 'Denmark', 'UEFA 1908', [[1908]], 3.5, kit('#c8102e', '#ffffff', '#c8102e', '#ffffff')),
  nation('ENG', 'England', 'UEFA 1872', [[1872]], 4.5, kit('#f4f4f4', '#14224a', '#f4f4f4', '#cf142b'), { fifa: 1946 }),
  nation('EST', 'Estonia', 'UEFA 1920', [[1920, 1940], [1991]], 1.5, kit('#0072ce', '#111111', '#ffffff', '#ffffff')),
  nation('FRO', 'Faroe Islands', 'UEFA 1990', [[1988]], 1.5, kit('#ffffff', '#1a4fa0', '#ffffff', '#e2231a')),
  nation('FIN', 'Finland', 'UEFA 1911', [[1911]], 2.5, kit('#ffffff', '#15368b', '#ffffff', '#15368b')),
  nation('FRA', 'France', 'UEFA 1904', [[1904]], 5, kit('#1d3c87', '#ffffff', '#e1000f', '#ffffff')),
  nation('GEO', 'Georgia', 'UEFA 1992', [[1990]], 3, kit('#ffffff', '#ffffff', '#ffffff', '#da291c')),
  nation('GER', 'Germany', 'UEFA 1908', [[1908, 1942], [1991]], 5, kit('#f4f4f4', '#111111', '#f4f4f4', '#111111')),
  nation('GIB', 'Gibraltar', 'UEFA 2013', [[2013]], 1, kit('#da000c', '#ffffff', '#da000c', '#ffffff')),
  nation('GRE', 'Greece', 'UEFA 1929', [[1929]], 3, kit('#0d5eaf', '#0d5eaf', '#0d5eaf', '#ffffff')),
  nation('HUN', 'Hungary', 'UEFA 1902', [[1902]], 3, kit('#cd2a3e', '#ffffff', '#436f4d', '#ffffff')),
  nation('ISL', 'Iceland', 'UEFA 1954', [[1946]], 2.5, kit('#02529c', '#02529c', '#02529c', '#dc1e35')),
  nation('ISR', 'Israel', ['AFC 1954-1974', 'UEFA 1994'], [[1948]], 2.5, kit('#0038b8', '#ffffff', '#0038b8', '#ffffff')),
  nation('ITA', 'Italy', 'UEFA 1910', [[1910]], 4.5, kit('#1f5fbf', '#ffffff', '#1f5fbf', '#ffffff')),
  nation('KAZ', 'Kazakhstan', ['AFC 1994-2001', 'UEFA 2002'], [[1992]], 2, kit('#00afca', '#00afca', '#00afca', '#fec50c')),
  nation('KOS', 'Kosovo', 'UEFA 2016', [[2014]], 2, kit('#244aa5', '#244aa5', '#244aa5', '#d0a650')),
  nation('LVA', 'Latvia', 'UEFA 1922', [[1922, 1940], [1991]], 1.5, kit('#9e3039', '#ffffff', '#9e3039', '#ffffff')),
  nation('LIE', 'Liechtenstein', 'UEFA 1974', [[1974]], 1, kit('#002b7f', '#ce1126', '#002b7f', '#ffd83d')),
  nation('LTU', 'Lithuania', 'UEFA 1923', [[1923, 1940], [1990]], 1.5, kit('#fdb913', '#006a44', '#fdb913', '#006a44')),
  nation('LUX', 'Luxembourg', 'UEFA 1911', [[1911]], 2, kit('#ef3340', '#ffffff', '#ef3340', '#00a3e0')),
  nation('MLT', 'Malta', 'UEFA 1960', [[1957]], 1, kit('#cf142b', '#ffffff', '#cf142b', '#ffffff')),
  nation('MDA', 'Moldova', 'UEFA 1993', [[1991]], 1.5, kit('#0046ae', '#0046ae', '#0046ae', '#ffd200')),
  nation('MNE', 'Montenegro', 'UEFA 2007', [[2007]], 2, kit('#c40308', '#c40308', '#c40308', '#d4af37')),
  nation('NED', 'Netherlands', 'UEFA 1905', [[1905]], 4.5, kit('#f36c21', '#ffffff', '#f36c21', '#1e1e1e')),
  nation('MKD', 'North Macedonia', 'UEFA 1994', [[1993]], 2, kit('#d20000', '#d20000', '#d20000', '#ffe600'), {
    names: [
      [1993, 'FYR Macedonia'],
      [2019, 'North Macedonia'],
    ],
  }),
  nation('NIR', 'Northern Ireland', 'UEFA 1950', [[1950]], 2.5, kit('#00843d', '#ffffff', '#00843d', '#ffffff'), { fifa: 1946 }),
  nation('NOR', 'Norway', 'UEFA 1908', [[1908]], 3.5, kit('#ba0c2f', '#ffffff', '#00205b', '#ffffff')),
  nation('POL', 'Poland', 'UEFA 1921', [[1921]], 3.5, kit('#ffffff', '#dc143c', '#ffffff', '#dc143c')),
  nation('POR', 'Portugal', 'UEFA 1921', [[1921]], 4.5, kit('#c8102e', '#046a38', '#c8102e', '#f4c430')),
  nation('IRL', 'Republic of Ireland', 'UEFA 1924', [[1924]], 3, kit('#169b62', '#ffffff', '#169b62', '#ff883e'), {
    names: [
      [1924, 'Irish Free State'],
      [1937, 'Ireland (FAI)'],
      [1954, 'Republic of Ireland'],
    ],
  }),
  nation('ROU', 'Romania', 'UEFA 1922', [[1922]], 3, kit('#fcd116', '#002b7f', '#ce1126', '#002b7f')),
  nation('RUS', 'Russia', 'UEFA 1992', [[1992]], 3.5, kit('#ffffff', '#0039a6', '#d52b1e', '#d52b1e'), {
    ban: 2022,
    note: 'Suspended from UEFA competitions since 2022',
  }),
  nation('SMR', 'San Marino', 'UEFA 1988', [[1986]], 1, kit('#5eb6e4', '#5eb6e4', '#5eb6e4', '#ffffff')),
  nation('SCO', 'Scotland', 'UEFA 1872', [[1872]], 3, kit('#0b2a5b', '#ffffff', '#0b2a5b', '#ffffff'), { fifa: 1946 }),
  nation('SRB', 'Serbia', 'UEFA 2006', [[2006]], 3.5, kit('#c6363c', '#0c4076', '#ffffff', '#ffffff')),
  nation('SVK', 'Slovakia', 'UEFA 1993', [[1939, 1944], [1994]], 3, kit('#0b4ea2', '#0b4ea2', '#0b4ea2', '#ee1c25')),
  nation('SVN', 'Slovenia', 'UEFA 1992', [[1992]], 3, kit('#ffffff', '#ffffff', '#ffffff', '#1f9d55')),
  nation('ESP', 'Spain', 'UEFA 1920', [[1920]], 5, kit('#c60b1e', '#1b3a8c', '#c60b1e', '#f1bf00')),
  nation('SWE', 'Sweden', 'UEFA 1908', [[1908]], 3.5, kit('#fecc00', '#006aa7', '#fecc00', '#006aa7')),
  nation('SUI', 'Switzerland', 'UEFA 1905', [[1905]], 3.5, kit('#d52b1e', '#ffffff', '#d52b1e', '#ffffff')),
  nation('TUR', 'Turkey', 'UEFA 1923', [[1923]], 3.5, kit('#e30a17', '#ffffff', '#e30a17', '#ffffff'), {
    names: [
      [1923, 'Turkey'],
      [2022, 'Türkiye'],
    ],
  }),
  nation('UKR', 'Ukraine', 'UEFA 1992', [[1992]], 3.5, kit('#ffd500', '#ffd500', '#ffd500', '#005bbb')),
  nation('WAL', 'Wales', 'UEFA 1876', [[1876]], 3, kit('#c8102e', '#c8102e', '#c8102e', '#ffffff'), { fifa: 1946 }),

  // Nations that no longer exist
  nation('URS', 'Soviet Union', 'UEFA 1924', [[1924, 1991]], 4.5, kit('#cc0000', '#ffffff', '#cc0000', '#ffffff'), { group: 'former', fifa: 1946 }),
  nation('CIS', 'CIS', 'UEFA 1992', [[1992, 1992]], 3.5, kit('#ffffff', '#1c3f94', '#cc0000', '#1c3f94'), {
    group: 'former',
    note: 'Commonwealth of Independent States, EURO 1992 only',
  }),
  nation('YUG', 'Yugoslavia', 'UEFA 1920', [[1920, 1991]], 4, kit('#0c4077', '#ffffff', '#de0000', '#ffffff'), { group: 'former' }),
  nation('SCG', 'Serbia and Montenegro', 'UEFA 1996', [[1994, 2006]], 3.5, kit('#0c4077', '#ffffff', '#de0000', '#ffffff'), {
    group: 'former',
    names: [
      [1994, 'FR Yugoslavia'],
      [2003, 'Serbia & Montenegro'],
    ],
  }),
  nation('TCH', 'Czechoslovakia', 'UEFA 1920', [[1920, 1993]], 4, kit('#d7141a', '#ffffff', '#11457e', '#ffffff'), { group: 'former' }),
  nation('GDR', 'East Germany', 'UEFA 1952', [[1952, 1990]], 3, kit('#1560bd', '#ffffff', '#1560bd', '#ffffff'), { group: 'former' }),
  nation('FRG', 'West Germany', 'UEFA 1950', [[1950, 1990]], 5, kit('#f4f4f4', '#111111', '#f4f4f4', '#111111'), { group: 'former' }),
  nation('SAA', 'Saarland', 'UEFA 1950', [[1950, 1956]], 1.5, kit('#1d4fa3', '#ffffff', '#1d4fa3', '#e2231a'), { group: 'former' }),
  nation('IRE', 'Ireland (IFA)', 'UEFA 1882', [[1882, 1949]], 2.5, kit('#6fa8dc', '#ffffff', '#6fa8dc', '#ffffff'), {
    fifa: 1946,
    group: 'former',
    note: 'All-Ireland team of the Irish FA, succeeded by Northern Ireland',
  }),
  nation('BOH', 'Bohemia', 'UEFA 1903', [[1903, 1908]], 2, kit('#ffffff', '#e3000f', '#ffffff', '#e3000f'), { group: 'former' }),
  nation('RUE', 'Russian Empire', 'UEFA 1912', [[1912, 1914]], 1.5, kit('#ffffff', '#1c3f94', '#d52b1e', '#d4af37'), { group: 'former' }),

  // European teams outside UEFA
  nation(
    'GBR',
    'Great Britain',
    null,
    [
      [1900, 1972],
      [2012, 2012],
      [2020, 2021],
    ],
    3.5,
    kit('#ffffff', '#012169', '#ffffff', '#c8102e'),
    {
      group: 'other',
      note: 'Olympic football team',
    },
  ),
  nation('EUA', 'United Team of Germany', null, [[1956, 1964]], 4, kit('#ffffff', '#111111', '#ffffff', '#dd0000'), {
    group: 'other',
    note: 'Olympic football team',
  }),
  nation('MON', 'Monaco', null, [[2000]], 1, kit('#ffffff', '#e2231a', '#e2231a', '#e2231a', 'sash', '#e2231a'), {
    group: 'other',
    note: 'Non-FIFA team',
  }),
  nation('VAT', 'Vatican City', null, [[2002]], 1, kit('#ffe000', '#ffffff', '#ffe000', '#ffffff', 'halves', '#ffffff'), {
    group: 'other',
    note: 'Non-FIFA team',
  }),

  // ─── South America (CONMEBOL) ──────────────────────────────────────────────
  nation('ARG', 'Argentina', 'CONMEBOL 1916', [[1901]], 5, kit('#ffffff', '#161616', '#ffffff', '#6cace4', 'stripes', '#6cace4'), { fifa: 1912 }),
  nation('BOL', 'Bolivia', 'CONMEBOL 1926', [[1926]], 2, kit('#007a33', '#ffffff', '#007a33', '#ffd100')),
  nation('BRA', 'Brazil', 'CONMEBOL 1916', [[1914]], 5, kit('#ffdf00', '#1f4aa8', '#ffffff', '#009c3b'), { fifa: 1923 }),
  nation('CHI', 'Chile', 'CONMEBOL 1916', [[1910]], 3, kit('#d52b1e', '#1f4aa8', '#ffffff', '#ffffff'), { fifa: 1913 }),
  nation('COL', 'Colombia', 'CONMEBOL 1936', [[1938]], 4, kit('#fcd116', '#003893', '#ce1126', '#003893')),
  nation('ECU', 'Ecuador', 'CONMEBOL 1927', [[1938]], 3.5, kit('#ffd100', '#034ea2', '#ed1c24', '#034ea2'), { fifa: 1926 }),
  nation('PAR', 'Paraguay', 'CONMEBOL 1921', [[1919]], 3, kit('#ffffff', '#1f4aa8', '#1f4aa8', '#d52b1e', 'stripes', '#d52b1e'), { fifa: 1925 }),
  nation('PER', 'Peru', 'CONMEBOL 1925', [[1927]], 3, kit('#ffffff', '#ffffff', '#ffffff', '#d91023', 'sash', '#d91023'), { fifa: 1924 }),
  nation('URU', 'Uruguay', 'CONMEBOL 1916', [[1901]], 4, kit('#5cbfeb', '#161616', '#161616', '#ffffff'), { fifa: 1923 }),
  nation('VEN', 'Venezuela', 'CONMEBOL 1952', [[1938]], 2.5, kit('#7b1c2e', '#ffffff', '#ffffff', '#fcd116')),

  // ─── North & Central America, Caribbean (CONCACAF) ─────────────────────────
  nation('AIA', 'Anguilla', 'CONCACAF 1996', [[1991]], 1, kit('#0f6fc6', '#ffffff', '#0f6fc6', '#f39c12')),
  nation('ATG', 'Antigua and Barbuda', 'CONCACAF 1972', [[1972]], 1.5, kit('#fcd116', '#161616', '#ce1126', '#161616'), { fifa: 1970 }),
  nation('ARU', 'Aruba', 'CONCACAF 1988', [[1986]], 1, kit('#fcdf00', '#418fde', '#418fde', '#418fde')),
  nation('BAH', 'Bahamas', 'CONCACAF 1967', [[1970]], 1, kit('#fae042', '#00abc9', '#fae042', '#161616'), { fifa: 1968 }),
  nation('BRB', 'Barbados', 'CONCACAF 1968', [[1929]], 1.5, kit('#ffc726', '#00267f', '#ffc726', '#00267f')),
  nation('BLZ', 'Belize', 'CONCACAF 1986', [[1986]], 1.5, kit('#ce1126', '#ffffff', '#ce1126', '#003f87')),
  nation('BER', 'Bermuda', 'CONCACAF 1966', [[1964]], 1.5, kit('#1f4aa8', '#ffffff', '#1f4aa8', '#c8102e'), { fifa: 1962 }),
  nation('VGB', 'British Virgin Islands', 'CONCACAF 1996', [[1991]], 1, kit('#006b3f', '#ffffff', '#006b3f', '#fcd116')),
  nation('CAN', 'Canada', 'CONCACAF 1961', [[1904]], 3.5, kit('#d80621', '#d80621', '#d80621', '#ffffff'), { fifa: 1912 }),
  nation('CAY', 'Cayman Islands', 'CONCACAF 1993', [[1966]], 1, kit('#c8102e', '#ffffff', '#c8102e', '#1f4aa8'), { fifa: 1992 }),
  nation('CRC', 'Costa Rica', 'CONCACAF 1961', [[1921]], 3, kit('#ce1126', '#1f4aa8', '#ffffff', '#ffffff'), { fifa: 1927 }),
  nation('CUB', 'Cuba', 'CONCACAF 1961', [[1930]], 1.5, kit('#cf142b', '#ffffff', '#cf142b', '#002a8f'), { fifa: 1929 }),
  nation('CUW', 'Curaçao', 'CONCACAF 1961', [[1921]], 2.5, kit('#1f4aa8', '#1f4aa8', '#1f4aa8', '#f9e814'), {
    names: [
      [1921, 'Curaçao'],
      [1958, 'Netherlands Antilles'],
      [2011, 'Curaçao'],
    ],
    fifa: 1932,
  }),
  nation('DMA', 'Dominica', 'CONCACAF 1994', [[1932]], 1, kit('#006b3f', '#161616', '#006b3f', '#fcd116')),
  nation('DOM', 'Dominican Republic', 'CONCACAF 1964', [[1967]], 1.5, kit('#002d62', '#ffffff', '#ce1126', '#ce1126'), { fifa: 1958 }),
  nation('SLV', 'El Salvador', 'CONCACAF 1961', [[1921]], 2, kit('#0f47af', '#0f47af', '#0f47af', '#ffffff'), { fifa: 1938 }),
  nation('GRN', 'Grenada', 'CONCACAF 1978', [[1975]], 1, kit('#007a5e', '#fcd116', '#ce1126', '#fcd116')),
  nation('GUA', 'Guatemala', 'CONCACAF 1961', [[1921]], 2, kit('#ffffff', '#4997d0', '#ffffff', '#4997d0'), { fifa: 1946 }),
  nation('GUY', 'Guyana', 'CONCACAF 1969', [[1921]], 1.5, kit('#fcd116', '#009e49', '#fcd116', '#ce1126'), { fifa: 1970 }),
  nation('HAI', 'Haiti', 'CONCACAF 1961', [[1925]], 2, kit('#00209f', '#d21034', '#00209f', '#ffffff'), { fifa: 1934 }),
  nation('HON', 'Honduras', 'CONCACAF 1961', [[1921]], 2.5, kit('#ffffff', '#ffffff', '#ffffff', '#00bce4'), { fifa: 1946 }),
  nation('JAM', 'Jamaica', 'CONCACAF 1965', [[1925]], 2.5, kit('#fed100', '#161616', '#fed100', '#009b3a'), { fifa: 1962 }),
  nation('MEX', 'Mexico', 'CONCACAF 1961', [[1923]], 3.5, kit('#006847', '#ffffff', '#ce1126', '#ffffff'), { fifa: 1929 }),
  nation('MSR', 'Montserrat', 'CONCACAF 1996', [[1991]], 1, kit('#009e60', '#ffffff', '#009e60', '#161616')),
  nation('NCA', 'Nicaragua', 'CONCACAF 1968', [[1929]], 1.5, kit('#0067c6', '#ffffff', '#0067c6', '#ffffff'), { fifa: 1950 }),
  nation('PAN', 'Panama', 'CONCACAF 1961', [[1937]], 2.5, kit('#d21034', '#ffffff', '#d21034', '#005293'), { fifa: 1938 }),
  nation('PUR', 'Puerto Rico', 'CONCACAF 1962', [[1940]], 1.5, kit('#ed0a3f', '#0050f0', '#ed0a3f', '#ffffff'), { fifa: 1960 }),
  nation('SKN', 'Saint Kitts and Nevis', 'CONCACAF 1992', [[1938]], 1.5, kit('#009e49', '#ce1126', '#009e49', '#fcd116')),
  nation('LCA', 'Saint Lucia', 'CONCACAF 1988', [[1938]], 1, kit('#66ccff', '#ffffff', '#66ccff', '#fcd116')),
  nation('VIN', 'Saint Vincent and the Grenadines', 'CONCACAF 1988', [[1979]], 1, kit('#fcd116', '#0072c6', '#009e60', '#009e60')),
  nation('SUR', 'Suriname', 'CONCACAF 1961', [[1921]], 2, kit('#b40a2d', '#ffffff', '#b40a2d', '#377e3f'), { fifa: 1929 }),
  nation('TRI', 'Trinidad and Tobago', 'CONCACAF 1964', [[1905]], 2, kit('#da1a35', '#161616', '#da1a35', '#ffffff')),
  nation('TCA', 'Turks and Caicos Islands', 'CONCACAF 1996', [[1999]], 1, kit('#ffffff', '#1f4aa8', '#ffffff', '#1f4aa8'), { fifa: 1998 }),
  nation('USA', 'United States', 'CONCACAF 1961', [[1916]], 3.5, kit('#ffffff', '#1f2a5a', '#ffffff', '#c8102e'), { fifa: 1914 }),
  nation('VIR', 'US Virgin Islands', 'CONCACAF 1987', [[1998]], 1, kit('#ffffff', '#1f4aa8', '#ffffff', '#fcd116'), { fifa: 1998 }),
  nation('BOE', 'Bonaire', 'CONCACAF 2013', [[1960]], 1, kit('#fcd116', '#1f4aa8', '#fcd116', '#1f4aa8'), { fifa: null }),
  nation('GUF', 'French Guiana', 'CONCACAF 1978', [[1936]], 1.5, kit('#fcd116', '#009e49', '#fcd116', '#009e49'), { fifa: null }),
  nation('GLP', 'Guadeloupe', 'CONCACAF 1987', [[1948]], 2, kit('#d52b1e', '#1f4aa8', '#d52b1e', '#fcd116'), { fifa: null }),
  nation('MTQ', 'Martinique', 'CONCACAF 1983', [[1938]], 2, kit('#ffffff', '#ffffff', '#ffffff', '#009e49'), { fifa: null }),
  nation('SMN', 'Saint Martin', 'CONCACAF 2002', [[1995]], 1, kit('#ffffff', '#1f4aa8', '#ffffff', '#d52b1e'), { fifa: null }),
  nation('SXM', 'Sint Maarten', 'CONCACAF 2013', [[1987]], 1, kit('#ed2939', '#1f4aa8', '#ed2939', '#ffffff'), { fifa: null }),

  // ─── Asia (AFC) ──────────────────────────────────────────────────────────
  nation('AFG', 'Afghanistan', 'AFC 1954', [[1941]], 1.5, kit('#d32011', '#ffffff', '#d32011', '#007a36'), { fifa: 1948 }),
  nation('AUS', 'Australia', ['OFC 1966-2005', 'AFC 2006'], [[1922]], 3, kit('#ffcd00', '#00843d', '#ffcd00', '#00843d'), { fifa: 1963 }),
  nation('BHR', 'Bahrain', 'AFC 1969', [[1966]], 2.5, kit('#ce1126', '#ffffff', '#ce1126', '#ffffff'), { fifa: 1968 }),
  nation('BAN', 'Bangladesh', 'AFC 1974', [[1973]], 1, kit('#006a4e', '#ffffff', '#006a4e', '#f42a41'), { fifa: 1976 }),
  nation('BHU', 'Bhutan', 'AFC 1993', [[1982]], 1, kit('#ffcc33', '#ff6600', '#ffcc33', '#ff6600'), { fifa: 2000 }),
  nation('BRU', 'Brunei', 'AFC 1970', [[1971]], 1, kit('#f7e017', '#161616', '#f7e017', '#161616'), { fifa: 1972 }),
  nation('CAM', 'Cambodia', 'AFC 1954', [[1953]], 1, kit('#032ea1', '#032ea1', '#032ea1', '#e00025'), {
    names: [
      [1953, 'Cambodia'],
      [1970, 'Khmer Republic'],
      [1976, 'Cambodia'],
    ],
  }),
  nation('CHN', 'China', 'AFC 1974', [[1949]], 2.5, kit('#ee1c25', '#ee1c25', '#ee1c25', '#ffff00'), { fifa: 1979 }),
  nation('TPE', 'Chinese Taipei', ['AFC 1954-1974', 'OFC 1975-1989', 'AFC 1990'], [[1954]], 1.5, kit('#1f4aa8', '#ffffff', '#1f4aa8', '#fe0000'), {
    names: [
      [1954, 'Republic of China'],
      [1980, 'Chinese Taipei'],
    ],
  }),
  nation('GUM', 'Guam', 'AFC 1996', [[1975]], 1, kit('#00297b', '#00297b', '#00297b', '#c62139')),
  nation('HKG', 'Hong Kong', 'AFC 1954', [[1949]], 1.5, kit('#de2910', '#ffffff', '#de2910', '#ffffff')),
  nation('IND', 'India', 'AFC 1954', [[1948]], 1.5, kit('#1f4aa8', '#ffffff', '#1f4aa8', '#ff9933')),
  nation('IDN', 'Indonesia', 'AFC 1954', [[1950]], 2, kit('#ce1126', '#ffffff', '#ce1126', '#ffffff'), { fifa: 1952 }),
  nation('IRN', 'Iran', 'AFC 1958', [[1941]], 3.5, kit('#ffffff', '#ffffff', '#ffffff', '#da0000'), { fifa: 1948 }),
  nation('IRQ', 'Iraq', 'AFC 1970', [[1951]], 2.5, kit('#ffffff', '#ffffff', '#ffffff', '#007a3d'), { fifa: 1950 }),
  nation('JPN', 'Japan', 'AFC 1954', [[1917]], 4, kit('#1a237e', '#ffffff', '#1a237e', '#ffffff'), { fifa: 1929 }),
  nation('JOR', 'Jordan', 'AFC 1970', [[1953]], 2.5, kit('#ffffff', '#ffffff', '#ffffff', '#ce1126'), { fifa: 1956 }),
  nation('PRK', 'North Korea', 'AFC 1974', [[1946]], 2, kit('#ed1c27', '#ffffff', '#ed1c27', '#024fa2'), { fifa: 1958 }),
  nation('KOR', 'South Korea', 'AFC 1954', [[1948]], 3.5, kit('#e4002b', '#161616', '#e4002b', '#ffffff')),
  nation('KUW', 'Kuwait', 'AFC 1964', [[1961]], 2, kit('#1f4aa8', '#ffffff', '#1f4aa8', '#ffffff')),
  nation('KGZ', 'Kyrgyzstan', 'AFC 1994', [[1992]], 2, kit('#e8112d', '#e8112d', '#e8112d', '#ffef00')),
  nation('LAO', 'Laos', 'AFC 1980', [[1952]], 1, kit('#ce1126', '#002868', '#ce1126', '#ffffff'), { fifa: 1952 }),
  nation('LBN', 'Lebanon', 'AFC 1964', [[1940]], 2, kit('#ed1c24', '#ffffff', '#ed1c24', '#00a651'), { fifa: 1936 }),
  nation('MAC', 'Macau', 'AFC 1978', [[1949]], 1, kit('#00785e', '#ffffff', '#00785e', '#ffffff')),
  nation('MAS', 'Malaysia', 'AFC 1954', [[1953]], 2, kit('#ffcc00', '#161616', '#ffcc00', '#161616'), {
    names: [
      [1953, 'Malaya'],
      [1963, 'Malaysia'],
    ],
  }),
  nation('MDV', 'Maldives', 'AFC 1984', [[1979]], 1, kit('#d21034', '#ffffff', '#d21034', '#007e3a'), { fifa: 1986 }),
  nation('MNG', 'Mongolia', 'AFC 1993', [[1960]], 1, kit('#c4272f', '#c4272f', '#c4272f', '#015197'), { fifa: 1998 }),
  nation('MYA', 'Myanmar', 'AFC 1954', [[1947]], 1.5, kit('#ea2839', '#ffffff', '#ea2839', '#fecb00'), {
    names: [
      [1947, 'Burma'],
      [1989, 'Myanmar'],
    ],
    fifa: 1948,
  }),
  nation('NEP', 'Nepal', 'AFC 1971', [[1972]], 1, kit('#dc143c', '#003893', '#dc143c', '#ffffff')),
  nation('OMA', 'Oman', 'AFC 1979', [[1965]], 2, kit('#db161b', '#ffffff', '#db161b', '#ffffff'), { fifa: 1980 }),
  nation('PAK', 'Pakistan', 'AFC 1954', [[1950]], 1, kit('#01411c', '#ffffff', '#01411c', '#ffffff'), { fifa: 1948 }),
  nation('PLE', 'Palestine', 'AFC 1998', [[1953]], 2, kit('#ce1126', '#161616', '#ce1126', '#ffffff')),
  nation('PHI', 'Philippines', 'AFC 1954', [[1913]], 1.5, kit('#0038a8', '#0038a8', '#0038a8', '#fcd116'), { fifa: 1930 }),
  nation('QAT', 'Qatar', 'AFC 1970', [[1970]], 3, kit('#8a1538', '#ffffff', '#8a1538', '#ffffff'), { fifa: 1972 }),
  nation('KSA', 'Saudi Arabia', 'AFC 1972', [[1957]], 3, kit('#ffffff', '#ffffff', '#ffffff', '#006c35'), { fifa: 1956 }),
  nation('SGP', 'Singapore', 'AFC 1954', [[1948]], 1.5, kit('#ef3340', '#ffffff', '#ef3340', '#ffffff'), { fifa: 1952 }),
  nation('SRI', 'Sri Lanka', 'AFC 1954', [[1952]], 1, kit('#8d153a', '#ffffff', '#8d153a', '#ffb700'), {
    names: [
      [1952, 'Ceylon'],
      [1972, 'Sri Lanka'],
    ],
  }),
  nation('SYR', 'Syria', 'AFC 1970', [[1949]], 2, kit('#ce1126', '#ffffff', '#ce1126', '#007a3d'), { fifa: 1937 }),
  nation('TJK', 'Tajikistan', 'AFC 1994', [[1992]], 2, kit('#ffffff', '#ffffff', '#ffffff', '#cc0000')),
  nation('THA', 'Thailand', 'AFC 1957', [[1915]], 2, kit('#20306e', '#20306e', '#20306e', '#ffffff'), { fifa: 1925 }),
  nation('TLS', 'Timor-Leste', 'AFC 2005', [[2003]], 1, kit('#dc241f', '#161616', '#dc241f', '#ffc726')),
  nation('TKM', 'Turkmenistan', 'AFC 1994', [[1992]], 1.5, kit('#00843d', '#ffffff', '#00843d', '#ffffff')),
  nation('UAE', 'United Arab Emirates', 'AFC 1974', [[1972]], 2.5, kit('#ffffff', '#ffffff', '#ffffff', '#ff0000'), { fifa: 1972 }),
  nation('UZB', 'Uzbekistan', 'AFC 1994', [[1992]], 3, kit('#ffffff', '#ffffff', '#ffffff', '#0099b5')),
  nation('VIE', 'Vietnam', 'AFC 1978', [[1976]], 2, kit('#da251d', '#da251d', '#da251d', '#ffff00')),
  nation('YEM', 'Yemen', 'AFC 1990', [[1990]], 1.5, kit('#ce1126', '#ffffff', '#ce1126', '#161616')),
  nation('NMI', 'Northern Mariana Islands', 'AFC 2020', [[2007]], 1, kit('#0071bc', '#ffffff', '#0071bc', '#ffffff'), { fifa: null }),

  // ─── Africa (CAF) ────────────────────────────────────────────────────────
  nation('ALG', 'Algeria', 'CAF 1964', [[1962]], 3.5, kit('#ffffff', '#ffffff', '#ffffff', '#006233')),
  nation('ANG', 'Angola', 'CAF 1980', [[1976]], 2.5, kit('#cc092f', '#161616', '#cc092f', '#ffcb00')),
  nation('BEN', 'Benin', 'CAF 1969', [[1959]], 2, kit('#fcd116', '#008751', '#fcd116', '#e8112d'), {
    names: [
      [1959, 'Dahomey'],
      [1975, 'Benin'],
    ],
    fifa: 1962,
  }),
  nation('BOT', 'Botswana', 'CAF 1976', [[1968]], 1.5, kit('#75aadb', '#161616', '#75aadb', '#ffffff'), { fifa: 1978 }),
  nation('BFA', 'Burkina Faso', 'CAF 1964', [[1960]], 2.5, kit('#009e49', '#ffffff', '#009e49', '#ef2b2d'), {
    names: [
      [1960, 'Upper Volta'],
      [1984, 'Burkina Faso'],
    ],
  }),
  nation('BDI', 'Burundi', 'CAF 1972', [[1962]], 1.5, kit('#ce1126', '#ffffff', '#1eb53a', '#1eb53a')),
  nation('CMR', 'Cameroon', 'CAF 1963', [[1956]], 3, kit('#007a5e', '#ce1126', '#fcd116', '#fcd116'), { fifa: 1962 }),
  nation('CPV', 'Cape Verde', 'CAF 1986', [[1978]], 2.5, kit('#003893', '#ffffff', '#003893', '#cf2027')),
  nation('CTA', 'Central African Republic', 'CAF 1965', [[1960]], 1.5, kit('#003082', '#ffffff', '#003082', '#ffce00'), { fifa: 1964 }),
  nation('CHA', 'Chad', 'CAF 1964', [[1960]], 1, kit('#002664', '#fecb00', '#c60c30', '#fecb00')),
  nation('COM', 'Comoros', 'CAF 2005', [[1979]], 1.5, kit('#3a9d23', '#ffffff', '#3a9d23', '#ffc61e')),
  nation('CGO', 'Congo', 'CAF 1966', [[1960]], 2, kit('#dc241f', '#dc241f', '#dc241f', '#fbde4a'), { fifa: 1964 }),
  nation('COD', 'DR Congo', 'CAF 1963', [[1957]], 3, kit('#007fff', '#007fff', '#ce1021', '#f7d618'), {
    names: [
      [1957, 'Belgian Congo'],
      [1960, 'Congo-Léopoldville'],
      [1966, 'Congo-Kinshasa'],
      [1971, 'Zaire'],
      [1997, 'DR Congo'],
    ],
    fifa: 1962,
  }),
  nation('DJI', 'Djibouti', 'CAF 1994', [[1983]], 1, kit('#6ab2e7', '#12ad2b', '#6ab2e7', '#ffffff')),
  nation('EGY', 'Egypt', 'CAF 1957', [[1920]], 3.5, kit('#ce1126', '#ffffff', '#161616', '#ffffff'), {
    names: [
      [1920, 'Egypt'],
      [1958, 'United Arab Republic'],
      [1971, 'Egypt'],
    ],
    fifa: 1923,
  }),
  nation('EQG', 'Equatorial Guinea', 'CAF 1986', [[1975]], 2, kit('#e32118', '#0073ce', '#e32118', '#3e9a00')),
  nation('ERI', 'Eritrea', 'CAF 1994', [[1992]], 1, kit('#4189dd', '#ffffff', '#4189dd', '#ea0437'), { fifa: 1998 }),
  nation('SWZ', 'Eswatini', 'CAF 1976', [[1968]], 1.5, kit('#ffd900', '#3e5eb9', '#ffd900', '#b10c0c'), {
    names: [
      [1968, 'Swaziland'],
      [2018, 'Eswatini'],
    ],
    fifa: 1978,
  }),
  nation('ETH', 'Ethiopia', 'CAF 1957', [[1947]], 1.5, kit('#078930', '#fcdd09', '#da121a', '#fcdd09'), { fifa: 1952 }),
  nation('GAB', 'Gabon', 'CAF 1967', [[1960]], 2.5, kit('#fcd116', '#3a75c4', '#009e60', '#009e60'), { fifa: 1966 }),
  nation('GAM', 'Gambia', 'CAF 1962', [[1953]], 2, kit('#ce1126', '#ffffff', '#ce1126', '#0c1c8c'), { fifa: 1968 }),
  nation('GHA', 'Ghana', 'CAF 1958', [[1950]], 3, kit('#ffffff', '#ffffff', '#ffffff', '#161616'), {
    names: [
      [1950, 'Gold Coast'],
      [1957, 'Ghana'],
    ],
    fifa: 1958,
  }),
  nation('GUI', 'Guinea', 'CAF 1962', [[1962]], 2.5, kit('#ce1126', '#fcd116', '#009460', '#fcd116')),
  nation('GNB', 'Guinea-Bissau', 'CAF 1986', [[1976]], 2, kit('#ce1126', '#009e49', '#ce1126', '#fcd116')),
  nation('CIV', 'Ivory Coast', 'CAF 1960', [[1960]], 3.5, kit('#f77f00', '#ffffff', '#009e60', '#009e60'), { fifa: 1964 }),
  nation('KEN', 'Kenya', 'CAF 1968', [[1926]], 2, kit('#bb0000', '#bb0000', '#bb0000', '#006600'), { fifa: 1960 }),
  nation('LES', 'Lesotho', 'CAF 1964', [[1970]], 1.5, kit('#00209f', '#ffffff', '#00209f', '#009543')),
  nation('LBR', 'Liberia', 'CAF 1962', [[1956]], 1.5, kit('#bf0a30', '#ffffff', '#bf0a30', '#002868'), { fifa: 1964 }),
  nation('LBY', 'Libya', 'CAF 1965', [[1953]], 2, kit('#e70013', '#161616', '#e70013', '#239e46'), { fifa: 1964 }),
  nation('MAD', 'Madagascar', 'CAF 1963', [[1947]], 2, kit('#fc3d32', '#ffffff', '#007e3a', '#007e3a'), { fifa: 1964 }),
  nation('MWI', 'Malawi', 'CAF 1968', [[1957]], 1.5, kit('#ce1126', '#ce1126', '#ce1126', '#339e35'), { fifa: 1967 }),
  nation('MLI', 'Mali', 'CAF 1963', [[1960]], 3, kit('#fcd116', '#14b53a', '#ce1126', '#14b53a'), { fifa: 1964 }),
  nation('MTN', 'Mauritania', 'CAF 1968', [[1961]], 2, kit('#00a95c', '#ffd700', '#00a95c', '#d01c1f'), { fifa: 1970 }),
  nation('MRI', 'Mauritius', 'CAF 1962', [[1947]], 1, kit('#ea2839', '#ffffff', '#ea2839', '#1a206d')),
  nation('MAR', 'Morocco', 'CAF 1959', [[1957]], 4, kit('#c1272d', '#006233', '#c1272d', '#006233'), { fifa: 1960 }),
  nation('MOZ', 'Mozambique', 'CAF 1978', [[1975]], 2, kit('#d21034', '#161616', '#d21034', '#fce100'), { fifa: 1980 }),
  nation('NAM', 'Namibia', 'CAF 1990', [[1989]], 1.5, kit('#d21034', '#003580', '#ffffff', '#ffce00')),
  nation('NIG', 'Niger', 'CAF 1967', [[1961]], 1.5, kit('#e05206', '#ffffff', '#0db02b', '#0db02b')),
  nation('NGA', 'Nigeria', 'CAF 1960', [[1949]], 3.5, kit('#008751', '#008751', '#008751', '#ffffff')),
  nation('RWA', 'Rwanda', 'CAF 1976', [[1972]], 1.5, kit('#fad201', '#00a1de', '#20603d', '#20603d'), { fifa: 1978 }),
  nation('STP', 'São Tomé and Príncipe', 'CAF 1986', [[1976]], 1, kit('#12ad2b', '#ffce00', '#12ad2b', '#d21034')),
  nation('SEN', 'Senegal', 'CAF 1963', [[1959]], 4, kit('#ffffff', '#ffffff', '#ffffff', '#00853f'), { fifa: 1964 }),
  nation('SEY', 'Seychelles', 'CAF 1986', [[1976]], 1, kit('#d62828', '#007a3d', '#d62828', '#fcd856')),
  nation('SLE', 'Sierra Leone', 'CAF 1967', [[1949]], 1.5, kit('#1eb53a', '#ffffff', '#0072c6', '#0072c6'), { fifa: 1960 }),
  nation('SOM', 'Somalia', 'CAF 1968', [[1947]], 1, kit('#4189dd', '#ffffff', '#4189dd', '#ffffff'), { fifa: 1962 }),
  nation('RSA', 'South Africa', ['CAF 1957-1958', 'CAF 1992'], [[1906]], 3, kit('#ffb612', '#007a4d', '#ffb612', '#007a4d'), { fifa: 1992 }),
  nation('SSD', 'South Sudan', 'CAF 2012', [[2011]], 1, kit('#ffffff', '#0f47af', '#ffffff', '#da121a')),
  nation('SDN', 'Sudan', 'CAF 1957', [[1948]], 1.5, kit('#d21034', '#ffffff', '#d21034', '#007229')),
  nation('TAN', 'Tanzania', 'CAF 1965', [[1945]], 1.5, kit('#1eb53a', '#00a3dd', '#1eb53a', '#fcd116'), {
    names: [
      [1945, 'Tanganyika'],
      [1964, 'Tanzania'],
    ],
    fifa: 1964,
  }),
  nation('TOG', 'Togo', 'CAF 1963', [[1956]], 2, kit('#ffce00', '#006a4e', '#ffce00', '#d21034'), { fifa: 1964 }),
  nation('TUN', 'Tunisia', 'CAF 1960', [[1956]], 3, kit('#e70013', '#ffffff', '#e70013', '#ffffff')),
  nation('UGA', 'Uganda', 'CAF 1959', [[1924]], 2, kit('#fcdc04', '#161616', '#fcdc04', '#d90000'), { fifa: 1960 }),
  nation('ZAM', 'Zambia', 'CAF 1964', [[1964]], 2, kit('#198a00', '#ffffff', '#198a00', '#ef7d00')),
  nation('ZIM', 'Zimbabwe', 'CAF 1980', [[1980]], 2, kit('#fcd116', '#006400', '#fcd116', '#d40000')),

  // ─── Oceania (OFC) ───────────────────────────────────────────────────────
  nation('ASA', 'American Samoa', 'OFC 1998', [[1983]], 1, kit('#bd1021', '#ffffff', '#bd1021', '#002b7f')),
  nation('COK', 'Cook Islands', 'OFC 1994', [[1971]], 1, kit('#00873f', '#ffffff', '#00873f', '#ffffff')),
  nation('FIJ', 'Fiji', 'OFC 1966', [[1951]], 1.5, kit('#ffffff', '#161616', '#ffffff', '#68bfe5'), { fifa: 1964 }),
  nation('NCL', 'New Caledonia', 'OFC 1969', [[1951]], 1.5, kit('#9aa0a6', '#ed4135', '#9aa0a6', '#0035ad'), { fifa: 2004 }),
  nation('NZL', 'New Zealand', 'OFC 1966', [[1904]], 2.5, kit('#ffffff', '#161616', '#ffffff', '#161616'), { fifa: 1948 }),
  nation('PNG', 'Papua New Guinea', 'OFC 1966', [[1963]], 1, kit('#ce1126', '#161616', '#ce1126', '#fcd116')),
  nation('SAM', 'Samoa', 'OFC 1984', [[1979]], 1, kit('#002b7f', '#ffffff', '#002b7f', '#ce1126'), {
    names: [
      [1979, 'Western Samoa'],
      [1997, 'Samoa'],
    ],
    fifa: 1986,
  }),
  nation('SOL', 'Solomon Islands', 'OFC 1988', [[1963]], 1.5, kit('#0051ba', '#fcd116', '#0051ba', '#215b33')),
  nation('TAH', 'Tahiti', 'OFC 1973', [[1952]], 1.5, kit('#ce1126', '#ffffff', '#ce1126', '#ffffff'), { fifa: 1990 }),
  nation('TGA', 'Tonga', 'OFC 1994', [[1979]], 1, kit('#c10000', '#ffffff', '#c10000', '#ffffff')),
  nation('VAN', 'Vanuatu', 'OFC 1973', [[1951]], 1.5, kit('#fdce12', '#161616', '#fdce12', '#d21034'), {
    names: [
      [1951, 'New Hebrides'],
      [1980, 'Vanuatu'],
    ],
    fifa: 1988,
  }),

  // ─── Teams that no longer exist, beyond Europe ───────────────────────────
  nation('DEI', 'Dutch East Indies', null, [[1934, 1942]], 1, kit('#ff7f00', '#ffffff', '#ff7f00', '#161616'), { group: 'former', fifa: 1934 }),
  nation('RVN', 'South Vietnam', 'AFC 1954-1975', [[1949, 1975]], 1.5, kit('#ffc400', '#ffffff', '#ffc400', '#da251d'), { group: 'former', fifa: 1952 }),
  nation('YMD', 'South Yemen', 'AFC 1970-1990', [[1965, 1990]], 1, kit('#ce1126', '#ffffff', '#ce1126', '#3cb0e0'), { group: 'former' }),
];

export const NATION_BY_ID = new Map(NATIONS.map((n) => [n.id, n]));

export const GROUP_LABELS: Record<NationGroup, string> = {
  uefa: 'Europe (UEFA)',
  conmebol: 'South America (CONMEBOL)',
  concacaf: 'North, Central America & Caribbean (CONCACAF)',
  afc: 'Asia (AFC)',
  caf: 'Africa (CAF)',
  ofc: 'Oceania (OFC)',
  former: 'Teams that no longer exist',
  other: 'Teams outside the confederations',
};

export function getNation(id: NationId): Nation {
  const found = NATION_BY_ID.get(id);
  if (!found) throw new Error(`Unknown nation "${id}"`);
  return found;
}

export function existsIn(nation: Nation, year: number): boolean {
  return nation.years.some(([from, to]) => year >= from && year <= (to ?? Infinity));
}

/** Name the team played under in a given year (Zaire, Burma, Irish Free State, Türkiye…). */
export function nameIn(nation: Nation, year?: number | null): string {
  if (!nation.names || year == null) return nation.name;
  let current = nation.names[0][1];
  for (const [from, name] of nation.names) if (year >= from) current = name;
  return current;
}

const banned = (nation: Nation, year: number): boolean => nation.ban != null && year >= nation.ban;

/** Was the team a member of this confederation in `year`, and able to play? */
export function memberOf(nation: Nation, conf: Confederation, year: number): boolean {
  return nation.confs.some(([c, from, to]) => c === conf && year >= from && year <= (to ?? Infinity)) && existsIn(nation, year) && !banned(nation, year);
}

/** Could the team enter a FIFA competition held in `year`? */
export function fifaMember(nation: Nation, year: number): boolean {
  return nation.fifa != null && nation.fifa <= year && existsIn(nation, year) && !banned(nation, year);
}

/** Could this nation enter a UEFA competition held in `year`? */
export const uefaEligible = (nation: Nation, year: number): boolean => memberOf(nation, 'UEFA', year);

/** The year the data is current to: quick matches draw opponents from teams active now. */
export const CURRENT_YEAR = 2026;

/** Picker section for a nation in a given year: the confederation it belonged to then. */
export function sectionIn(nation: Nation, year: number): NationGroup {
  const conf = nation.confs.find(([, from, to]) => year >= from && year <= (to ?? Infinity));
  return conf ? (conf[0].toLowerCase() as NationGroup) : nation.group;
}

export function activeLabel(nation: Nation): string {
  if (nation.group === 'other') return nation.note ?? 'Outside FIFA';
  return nation.years.map(([from, to]) => (to == null ? `${from}–` : from === to ? `${from}` : `${from}–${to}`)).join(', ');
}
