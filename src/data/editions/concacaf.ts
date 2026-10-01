import type { Edition } from '@/types';
import { ed, upcoming, grouped, split } from './helpers';

/** CONCACAF Championship (1963–89) and its successor, the Gold Cup. */
export const GOLD_CUP: Edition[] = [
  ed(1963, 'SLV', 'CRC SLV CUW HON MEX JAM GUA NCA PAN', { note: 'The first CONCACAF Championship.' }),
  ed(1965, 'GUA', 'MEX GUA CRC SLV CUW HAI'),
  ed(1967, 'HON', 'GUA MEX HON TRI HAI NCA'),
  ed(1969, 'CRC', 'CRC GUA CUW MEX TRI JAM'),
  ed(1971, 'TRI', 'MEX HAI CRC TRI HON CUB'),
  ed(1973, 'HAI', 'HAI TRI MEX HON GUA CUW'),
  ed(1977, 'MEX', 'MEX HAI SLV CAN GUA SUR'),
  ed(1981, 'HON', 'HON SLV MEX CAN CUB HAI'),
  grouped(1985, null, 'CAN HON CRC', ['CAN GUA HAI', 'HON SLV SUR', 'CRC USA TRI'], { hostNote: 'Home and away' }),
  ed(1989, null, 'CRC USA TRI GUA SLV', { hostNote: 'Home and away' }),
  grouped(1991, 'USA', 'USA HON MEX CRC', ['USA CRC TRI GUA', 'HON MEX CAN JAM'], {
    note: 'The first Gold Cup. The United States won the final on penalties.',
  }),
  grouped(1993, 'USA MEX', 'MEX USA CRC JAM', ['USA JAM HON PAN', 'MEX CRC CAN MTQ'], { note: 'Costa Rica and Jamaica shared third place.' }),
  grouped(1996, 'USA', 'MEX BRA USA GUA', ['MEX GUA VIN', 'BRA CAN HON', 'USA SLV TRI'], { note: 'Brazil played as guests.' }),
  grouped(1998, 'USA', 'MEX USA BRA JAM', ['MEX HON TRI', 'BRA JAM GUA SLV', 'USA CRC CUB']),
  grouped(2000, 'USA', 'CAN COL PER TRI', ['USA PER HAI', 'HON COL JAM', 'MEX TRI GUA', 'CRC CAN KOR'], {
    note: 'Canada edged Korea on a coin toss in the group, then won the lot.',
  }),
  ed(2002, 'USA', 'USA CRC CAN KOR MEX SLV MTQ HAI ECU CUB TRI GUA'),
  ed(2003, 'USA MEX', 'MEX BRA USA CRC HON SLV JAM CUB CAN MTQ GUA COL'),
  ed(2005, 'USA', 'USA PAN COL HON MEX CRC JAM RSA CAN CUB TRI GUA', { note: 'The United States won the final on penalties.' }),
  ed(2007, 'USA', 'USA MEX CAN GLP CRC PAN HON GUA HAI SLV CUB TRI'),
  grouped(2009, 'USA', 'MEX USA CRC HON', ['CAN CRC JAM SLV', 'USA HON HAI GRN', 'MEX PAN GLP NCA']),
  grouped(2011, 'USA', 'MEX USA HON PAN', ['MEX CRC SLV CUB', 'JAM HON GUA GRN', 'PAN USA CAN GLP']),
  grouped(2013, 'USA', 'USA PAN HON MEX', ['PAN MEX MTQ CAN', 'HON TRI SLV HAI', 'USA CRC CUB BLZ']),
  grouped(2015, 'USA CAN', 'MEX JAM PAN USA', ['USA HAI PAN HON', 'JAM CRC CAN SLV', 'TRI MEX CUB GUA']),
  grouped(2017, 'USA', 'USA JAM CRC MEX', ['CRC CAN HON GUF', 'USA PAN MTQ NCA', 'MEX JAM SLV CUW']),
  grouped(2019, 'USA CRC JAM', 'MEX USA HAI JAM', ['MEX CAN MTQ CUB', 'HAI CRC BER NCA', 'JAM CUW SLV HON', 'USA PAN TRI GUY']),
  grouped(2021, 'USA', 'USA MEX CAN QAT', ['MEX SLV TRI GUA', 'USA CAN MTQ HAI', 'CRC JAM SUR GLP', 'QAT HON PAN GRN'], {
    note: 'Qatar reached the semi-finals as guests.',
  }),
  grouped(2023, 'USA CAN', 'MEX PAN USA JAM', ['USA JAM TRI SKN', 'QAT MEX HAI HON', 'PAN CRC SLV MTQ', 'GUA CAN CUB GLP']),
  grouped(2025, 'USA CAN', 'MEX USA HON GUA', ['MEX CRC SUR DOM', 'CAN HON SLV CUW', 'PAN GUA JAM GLP', 'USA KSA TRI HAI']),
  upcoming(2027, null),
];

