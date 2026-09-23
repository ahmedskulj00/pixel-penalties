import { ed, upcoming, grouped } from './helpers.js';

export const ASIAN_CUP = [
  ed(1956, 'HKG', 'KOR ISR HKG RVN', { note: 'The first Asian Cup, a four-team round-robin.' }),
  ed(1960, 'KOR', 'KOR ISR TPE RVN'),
  ed(1964, 'ISR', 'ISR IND KOR HKG'),
  ed(1968, 'IRN', 'IRN MYA ISR TPE HKG'),
  ed(1972, 'THA', 'IRN KOR THA CAM IRQ KUW'),
  grouped(1976, 'IRN', 'IRN KUW CHN IRQ', ['KUW CHN MAS', 'IRN IRQ YMD']),
  grouped(1980, 'KUW', 'KUW KOR IRN PRK', ['KOR KUW MAS QAT UAE', 'IRN PRK SYR CHN BAN']),
  ed(1984, 'SGP', 'KSA CHN KUW IRN SYR KOR SGP QAT IND UAE'),
  ed(1988, 'QAT', 'KSA KOR IRN CHN QAT UAE JPN KUW SYR BHR', { note: 'Saudi Arabia beat South Korea on penalties in the final.' }),
  ed(1992, 'JPN', 'JPN KSA CHN UAE IRN PRK THA QAT'),
  ed(1996, 'UAE', 'KSA UAE IRN KUW JPN KOR CHN IRQ SYR UZB THA IND', { note: 'Saudi Arabia won the final on penalties.' }),
  ed(2000, 'LBN', 'JPN KSA KOR CHN IRN IRQ KUW QAT LBN UZB THA IDN'),
  ed(2004, 'CHN', 'JPN CHN IRN BHR JOR KOR UZB IRQ QAT UAE IDN KUW THA OMA TKM KSA'),
  ed(2007, 'IDN MAS THA VIE', 'IRQ KSA KOR JPN IRN UZB AUS VIE THA IDN MAS CHN QAT UAE OMA BHR', {
    note: 'Iraq’s first title, with Australia new to the AFC.',
  }),
  grouped(2011, 'QAT', 'JPN AUS KOR UZB', ['UZB QAT CHN KUW', 'JPN JOR SYR KSA', 'AUS KOR BHR IND', 'IRN IRQ PRK UAE']),
  grouped(2015, 'AUS', 'AUS KOR UAE IRQ', ['AUS KOR OMA KUW', 'CHN UZB KSA PRK', 'IRN UAE BHR QAT', 'JPN IRQ JOR PLE']),
  grouped(2019, 'UAE', 'QAT JPN IRN UAE', [
    'UAE THA BHR IND',
    'JOR AUS PLE SYR',
    'KOR CHN KGZ PHI',
    'IRN IRQ VIE YEM',
    'QAT KSA LBN PRK',
    'JPN UZB OMA TKM',
  ]),
  grouped(2023, 'QAT', 'QAT JOR IRN KOR', [
    'QAT TJK CHN LBN',
    'AUS UZB SYR IND',
    'IRN UAE PLE HKG',
    'IRQ JPN IDN VIE',
    'BHR KOR JOR MAS',
    'KSA THA OMA KGZ',
  ], { note: 'Played in early 2024.' }),
  upcoming(2027, 'KSA'),
];

export const WOMENS_ASIAN_CUP = [
  ed(1975, 'HKG', 'NZL THA', { note: 'Guests New Zealand won the first edition.' }),
  ed(1977, 'TPE', 'TPE THA'),
  ed(1979, 'IND', 'TPE IND'),
  ed(1981, 'HKG', 'TPE THA'),
  ed(1983, 'THA', 'THA IND'),
  ed(1986, 'HKG', 'CHN JPN'),
  ed(1989, 'HKG', 'CHN TPE'),
  ed(1991, 'JPN', 'CHN JPN'),
  ed(1993, 'MAS', 'CHN PRK'),
  ed(1995, 'MAS', 'CHN JPN'),
  ed(1997, 'CHN', 'CHN PRK'),
  ed(1999, 'PHI', 'CHN TPE'),
  ed(2001, 'TPE', 'PRK JPN'),
  ed(2003, 'THA', 'PRK CHN'),
  ed(2006, 'AUS', 'CHN AUS PRK JPN', { note: 'China beat Australia on penalties in the final.' }),
  ed(2008, 'VIE', 'PRK CHN JPN AUS'),
  ed(2010, 'CHN', 'AUS PRK JPN CHN', { note: 'Australia beat North Korea on penalties in the final.' }),
  ed(2014, 'VIE', 'JPN AUS CHN KOR'),
  ed(2018, 'JOR', 'JPN AUS CHN THA'),
  ed(2022, 'IND', 'CHN KOR JPN PHI'),
  ed(2026, 'AUS', 'JPN AUS CHN KOR'),
];

