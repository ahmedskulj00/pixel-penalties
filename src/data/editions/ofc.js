import { ed, grouped } from './helpers.js';

export const OFC_NATIONS_CUP = [
  ed(1973, 'NZL', 'NZL TAH NCL FIJ VAN', { note: 'The first Oceania Nations Cup.' }),
  ed(1980, 'NCL', 'AUS TAH NCL FIJ NZL PNG SOL VAN'),
  ed(1996, null, 'AUS TAH NZL SOL', { hostNote: 'Home and away' }),
  ed(1998, 'AUS', 'NZL AUS FIJ TAH COK VAN'),
  ed(2000, 'TAH', 'AUS NZL SOL VAN TAH COK'),
  ed(2002, 'NZL', 'NZL AUS TAH VAN SOL FIJ PNG'),
  ed(2004, 'AUS', 'AUS SOL NZL FIJ TAH VAN', { note: 'Australia’s last Nations Cup before joining the AFC.' }),
  ed(2008, null, 'NZL NCL FIJ VAN', { hostNote: 'Home and away' }),
  ed(2012, 'SOL', 'TAH NCL NZL SOL FIJ VAN SAM PNG', { note: 'Tahiti’s first title.' }),
  ed(2016, 'PNG', 'NZL PNG SOL NCL FIJ VAN SAM TAH', { note: 'New Zealand beat Papua New Guinea on penalties in the final.' }),
  ed(2024, 'VAN', 'NZL VAN TAH FIJ'),
];

export const OFC_WOMENS = [
  ed(1983, 'NCL', 'NZL AUS NCL FIJ', { note: 'The first OFC Women’s Championship.' }),
  ed(1986, 'NZL', 'TPE AUS NZL', { note: 'Chinese Taipei were OFC members at the time.' }),
  ed(1989, 'AUS', 'TPE NZL AUS'),
  ed(1991, 'AUS', 'NZL AUS PNG'),
  ed(1994, 'PNG', 'AUS NZL PNG'),
  ed(1998, 'NZL', 'AUS NZL'),
  ed(2003, 'AUS', 'AUS NZL'),
  ed(2007, 'PNG', 'NZL PNG'),
  ed(2010, 'NZL', 'NZL PNG'),
  ed(2014, 'PNG', 'NZL PNG'),
  ed(2018, 'NCL', 'NZL FIJ'),
  ed(2022, 'FIJ', 'PNG SAM', { note: 'Papua New Guinea’s first title.' }),
  grouped(2025, 'FIJ', 'SOL PNG SAM FIJ', ['PNG SAM TAH COK', 'SOL FIJ VAN TGA'], {
    note: 'Solomon Islands beat Papua New Guinea 3–2 after extra time.',
  }),
];
