# Pixel Penalties

Pixel-art penalty shootouts for every national team in the world and every senior international
tournament still being played: 236 teams (all 211 FIFA members, 11 sides outside FIFA such as
Guadeloupe and Martinique, and 14 teams that no longer exist, from the Soviet Union to South
Vietnam) and 31 competitions with 462 editions, from the 1916 South American Championship to the
2035 Women's World Cup.

## Commands

    npm install
    npm run dev          # Vite dev server with hot reload
    npm run build        # type-check, then → dist/index.html, one self-contained file (JS and CSS inlined)
    npm run build:debug  # unminified, with React's development checks → dist-debug/index.html
    npm run preview      # serve the production build locally
    npm test             # Vitest: data integrity, title counts, shootout rules, every edition played to a finish
    npm run typecheck    # strict TypeScript for the app, the tests and the Vite config
    npm run format       # Prettier (format:check only checks)
    npm run sheet        # every flag and sprite pose on one page → dist/sheet.html

Node 22.12 or later is required (Vite 8 and Vitest need it).

## Structure

React 19 and TypeScript in strict mode, built with Vite. Imports use the `@/` alias for `src/`.

    src/main.tsx              entry point: the global styles, then the app
    src/app/                  the app shell (top bar, screen routing, pop-ups) and the route types
    src/screens/              one folder per screen: Home, QuickSetup, TournamentSetup, Bracket, Match, Cabinet;
                              parts that only one screen uses live in that screen's folder
    src/modals/               the Settings, How to play and Pause pop-ups
    src/components/           shared components: buttons, modal, flags and sprites, the scene and its
                              choreography (Web Animations API), the aim, strike and dive controls, pickers
    src/styles/               only what is global: colour tokens and themes, the page reset, shared helper classes
    src/types/                shared types: nations, competitions and editions, tournaments, the shootout, settings
    src/utils/                small pure helpers: seeded random numbers, hashing, maths, formatting, colours,
                              search text, timers, pointer input
    src/data/nations.ts       teams: kits, era names (Zaire, Burma, Ceylon…), confederation membership by year, bans
    src/data/editions/        every edition per confederation: hosts, line-ups, real groups, seeds, winners, notes
    src/data/competitions/    the registry: regions, eligibility rules, and the format each edition used
    src/engine/               the spot-kick model, computer players, shootout rules, group stages and knockout brackets
    src/pixel/                sprite and flag painters (run-length encoded into SVG paths, cached)
    src/audio/                Web Audio synth effects and haptics
    src/state/                localStorage-backed stores read with useSyncExternalStore
    src/hooks/                keyboard shortcuts, reduced motion, animation timing
    tests/                    Vitest suites for the data, the shootout rules and the tournament engine
    scripts/qa.py             Playwright run-through with screenshots (QA_FILE=dist-debug/index.html for the debug build)
    scripts/sheet.ts          renders every flag and sprite pose to dist/sheet.html
    vite.config.ts            Vite 8 with @vitejs/plugin-react; vite-plugin-singlefile inlines the bundle
    tsconfig*.json            the app, the tests and scripts (with Node types), and the Vite config, each checked separately
    .github/workflows/        CI (tests and build on every push) and an on-demand GitHub Pages deploy

Every component has its own folder, with its styles next to it:

    src/components/Scoreboard/
      Scoreboard.tsx          the component; it imports './Scoreboard.css' after its other imports
      Scoreboard.css          the rules for the elements it renders
      ScoreboardSide/         a part that only the scoreboard uses, laid out the same way
      index.ts                what the rest of the code imports: import { Scoreboard } from '@/components/Scoreboard'

## Competitions

- **World:** FIFA World Cup (1930–2034), Women's World Cup (1991–2035), Olympic women's tournament,
  Finalissima, Women's Finalissima, FIFA Arab Cup.