/** The ASEAN Championship (Tiger Cup, Suzuki Cup, Mitsubishi Electric Cup). */
export const ASEAN = [
  ed(1996, 'SGP', 'THA MAS IDN VIE', { note: 'The first Tiger Cup.' }),
  ed(1998, 'VIE', 'SGP VIE IDN THA'),
  ed(2000, 'THA', 'THA IDN MAS VIE'),
  ed(2002, 'IDN SGP', 'THA IDN VIE MAS', { note: 'Thailand beat Indonesia on penalties in the final.' }),
  ed(2004, 'MAS VIE', 'SGP IDN MAS MYA'),
  ed(2007, 'SGP THA', 'SGP THA MAS VIE'),
  ed(2008, 'IDN THA', 'VIE THA IDN SGP'),
  ed(2010, 'IDN VIE', 'MAS IDN PHI VIE'),
  ed(2012, 'MAS THA', 'SGP THA MAS PHI'),
  ed(2014, 'SGP VIE', 'THA MAS PHI VIE'),
  ed(2016, 'MYA PHI', 'THA IDN MYA VIE'),
  ed(2018, null, 'VIE MAS PHI THA', { hostNote: 'Home and away' }),
  ed(2020, 'SGP', 'THA IDN SGP VIE', { note: 'Played in December 2021 and January 2022.' }),
  ed(2022, null, 'THA VIE IDN MAS', { hostNote: 'Home and away' }),
  grouped(2024, null, 'VIE THA SGP PHI', ['THA SGP MAS CAM TLS', 'VIE PHI IDN MYA LAO'], { hostNote: 'Home and away' }),
  grouped(2026, null, 'VIE THA', ['VIE SGP IDN CAM TLS', 'THA MAS PHI MYA LAO'], {
    hostNote: 'Home and away',
    note: 'Vietnam beat Thailand 4–2 on aggregate in the final.',
  }),
];

export const FIFA_ASEAN_CUP = [
  grouped(2026, 'IDN', null, ['IDN SGP MAS BAN', 'THA PHI VIE PAK'], {
    status: 'upcoming',
    note: 'The first FIFA ASEAN Cup, under way now: the group winners meet in the final on 5 October.',
  }),
];

export const EAFF_E1 = [
  ed(2003, 'JPN', 'KOR JPN CHN HKG', { note: 'The first East Asian Football Championship.' }),
  ed(2005, 'KOR', 'CHN JPN PRK KOR'),
  ed(2008, 'CHN', 'KOR JPN CHN PRK'),
  ed(2010, 'JPN', 'CHN KOR JPN HKG'),
  ed(2013, 'KOR', 'JPN CHN KOR AUS', { note: 'Australia played as guests.' }),
  ed(2015, 'CHN', 'KOR CHN PRK JPN'),
  ed(2017, 'JPN', 'KOR JPN CHN PRK'),
  ed(2019, 'KOR', 'KOR JPN CHN HKG'),
  ed(2022, 'JPN', 'JPN KOR CHN HKG'),
  ed(2025, 'KOR', 'JPN KOR CHN HKG'),
];

export const SAFF = [
  ed(1993, 'PAK', 'IND SRI PAK NEP', { note: 'The first SAFF Championship, a round-robin in Lahore.' }),
  ed(1995, 'SRI', 'SRI IND BAN PAK'),
  ed(1997, 'NEP', 'IND MDV'),
  ed(1999, 'IND', 'IND BAN'),
  ed(2003, 'BAN', 'BAN MDV', { note: 'Bangladesh beat the Maldives on penalties in the final.' }),
  ed(2005, 'PAK', 'IND BAN'),
  ed(2008, 'MDV SRI', 'MDV IND'),
  ed(2009, 'BAN', 'IND MDV', { note: 'India beat the Maldives on penalties in the final.' }),
  ed(2011, 'IND', 'IND AFG'),
  ed(2013, 'NEP', 'AFG IND'),
  ed(2015, 'IND', 'IND AFG'),
  ed(2018, 'BAN', 'MDV IND'),
  ed(2021, 'MDV', 'IND NEP'),
  ed(2023, 'IND', 'IND KUW LBN BAN', { note: 'India beat guests Kuwait on penalties in the final.' }),
  grouped(2026, 'BAN', null, ['BAN SRI BHU', 'IND PAK MDV'], { status: 'upcoming', note: 'In Dhaka, 4–17 November.' }),
];