/** CONCACAF Nations League: League A and the finals. Since 2023–24 the top four seeds go straight into the quarter-finals. */
export const CONCACAF_NATIONS_LEAGUE: Edition[] = [
  grouped(2021, 'USA', 'USA MEX HON CRC', ['USA CAN CUB', 'MEX PAN BER', 'HON MTQ TRI', 'CRC HAI CUW'], {
    label: '2019–20',
    note: 'Finals played in 2021. The United States beat Mexico after extra time.',
  }),
  grouped(2023, 'USA', 'USA CAN MEX PAN', ['USA SLV GRN', 'MEX JAM SUR', 'CAN HON CUW', 'PAN CRC MTQ'], { label: '2022–23' }),
  ed(2024, 'USA', 'USA MEX JAM PAN CAN HON TRI CRC', { label: '2023–24', byes: split('USA MEX CAN PAN') }),
  ed(2025, 'USA', 'MEX PAN CAN USA SUR CRC JAM HON', { label: '2024–25', byes: split('MEX PAN CAN USA') }),
  grouped(2027, 'USA', null, ['CRC HAI TRI CUW NCA DOM', 'HON JAM GUA SUR MTQ SLV'], {
    label: '2026–27',
    status: 'upcoming',
    byes: 'CAN MEX PAN USA',
    note: 'League A is under way; the finals are in Los Angeles in March 2027.',
  }),
];

export const W_CHAMPIONSHIP: Edition[] = [
  ed(1991, 'HAI', 'USA CAN', { note: 'The first CONCACAF Women’s Championship.' }),
  ed(1993, 'USA', 'USA NZL CAN TRI', { note: 'New Zealand played as guests.' }),
  ed(1994, 'CAN', 'USA CAN MEX TRI JAM'),
  ed(1998, 'CAN', 'CAN MEX CRC'),
  ed(2000, 'USA', 'USA BRA CAN CHN', { note: 'Brazil and China played as guests.' }),
  ed(2002, 'USA CAN', 'USA CAN MEX CRC'),
  ed(2006, 'USA', 'USA CAN MEX JAM'),
  ed(2010, 'MEX', 'CAN MEX USA CRC'),
  ed(2014, 'USA', 'USA CRC MEX TRI'),
  ed(2018, 'USA', 'USA CAN JAM PAN'),
  ed(2022, 'MEX', 'USA CAN JAM CRC'),
  upcoming(2026, 'USA', {
    field: split('USA SLV JAM CRC CAN PAN MEX HAI'),
    pairs: [
      ['USA', 'SLV'],
      ['JAM', 'CRC'],
      ['CAN', 'PAN'],
      ['MEX', 'HAI'],
    ],
    note: 'Eight teams, straight into the quarter-finals, 27 November to 5 December.',
  }),
];

export const W_GOLD_CUP: Edition[] = [
  grouped(2024, 'USA', 'USA BRA MEX CAN', ['MEX USA ARG DOM', 'CAN CRC PAR SLV', 'BRA COL PAN PUR'], {
    note: 'The first W Gold Cup, with Brazil, Colombia, Argentina and Paraguay as guests.',
  }),
];