- **Europe:** EURO, Nations League (all four leagues), Women's EURO, Women's Nations League, Baltic Cup.
- **South America:** Copa América (from 1916), Copa América Femenina.
- **North & Central America, Caribbean:** Gold Cup (with the 1963–89 CONCACAF Championship),
  CONCACAF Nations League, W Championship, W Gold Cup.
- **Asia:** Asian Cup, Women's Asian Cup, ASEAN Championship, FIFA ASEAN Cup, EAFF E-1, SAFF
  Championship, Arabian Gulf Cup, CAFA Nations Cup.
- **Africa:** Africa Cup of Nations, WAFCON, African Nations Championship (CHAN), COSAFA Cup.
- **Oceania:** OFC Nations Cup, OFC Women's Nations Cup.

Youth tournaments and discontinued competitions (the British Home Championship, Central
European International Cup, Nordic and Balkan Cups, Confederations Cup, Caribbean Cup, Copa
Centroamericana, AFC Challenge Cup, WAFF, CECAFA and WAFU cups) are left out. The men's Olympic
tournament is an under-23 event, so it counts as youth. The cancelled 2026 Finalissima is not
listed. Trophies won in retired competitions stay saved but are no longer shown.

Who can enter follows the real rules for each year: FIFA members for world events, confederation
members for continental ones (Australia is in Oceania until 2005 and in Asia after, Israel and
Kazakhstan moved from the AFC to UEFA, South Africa is absent 1958–91), and the member lists for
regional cups (Afghanistan played the SAFF Championship from 2005 to 2014). Guests in a real
line-up, such as Japan at the 1999 Copa América, are always included. Dream mode lets any team
from any era enter anything.

## Tournament formats

Every edition is played in the format its final tournament actually used (`formatOf` in
`src/data/competitions/formats.ts`):

- **Group stage, then knockouts.** Each group match is a shootout worth 3 points. Ties are
  broken by head-to-head, penalty difference, penalties scored, then seeding. Qualification
  follows the rules of the era: the top two, the group winners only, or the top two plus the best
  third-placed teams (including the best runner-up formats). Brackets follow the real layouts:
  UEFA's EURO round of 16, the World Cup round of 16 from 1998, and FIFA's 48-team round of 32 for
  2026, where the eight best third-placed teams are slotted in so that no two group-mates meet
  straight away (a test checks all 495 possible combinations).
- **Real groups** for every World Cup group stage (1930, 1950–2026), every Women's World Cup,
  Copa América since 1975, the Gold Cup's group eras, the Asian Cup since 2011, AFCON 1963–96 and
  since 2012, every EURO from 1980, every Nations League, and more. Other editions draw their
  groups with the hosts and the historical top finishers heading a group each.
- **Second group stages:** the 1950 World Cup final round (no final), the 1974 and 1978 second
  rounds whose winners met in the final, the four groups of three of 1982, and the final rounds of
  the Copa América (1989–91), AFCON 1976, the CONCACAF Championship and the Copa Femenina.
- **Seeds straight into the knockouts:** the four top seeds of the CONCACAF Nations League since
  2023–24, and the Copa América holders of 1975–87. A seeded player starts in the knockouts and
  the group stage is played without them.
- **Fixed pairings** where the draw is already known, such as the 2026 W Championship.
- **All four Nations League tiers, every edition from 2018–19 to 2026–27**, with promotion,
  play-offs and relegation under each season's own rules.
- **One league table** for the round-robin tournaments (the early Copa América, Gulf Cups to
  2003–04, the E-1 Championship and others), and **straight knockout** where there was no group
  stage (the 1934 and 1938 World Cups, EURO 1960–76 and so on).

Where the record is thin, some older placings beyond the top two and some group line-ups are
approximated. AFCON 2025 is credited to Morocco, who were awarded the title by CAF on appeal after
Senegal won the final; the edition note says so.

Group matchdays run in parallel: when you finish your shootout, every other fixture on that
matchday is simulated. Groups of three or five give each team a rest day. Regions with fewer
teams than places (such as SAFF 2018) play smaller groups.
