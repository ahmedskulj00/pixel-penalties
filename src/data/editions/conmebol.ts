import type { Edition } from '@/types';
import { ed, grouped } from './helpers';

/** Copa América, from the first South American Championship in 1916. */
export const COPA_AMERICA: Edition[] = [
  ed(1916, 'ARG', 'URU ARG BRA CHI', { note: 'The first South American Championship.' }),
  ed(1917, 'URU', 'URU ARG BRA CHI'),
  ed(1919, 'BRA', 'BRA URU ARG CHI', { note: 'Brazil won a play-off against Uruguay.' }),
  ed(1920, 'CHI', 'URU ARG BRA CHI'),
  ed(1921, 'ARG', 'ARG BRA URU PAR'),
  ed(1922, 'BRA', 'BRA PAR URU ARG CHI', { note: 'Brazil won a play-off against Paraguay.' }),
  ed(1923, 'URU', 'URU ARG PAR BRA'),
  ed(1924, 'URU', 'URU ARG PAR CHI'),
  ed(1925, 'ARG', 'ARG BRA PAR'),
  ed(1926, 'CHI', 'URU ARG CHI PAR BOL'),
  ed(1927, 'PER', 'ARG URU PER BOL'),
  ed(1929, 'ARG', 'ARG PAR URU PER'),
  ed(1935, 'PER', 'URU ARG PER CHI'),
  ed(1937, 'ARG', 'ARG BRA URU PAR CHI PER', { note: 'Argentina won a play-off against Brazil.' }),
  ed(1939, 'PER', 'PER URU PAR CHI ECU'),
  ed(1941, 'CHI', 'ARG URU CHI PER ECU'),
  ed(1942, 'URU', 'URU ARG BRA PAR PER CHI ECU'),
  ed(1945, 'CHI', 'ARG BRA CHI URU COL BOL ECU'),
  ed(1946, 'ARG', 'ARG BRA PAR URU CHI BOL'),
  ed(1947, 'ECU', 'ARG PAR URU CHI PER ECU COL BOL'),
  ed(1949, 'BRA', 'BRA PAR PER BOL CHI URU ECU COL', { note: 'Brazil won a play-off against Paraguay.' }),
  ed(1953, 'PER', 'PAR BRA URU CHI PER BOL ECU', { note: 'Paraguay won a play-off against Brazil.' }),
  ed(1955, 'CHI', 'ARG CHI PER URU PAR ECU'),
  ed(1956, 'URU', 'URU CHI ARG BRA PAR PER'),
  ed(1957, 'PER', 'ARG BRA URU PER COL CHI ECU'),
  ed(1959, 'ARG', 'ARG BRA PAR PER CHI URU BOL', { label: '1959 Argentina' }),
  ed(1959, 'ECU', 'URU ARG BRA ECU PAR', { label: '1959 Ecuador', note: 'An extra championship, the second of 1959.' }),
  ed(1963, 'BOL', 'BOL PAR ARG BRA PER ECU COL'),
  ed(1967, 'URU', 'URU ARG CHI PAR VEN BOL'),
  grouped(1975, null, 'PER COL BRA URU', ['BRA ARG VEN', 'PER CHI BOL', 'COL PAR ECU'], {
    byes: 'URU',
    hostNote: 'Home and away',
    note: 'Peru won a play-off in the final against Colombia.',
  }),
  grouped(1979, null, 'PAR CHI BRA PER', ['BRA BOL ARG', 'CHI COL VEN', 'PAR URU ECU'], { byes: 'PER', hostNote: 'Home and away' }),
  grouped(1983, null, 'URU BRA PAR PER', ['URU CHI VEN', 'BRA ARG ECU', 'PER COL BOL'], { byes: 'PAR', hostNote: 'Home and away' }),
  grouped(1987, 'ARG', 'URU CHI COL ARG', ['ARG PER ECU', 'CHI BRA VEN', 'COL PAR BOL'], { byes: 'URU' }),
  grouped(1989, 'BRA', 'BRA URU ARG PAR', ['BRA PAR COL PER VEN', 'URU ARG CHI ECU BOL']),
  grouped(1991, 'CHI', 'ARG BRA CHI COL', ['ARG CHI PAR PER VEN', 'COL BRA URU ECU BOL']),
  grouped(1993, 'ECU', 'ARG MEX COL ECU', ['ECU URU USA VEN', 'COL ARG MEX BOL', 'PER BRA PAR CHI'], {
    note: 'Mexico and the United States joined as the first invited guests.',
  }),
  grouped(1995, 'URU', 'URU BRA COL USA', ['URU PAR MEX VEN', 'BRA COL ECU PER', 'USA ARG BOL CHI'], {
    note: 'Uruguay beat Brazil on penalties in the final.',
  }),
  grouped(1997, 'BOL', 'BRA BOL MEX PER', ['ECU ARG PAR CHI', 'BRA MEX COL CRC', 'BOL PER URU VEN']),
  grouped(1999, 'PAR', 'BRA URU MEX CHI', ['BRA MEX CHI VEN', 'COL ARG URU ECU', 'PAR PER BOL JPN']),
  grouped(2001, 'COL', 'COL MEX HON URU', ['COL CHI ECU VEN', 'BRA MEX PER PAR', 'CRC HON URU BOL'], {
    note: 'Argentina withdrew; Honduras stepped in and reached the semi-finals.',
  }),
  grouped(2004, 'PER', 'BRA ARG URU COL', ['COL PER BOL VEN', 'MEX ARG URU ECU', 'PAR BRA CRC CHI'], {
    note: 'Brazil beat Argentina on penalties in the final.',
  }),
  grouped(2007, 'VEN', 'BRA ARG MEX URU', ['VEN PER URU BOL', 'MEX BRA CHI ECU', 'ARG PAR COL USA']),
  grouped(2011, 'ARG', 'URU PAR PER VEN', ['COL ARG CRC BOL', 'BRA VEN PAR ECU', 'CHI PER URU MEX']),
  grouped(2015, 'CHI', 'CHI ARG PER PAR', ['CHI BOL ECU MEX', 'ARG PAR URU JAM', 'BRA PER COL VEN'], {
    note: 'Chile beat Argentina on penalties in the final.',
  }),
  grouped(2016, 'USA', 'CHI ARG COL USA', ['USA COL CRC PAR', 'PER ECU BRA HAI', 'MEX VEN URU JAM', 'ARG CHI PAN BOL'], {
    label: '2016 Centenario',
    note: 'Chile beat Argentina on penalties in the final, again.',
  }),
  grouped(2019, 'BRA', 'BRA PER ARG CHI', ['BRA VEN PER BOL', 'COL ARG PAR QAT', 'URU CHI JPN ECU']),
  grouped(2021, 'BRA', 'ARG BRA COL PER', ['ARG URU PAR CHI BOL', 'BRA PER COL ECU VEN']),
  grouped(2024, 'USA', 'ARG COL URU CAN', ['ARG CAN CHI PER', 'VEN ECU MEX JAM', 'URU PAN USA BOL', 'COL BRA CRC PAR']),
];

export const COPA_FEMENINA: Edition[] = [
  ed(1991, 'BRA', 'BRA CHI VEN', { note: 'The first Sudamericano Femenino, with three teams.' }),
  ed(1995, 'BRA', 'BRA ARG CHI ECU BOL'),
  ed(1998, 'ARG', 'BRA ARG PER CHI'),
  ed(2003, 'PER', 'BRA ARG'),
  ed(2006, 'ARG', 'ARG BRA PAR'),
  ed(2010, 'ECU', 'BRA COL CHI ARG'),
  ed(2014, 'ECU', 'BRA COL ECU ARG'),
  ed(2018, 'CHI', 'BRA CHI COL ARG'),
  ed(2022, 'COL', 'BRA COL ARG PAR'),
  ed(2025, 'ECU', 'BRA COL ARG URU', { note: 'Brazil beat Colombia on penalties after a 4–4 final.' }),
];