/** Arabian Gulf Cup: round-robins until 2003–04, then two groups and knockouts. */
export const GULF_CUP = [
  ed(1970, 'BHR', 'KUW BHR KSA QAT', { note: 'The first Gulf Cup.' }),
  ed(1972, 'KSA', 'KUW KSA UAE QAT'),
  ed(1974, 'KUW', 'KUW KSA QAT UAE BHR OMA'),
  ed(1976, 'QAT', 'KUW IRQ QAT BHR UAE KSA OMA', { note: 'Kuwait beat Iraq in a play-off for the title.' }),
  ed(1979, 'IRQ', 'IRQ KUW KSA BHR QAT UAE OMA'),
  ed(1982, 'UAE', 'KUW BHR UAE KSA QAT OMA'),
  ed(1984, 'OMA', 'IRQ QAT KSA UAE KUW BHR OMA', { note: 'Iraq beat Qatar on penalties in a play-off for the title.' }),
  ed(1986, 'BHR', 'KUW UAE KSA QAT IRQ BHR OMA'),
  ed(1988, 'KSA', 'IRQ UAE KSA BHR KUW QAT OMA'),
  ed(1990, 'KUW', 'KUW QAT BHR OMA UAE'),
  ed(1992, 'QAT', 'QAT BHR KSA UAE KUW OMA'),
  ed(1994, 'UAE', 'KSA UAE BHR QAT KUW OMA'),
  ed(1996, 'OMA', 'KUW QAT KSA UAE BHR OMA'),
  ed(1998, 'BHR', 'KUW KSA UAE OMA BHR QAT'),
  ed(2002, 'KSA', 'KSA QAT KUW BHR UAE OMA'),
  ed(2003, 'KUW', 'KSA BHR QAT OMA KUW UAE YEM', { label: '2003–04' }),
  ed(2004, 'QAT', 'QAT OMA BHR KUW KSA UAE IRQ YEM', { note: 'Qatar beat Oman on penalties in the final.' }),
  ed(2007, 'UAE', 'UAE OMA BHR KSA QAT KUW IRQ YEM'),
  ed(2009, 'OMA', 'OMA KSA KUW QAT BHR UAE IRQ YEM', { note: 'Oman beat Saudi Arabia on penalties in the final.' }),
  ed(2010, 'YEM', 'KUW KSA IRQ UAE QAT OMA BHR YEM'),
  ed(2013, 'BHR', 'UAE IRQ KUW BHR KSA QAT OMA YEM'),
  ed(2014, 'KSA', 'QAT KSA UAE OMA KUW IRQ BHR YEM'),
  ed(2017, 'KUW', 'OMA UAE BHR IRQ KSA QAT KUW YEM', { label: '2017–18', note: 'Oman beat the UAE on penalties in the final.' }),
  ed(2019, 'QAT', 'BHR KSA IRQ QAT KUW OMA UAE YEM'),
  ed(2023, 'IRQ', 'IRQ OMA BHR QAT KSA UAE KUW YEM'),
  ed(2024, 'KUW', 'BHR OMA KUW KSA QAT UAE IRQ YEM', { label: '2024–25' }),
  grouped(2026, 'KSA', null, ['KSA IRQ OMA KUW', 'QAT UAE BHR YEM'], {
    status: 'upcoming',
    note: 'The 27th Gulf Cup is being played in Jeddah right now (23 September to 6 October).',
  }),
];

export const CAFA = [
  ed(2023, 'KGZ UZB', 'IRN UZB KGZ TJK TKM AFG', { note: 'The first CAFA Nations Cup.' }),
  grouped(2025, 'TJK UZB', 'UZB IRN IND OMA', ['UZB OMA TKM KGZ', 'IRN IND TJK AFG'], {
    note: 'Uzbekistan beat Iran after extra time; India and Oman played as guests.',
  }),
];
