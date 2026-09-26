#!/usr/bin/env node
/**
 * Rebuilds this project's git history from its milestones: 34 commits in the order the work
 * was done, with messages in the form "Add - …", "Implement - …", "Replace - …", "Update - …".
 *
 * By default the commits are spread from one month ago until today, on weekday evenings and at
 * weekends. Each milestone takes time in proportion to its size, some days are left free, and
 * nothing is dated after the moment you run the script. --ai-timeline uses the real times of the
 * AI build sessions (24–26 September 2026) instead.
 *
 *   node scripts/replay-history.mjs --dry-run
 *   node scripts/replay-history.mjs
 *   node scripts/replay-history.mjs --remote git@github.com:<you>/pixel-penalties.git --push
 *
 * Your files are never modified. Earlier versions of files that changed later (the esbuild and
 * React Compiler build that Vite replaced, the components before manual memoisation) are written
 * straight into git's object database, and the last commit always matches your working tree.
 * The commits in between follow the real order of work but are a reconstruction: most files
 * appear in their final form, so only the last commit is the tested build.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const HELP = `Rebuilds the project's git history from its milestones.

By default the commits are spread from one month ago until today, on weekday evenings
(from 18:30) and weekends (10:00 to 19:00), in your computer's time zone.

Usage: node scripts/replay-history.mjs [options]

  --dry-run          show the commits and their dates, change nothing
  --since <date>     first day, as YYYY-MM-DD (default: one month before --until)
  --until <date>     last day, as YYYY-MM-DD (default: today)
  --seed <number>    pick a different set of days and times (default: 1)
  --ai-timeline      date the commits at the real AI build sessions, 24–26 Sep 2026
  --remote <url>     add <url> as the "origin" remote
  --push             push the branch to origin afterwards (needs --remote or an existing origin)
  --branch <name>    branch to create (default: main)
  --utc              write the dates in UTC instead of your computer's time zone
  --co-author        credit Claude on every commit with a Co-authored-by trailer
  --help             show this help`;

// ─── The milestones ──────────────────────────────────────────────────────────
// `hours`: relative size of the work, used to spread the commits over the date range.
// `at`: when it happened in the AI build sessions (used with --ai-timeline).
// `files`: today's version of these files. `earlier`: the version before a later commit
// changed it (see EARLIER). `virtual`: files or versions that no longer exist on disk
// (see VIRTUAL). `remove`: files deleted in this commit. `all`: add everything else.

const PLAN = [
  // Foundations
  { hours: 2, at: '2026-09-24T10:05:00Z', message: 'Add - project scaffold with React 19.3, esbuild and the React Compiler', virtual: ['package.json@esbuild', 'build.mjs', 'index.html@europe', 'src/main.jsx@esbuild'], files: ['.gitignore'] },
  { hours: 5, at: '2026-09-24T11:53:00Z', message: 'Implement - seeded random number generator and shootout rules', files: ['src/engine/rng.js', 'src/engine/shootout.js'] },
  { hours: 2, at: '2026-09-24T11:57:00Z', message: 'Add - kit colour palettes and player looks', files: ['src/pixel/colors.js'] },

  // The game itself
  { hours: 3, at: '2026-09-24T12:02:00Z', message: 'Add - synthesised sound effects and haptics', files: ['src/audio/sfx.js'] },
  { hours: 3, at: '2026-09-24T12:06:00Z', message: 'Implement - localStorage stores for settings, saves and trophies', files: ['src/state/stores.js'] },
  { hours: 1, at: '2026-09-24T12:12:00Z', message: 'Add - sprite contact sheet and screenshot scripts for visual QA', files: ['scripts/sheet.mjs', 'scripts/shot.py'] },
  { hours: 7, at: '2026-09-24T12:58:00Z', message: 'Implement - pixel sprite painter for players, keepers and trophies', earlier: ['src/pixel/sprites.js', 'src/components/pixel.jsx'] },
  { hours: 10, at: '2026-09-24T13:44:00Z', message: 'Add - pixel flag painter with hand-drawn national flags', files: ['src/pixel/flags.js'] },
  { hours: 3, at: '2026-09-24T14:31:00Z', message: 'Implement - keyboard shortcuts and shared UI components', files: ['src/hooks/useKeydown.js', 'src/components/ui.jsx'] },
  { hours: 9, at: '2026-09-24T15:18:00Z', message: 'Implement - match scene, strike controls and kick choreography', files: ['src/components/Scene.jsx', 'src/components/controls.jsx', 'src/components/choreography.js'] },
  { hours: 7, at: '2026-09-24T16:14:00Z', message: 'Add - pixel-art styles with dark mode and responsive layout', files: ['src/styles.css'] },

  // Tournaments and group stages
  { hours: 2, at: '2026-09-24T16:31:00Z', message: 'Add - shootout rule tests', files: ['tests/shootout.test.mjs'] },
  { hours: 8, at: '2026-09-24T17:22:00Z', message: 'Implement - match screen with aiming, strike meter and keeper AI', files: ['src/screens/Match.jsx'] },
  { hours: 7, at: '2026-09-24T18:09:00Z', message: 'Add - home screen, quick shootout, nation picker and trophy cabinet', files: ['src/screens/Home.jsx', 'src/screens/Cabinet.jsx'], earlier: ['src/screens/QuickSetup.jsx', 'src/components/NationPicker.jsx'] },
  { hours: 10, at: '2026-09-24T19:04:00Z', message: 'Implement - tournament engine with group stages and knockout brackets', files: ['src/engine/tournament.js'] },
  { hours: 9, at: '2026-09-24T19:58:00Z', message: 'Add - tournament setup wizard and hub with tables, fixtures and bracket', files: ['src/screens/Bracket.jsx'], earlier: ['src/screens/TournamentSetup.jsx'] },
  { hours: 3, at: '2026-09-24T20:46:00Z', message: 'Add - tournament engine tests', files: ['tests/tournament.test.mjs'] },
  { hours: 2, at: '2026-09-24T21:24:00Z', message: 'Implement - app shell with screen routing and resumable tournaments', files: ['src/App.jsx'] },
  { hours: 2, at: '2026-09-24T21:51:00Z', message: 'Add - Playwright QA script for full match run-throughs', earlier: ['scripts/qa.py'] },

  // Every Nations League tier
  { hours: 8, at: '2026-09-25T10:17:00Z', message: "Add - UEFA editions: EURO, every Nations League tier, women's cups", files: ['src/data/editions/helpers.js', 'src/data/editions/uefa.js'] },

  // The whole world
  { hours: 7, at: '2026-09-25T15:48:00Z', message: 'Add - 236 national teams with confederation history and era names', files: ['src/data/nations.js'] },
  { hours: 0.5, at: '2026-09-25T17:36:00Z', message: 'Add - striped kits for Argentina and Paraguay', files: ['src/pixel/sprites.js'] },
  { hours: 6, at: '2026-09-25T19:19:00Z', message: "Add - World Cup, Women's World Cup, Olympics, Arab Cup, Finalissima", files: ['src/data/editions/fifa.js'] },
  { hours: 6, at: '2026-09-25T19:41:00Z', message: 'Add - Copa América, Gold Cup and CONCACAF competition editions', files: ['src/data/editions/conmebol.js', 'src/data/editions/concacaf.js'] },
  { hours: 8, at: '2026-09-25T20:05:00Z', message: 'Add - Asian, African and Oceanian competition editions', files: ['src/data/editions/afc.js', 'src/data/editions/caf.js', 'src/data/editions/ofc.js'] },

  // World formats, then Vite instead of the React Compiler
  { hours: 5, at: '2026-09-25T20:19:00Z', message: 'Implement - competition registry with era-accurate formats', files: ['src/data/competitions.js'] },
  { hours: 3, at: '2026-09-25T20:24:00Z', message: 'Add - data tests for teams, formats and title counts', files: ['tests/data.test.mjs'] },
  { hours: 0.3, at: '2026-09-25T20:33:00Z', message: 'Update - page title and description for the world update', virtual: ['index.html@world'] },
  {
    hours: 2,
    at: '2026-09-25T20:47:00Z',
    message: 'Replace - esbuild and React Compiler build with Vite 8',
    body: 'vite-plugin-singlefile still produces one self-contained dist/index.html, and\nnpm run build:debug writes an unminified development build to dist-debug/.',
    files: ['index.html', 'src/main.jsx', 'vite.config.js', 'scripts/qa.py'],
    earlier: ['package.json', 'package-lock.json'],
    remove: ['build.mjs'],
  },
  {
    hours: 2,
    at: '2026-09-25T21:00:00Z',
    message: 'Implement - targeted memoisation for flags, stars and nation tiles',
    body: "Takes over from the React Compiler where it mattered: a search keystroke on the\n210-team World Cup picker is back from 106 ms to 35 ms with the CPU throttled 4x.",
    files: ['src/components/pixel.jsx', 'src/components/NationPicker.jsx', 'src/screens/QuickSetup.jsx', 'src/screens/TournamentSetup.jsx'],
  },
  { hours: 2, at: '2026-09-25T21:05:00Z', message: 'Add - README with commands, structure, competitions and formats', earlier: ['README.md'] },

  // Repository setup
  { hours: 1, at: '2026-09-26T12:48:00Z', message: 'Add - GitHub Actions for tests, build and Pages deployment', files: ['.github/workflows/ci.yml', '.github/workflows/pages.yml'] },
  { hours: 0.3, at: '2026-09-26T12:52:00Z', message: 'Update - require Node 22.12 or later', files: ['package.json', 'package-lock.json'] },
  { hours: 2, at: '2026-09-26T12:57:00Z', message: 'Add - script that rebuilds the git history from milestones', files: ['scripts/replay-history.mjs', 'README.md'], all: true },
];

/** Files and versions that no longer exist on disk. */
const VIRTUAL = {
  "package.json@esbuild": {
    "path": "package.json",
    "text": "{\n  \"name\": \"pixel-penalties\",\n  \"version\": \"1.0.0\",\n  \"private\": true,\n  \"type\": \"module\",\n  \"description\": \"Pixel-art penalty shootouts for every European nation and competition. React 19 + React Compiler.\",\n  \"scripts\": {\n    \"build\": \"node build.mjs\",\n    \"dev\": \"node build.mjs --watch\",\n    \"test\": \"node --test \\\"tests/*.test.mjs\\\"\"\n  },\n  \"dependencies\": {\n    \"react\": \"19.3.0\",\n    \"react-dom\": \"19.3.0\"\n  },\n  \"devDependencies\": {\n    \"@babel/core\": \"^7.28.0\",\n    \"babel-plugin-react-compiler\": \"1.0.0\",\n    \"esbuild\": \"0.28.2\"\n  }\n}\n"
  },
  "build.mjs": {
    "path": "build.mjs",
    "text": "// Bundles the app with esbuild, runs the React Compiler (Babel) over our source,\n// and inlines JS + CSS into a single self-contained dist/index.html.\nimport * as esbuild from 'esbuild';\nimport { transformAsync } from '@babel/core';\nimport { readFile, writeFile, mkdir } from 'node:fs/promises';\nimport path from 'node:path';\n\nconst watch = process.argv.includes('--watch');\nconst debug = process.argv.includes('--debug');\nconst stats = { compiled: 0, failed: [] };\n\nconst reactCompiler = {\n  name: 'react-compiler',\n  setup(build) {\n    build.onLoad({ filter: /[\\\\/]src[\\\\/].*\\.jsx?$/ }, async ({ path: file }) => {\n      const source = await readFile(file, 'utf8');\n      const result = await transformAsync(source, {\n        filename: file,\n        babelrc: false,\n        configFile: false,\n        sourceMaps: false,\n        parserOpts: { plugins: ['jsx'] },\n        plugins: [\n          [\n            'babel-plugin-react-compiler',\n            {\n              target: '19',\n              logger: {\n                logEvent(filename, event) {\n                  if (event.kind === 'CompileSuccess') stats.compiled += 1;\n                  else if (event.kind === 'CompileError' || event.kind === 'PipelineError')\n                    stats.failed.push(`${path.relative(process.cwd(), filename)}: ${event.fnName ?? ''} ${event.detail?.reason ?? event.data ?? ''}`);\n                },\n              },\n            },\n          ],\n        ],\n      });\n      return { contents: result.code, loader: 'jsx' };\n    });\n  },\n};\n\nasync function bundle() {\n  stats.compiled = 0;\n  stats.failed = [];\n  const js = await esbuild.build({\n    entryPoints: ['src/main.jsx'],\n    bundle: true,\n    minify: !debug,\n    format: 'iife',\n    target: ['es2020', 'safari15'],\n    jsx: 'automatic',\n    define: { 'process.env.NODE_ENV': debug ? '\"development\"' : '\"production\"' },\n    legalComments: 'none',\n    write: false,\n    plugins: [reactCompiler],\n  });\n  const css = await esbuild.transform(await readFile('src/styles.css', 'utf8'), { loader: 'css', minify: true, target: ['safari15', 'chrome100', 'firefox100'] });\n  const code = js.outputFiles[0].text.replace(/<\\/script/gi, '<\\\\/script');\n  const html = (await readFile('index.html', 'utf8'))\n    .replace('/*__CSS__*/', () => css.code)\n    .replace('//__JS__', () => code);\n  await mkdir('dist', { recursive: true });\n  await writeFile(debug ? 'dist/debug.html' : 'dist/index.html', html);\n  console.log(`dist/index.html ${(html.length / 1024).toFixed(1)} kB (JS ${(code.length / 1024).toFixed(1)} kB, CSS ${(css.code.length / 1024).toFixed(1)} kB)`);\n  console.log(`React Compiler: ${stats.compiled} components/hooks memoised${stats.failed.length ? `, ${stats.failed.length} skipped:` : ', none skipped'}`);\n  for (const f of stats.failed) console.log('  -', f);\n}\n\nawait bundle();\nif (watch) {\n  const { watch: fsWatch } = await import('node:fs');\n  let timer;\n  fsWatch('src', { recursive: true }, () => {\n    clearTimeout(timer);\n    timer = setTimeout(() => bundle().catch((e) => console.error(e.message)), 80);\n  });\n  console.log('watching src/ …');\n}\n"
  },
  "index.html@europe": {
    "path": "index.html",
    "text": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\" />\n    <title>Pixel Penalties: every European shootout</title>\n    <meta name=\"description\" content=\"A pixel-art penalty shootout game with every European nation and every European national-team tournament, 1884 to 2032.\" />\n    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />\n    <link href=\"https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Pixelify+Sans:wght@400..700&family=Press+Start+2P&display=swap\" rel=\"stylesheet\" />\n    <style>/*__CSS__*/</style>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <noscript><p style=\"padding:16px;font-family:system-ui\">Pixel Penalties needs JavaScript to play.</p></noscript>\n    <script>//__JS__</script>\n  </body>\n</html>\n"
  },
  "index.html@world": {
    "path": "index.html",
    "text": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\" />\n    <title>Pixel Penalties: every international shootout</title>\n    <meta name=\"description\" content=\"A pixel-art penalty shootout game with every national team and every senior international tournament in the world, 1916 to 2035.\" />\n    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />\n    <link href=\"https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Pixelify+Sans:wght@400..700&family=Press+Start+2P&display=swap\" rel=\"stylesheet\" />\n    <style>/*__CSS__*/</style>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <noscript><p style=\"padding:16px;font-family:system-ui\">Pixel Penalties needs JavaScript to play.</p></noscript>\n    <script>//__JS__</script>\n  </body>\n</html>\n"
  },
  "src/main.jsx@esbuild": {
    "path": "src/main.jsx",
    "text": "import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App.jsx';\n\ncreateRoot(document.getElementById('root')).render(\n  <StrictMode>\n    <App />\n  </StrictMode>,\n);\n"
  }
};

/** How to turn today's file back into its earlier version: [text now, text before] pairs. */
const EARLIER = {
  "src/pixel/sprites.js": [
    [
      "          : pattern === 'sash'\n            ? Math.abs(x - (w - 1 - y * 0.6)) < 2.2\n            : pattern === 'stripes'\n              ? (x >> 1) % 2 === 0\n              : x < w / 2;",
      "          : pattern === 'sash'\n            ? Math.abs(x - (w - 1 - y * 0.6)) < 2.2\n            : x < w / 2;"
    ]
  ],
  "src/components/pixel.jsx": [
    [
      "import { memo } from 'react';\nimport { getArt } from '../pixel/sprites.js';",
      "import { getArt } from '../pixel/sprites.js';"
    ],
    [
      "function FlagView(",
      "export function Flag("
    ],
    [
      "function TrophyIconView(",
      "export function TrophyIcon("
    ],
    [
      "function StarsView(",
      "export function Stars("
    ],
    [
      "\n\n// Leaf components with primitive props that repeat by the hundred (nation pickers, tables,\n// brackets): memoised so a parent update only re-renders the ones whose props changed.\nexport const Flag = memo(FlagView);\nexport const TrophyIcon = memo(TrophyIconView);\nexport const Stars = memo(StarsView);\n",
      "\n"
    ]
  ],
  "src/components/NationPicker.jsx": [
    [
      "import { memo, useDeferredValue, useId, useMemo, useState } from 'react';",
      "import { useDeferredValue, useId, useState } from 'react';"
    ],
    [
      "function NationTileView({ id, year, selected, onSelect, tag }) {",
      "function NationTile({ id, year, selected, onSelect, tag }) {"
    ],
    [
      "// Memoised: selecting a nation or typing a search re-renders only the tiles that change.\nconst NationTile = memo(NationTileView);\n\n/**\n * sections: [{ title, ids, tag? }] – rendered in order, filtered by the search box.\n * `onSelect` should be stable (a state setter or a useCallback) so the tiles can skip re-rendering.\n */",
      "/**\n * sections: [{ title, ids, tag? }] – rendered in order, filtered by the search box.\n */"
    ],
    [
      "  const q = fold(deferred.trim());\n  const visible = useMemo(\n    () =>\n      sections\n        .map((s) => ({\n          ...s,\n          ids: q\n            ? s.ids.filter((id) => {\n                const n = NATION_BY_ID.get(id);\n                return fold(nameIn(n, year)).includes(q) || fold(n.name).includes(q) || n.id.toLowerCase().includes(q);\n              })\n            : s.ids,\n        }))\n        .filter((s) => s.ids.length),\n    [sections, q, year],\n  );",
      "  const q = fold(deferred.trim());\n  const visible = sections\n    .map((s) => ({\n      ...s,\n      ids: q\n        ? s.ids.filter((id) => {\n            const n = NATION_BY_ID.get(id);\n            return fold(nameIn(n, year)).includes(q) || fold(n.name).includes(q) || n.id.toLowerCase().includes(q);\n          })\n        : s.ids,\n    }))\n    .filter((s) => s.ids.length);"
    ]
  ],
  "src/screens/QuickSetup.jsx": [
    [
      "import { useCallback, useState } from 'react';",
      "import { useState } from 'react';"
    ],
    [
      "  // Stable between renders so the nation tiles can skip re-rendering.\n  const choose = useCallback(\n    (id) => {\n      if (picking === 'user') {\n        setUserId(id);\n        if (cpuId === id) setCpuId(null);\n        setPicking('cpu');\n      } else {\n        if (id === userId) return;\n        setCpuId(id);\n      }\n    },\n    [picking, userId, cpuId],\n  );",
      "  const choose = (id) => {\n    if (picking === 'user') {\n      setUserId(id);\n      if (cpuId === id) setCpuId(null);\n      setPicking('cpu');\n    } else {\n      if (id === userId) return;\n      setCpuId(id);\n    }\n  };"
    ]
  ],
  "src/screens/TournamentSetup.jsx": [
    [
      "import { useMemo, useState } from 'react';",
      "import { useState } from 'react';"
    ],
    [
      "/** Picker sections for an edition: the real line-up, everyone else eligible, then dream entries. */\nfunction nationSections(comp, edition, dream) {\n  const field = (edition.field ?? []).filter((id) => NATION_BY_ID.has(id));\n",
      "function NationStep({ comp, edition, nationId, setNationId, dream, setDream }) {\n  const field = (edition.field ?? []).filter((id) => NATIONS.some((n) => n.id === id));\n"
    ],
    [
      "  if (dream && rest.length) sections.push(...byConfederation(rest, 'Dream entries'));\n  return { sections, eligible };\n}\n\nfunction NationStep({ comp, edition, nationId, setNationId, dream, setDream }) {\n  // Cached per edition, so picking a nation only re-renders the two tiles that change.\n  const { sections, eligible } = useMemo(() => nationSections(comp, edition, dream), [comp, edition, dream]);\n",
      "  if (dream && rest.length) sections.push(...byConfederation(rest, 'Dream entries'));\n"
    ]
  ],
  "scripts/qa.py": [
    [
      "\"\"\"Browser QA for the built page: plays a tournament match end to end and screenshots each step.\n\nUsage: python3 scripts/qa.py [desktop|mobile|dark|quick|all]\nQA_FILE=dist-debug/index.html checks the development build (npm run build:debug) instead of dist/index.html.",
      "\"\"\"Browser QA for dist/index.html: plays a tournament match end to end and screenshots each step.\n\nUsage: python3 scripts/qa.py [desktop|mobile|dark|quick|all]"
    ],
    [
      "URL = (ROOT / os.environ.get('QA_FILE', 'dist/index.html')).as_uri()",
      "URL = (ROOT / 'dist' / os.environ.get('QA_FILE', 'index.html')).as_uri()"
    ]
  ],
  "package.json": [
    [
      "  \"engines\": {\n    \"node\": \">=22.12\"\n  },\n",
      ""
    ]
  ],
  "package-lock.json": [
    [
      "        \"vite-plugin-singlefile\": \"^2.3.3\"\n      },\n      \"engines\": {\n        \"node\": \">=22.12\"\n      }\n    },",
      "        \"vite-plugin-singlefile\": \"^2.3.3\"\n      }\n    },"
    ]
  ],
  "README.md": [
    [
      "    vite.config.js            Vite 8 with @vitejs/plugin-react; vite-plugin-singlefile inlines the bundle\n    scripts/replay-history.mjs  rebuilds the git history from the project's milestones (see --help)\n    .github/workflows/        CI (tests and build on every push) and an on-demand GitHub Pages deploy",
      "    vite.config.js            Vite 8 with @vitejs/plugin-react; vite-plugin-singlefile inlines the bundle"
    ],
    [
      "\n\nNode 22.12 or later is required (Vite 8 and the test runner's file globs need it).",
      ""
    ]
  ]
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  const out = { dryRun: false, push: false, coAuthor: false, utc: false, aiTimeline: false, branch: 'main', remote: null, since: null, until: null, seed: 1 };
  const value = (i, name) => {
    if (!argv[i + 1] || argv[i + 1].startsWith('--')) fail(`${name} needs a value. Run with --help to see the options.`);
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--push') out.push = true;
    else if (a === '--co-author') out.coAuthor = true;
    else if (a === '--utc') out.utc = true;
    else if (a === '--ai-timeline') out.aiTimeline = true;
    else if (a === '--branch') out.branch = value(i++, a);
    else if (a === '--remote') out.remote = value(i++, a);
    else if (a === '--since') out.since = value(i++, a);
    else if (a === '--until') out.until = value(i++, a);
    else if (a === '--seed') {
      out.seed = Number(value(i++, a));
      if (!Number.isInteger(out.seed)) fail('--seed must be a whole number.');
    } else if (a === '--help' || a === '-h') {
      console.log(HELP);
      process.exit(0);
    } else fail(`Unknown option "${a}". Run with --help to see the options.`);
  }
  if (out.aiTimeline && (out.since || out.until)) fail('--ai-timeline uses fixed dates, so it can’t be combined with --since or --until.');
  return out;
}

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

const git = (argv, { input, env, cwd = ROOT } = {}) =>
  execFileSync('git', argv, { cwd, input, env: { ...process.env, ...env }, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();

const gitOk = (argv, opts) => {
  try {
    git(argv, opts);
    return true;
  } catch {
    return false;
  }
};

/** A moment as git expects it, in your time zone (or UTC with --utc): 2026-09-01T19:42:13+02:00. */
function gitDate(date) {
  const offset = args.utc ? 0 : -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offset * 60_000).toISOString().slice(0, 19);
  const abs = Math.abs(offset);
  return `${local}${offset < 0 ? '-' : '+'}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

/** 'Wed 26 Aug 19:42', in your time zone (or UTC with --utc). */
function shortDate(date) {
  const [day, dd, month, hh, mm] = args.utc
    ? [date.getUTCDay(), date.getUTCDate(), date.getUTCMonth(), date.getUTCHours(), date.getUTCMinutes()]
    : [date.getDay(), date.getDate(), date.getMonth(), date.getHours(), date.getMinutes()];
  return `${DAYS[day]} ${pad(dd)} ${MONTHS[month]} ${pad(hh)}:${pad(mm)}`;
}

// ─── Dates ───────────────────────────────────────────────────────────────────

/** Small seeded random generator, so a dry run and the real run give the same dates. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const atMinutes = (day, minutes) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);
const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

function parseDay(text, name) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const day = m && new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (!day || day.getDate() !== Number(m[3])) fail(`${name} must be a date like 2026-08-26.`);
  return day;
}

/** The same day one month earlier (31 March → 28 or 29 February). */
function monthBefore(day) {
  const lastDay = new Date(day.getFullYear(), day.getMonth(), 0).getDate();
  return new Date(day.getFullYear(), day.getMonth() - 1, Math.min(day.getDate(), lastDay));
}

/**
 * Spreads the milestones over the date range like after-work sessions: weekday evenings from
 * 18:30 to 23:30 and weekends from 10:00 to 19:00, with about a quarter of the days left free.
 * The work (the `hours` of each milestone) fills those sessions in order, and each commit is
 * dated when its work would be done, so big milestones take several sessions.
 */
function spreadDates() {
  const now = new Date();
  const today = startOfDay(now);
  const until = args.until ? parseDay(args.until, '--until') : today;
  const since = args.since ? parseDay(args.since, '--since') : monthBefore(until);
  if (until > today) fail('--until can’t be in the future.');
  if (since >= until) fail('--since must be before --until.');

  const rng = mulberry32(args.seed);
  const days = [];
  for (let d = since; d <= until; d = addDays(d, 1)) days.push(d);
  const workDays = days.filter((d, i) => i === 0 || i === days.length - 1 || rng() < (isWeekend(d) ? 0.75 : 0.7));

  const latest = new Date(now.getTime() - 60_000);
  const sessions = workDays
    .map((d) => {
      let start = atMinutes(d, isWeekend(d) ? 600 : 1110);
      let end = atMinutes(d, isWeekend(d) ? 1140 : 1410);
      if (d.getTime() === today.getTime()) {
        // Today: nothing after the moment the script runs.
        if (end > latest) end = latest;
        if (start >= end) start = new Date(Math.max(today.getTime(), end.getTime() - 3 * 3_600_000));
      }
      return { start, length: end.getTime() - start.getTime() };
    })
    .filter((s) => s.length > 0);

  const totalWork = PLAN.reduce((sum, c) => sum + c.hours, 0);
  const totalTime = sessions.reduce((sum, s) => sum + s.length, 0);
  const scale = totalTime / totalWork;

  const dates = [];
  let s = 0;
  let used = 0;
  for (const c of PLAN) {
    let need = c.hours * scale;
    while (s < sessions.length - 1 && used + need > sessions[s].length) {
      need -= sessions[s].length - used;
      s += 1;
      used = 0;
    }
    used = Math.min(used + need, sessions[s].length);
    dates.push(sessions[s].start.getTime() + used);
  }

  // A little jitter so the times look typed rather than calculated; always in order, never later than now.
  return dates.map((t, i, all) => {
    let time = t + Math.round((rng() - 0.5) * 12) * 60_000 + Math.floor(rng() * 60) * 1000;
    if (i > 0) time = Math.max(time, all[i - 1] + 4 * 60_000);
    time = Math.min(time, latest.getTime() - (all.length - 1 - i) * 1000);
    all[i] = time;
    return new Date(time);
  });
}

const dates = args.aiTimeline ? PLAN.map((c) => new Date(c.at)) : spreadDates();

// ─── Checks ──────────────────────────────────────────────────────────────────

if (!gitOk(['--version'], { cwd: process.cwd() })) fail('Git is not installed or not on your PATH. Install it from https://git-scm.com and try again.');
if (existsSync(path.join(ROOT, '.git'))) {
  fail('This folder already has a git repository (.git).\n  Run the script on a fresh copy of the project, or delete .git first if you really want to rebuild the history.');
}
if (!existsSync(path.join(ROOT, '.gitignore'))) fail('.gitignore is missing, so node_modules and build output would be committed. Restore it first.');

const warnings = [];
const scratch = mkdtempSync(path.join(tmpdir(), 'replay-'));
let tracked;
try {
  git(['init', '--quiet', '--bare', scratch]);
  const ctx = ['--git-dir', scratch, '--work-tree', ROOT];
  tracked = new Set(git([...ctx, 'ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean));
  for (const dir of ['node_modules', 'dist', 'dist-debug']) {
    if (existsSync(path.join(ROOT, dir)) && !gitOk([...ctx, 'check-ignore', '-q', `${dir}/`])) {
      fail(`${dir}/ is not ignored by .gitignore and would be committed. Add "${dir}/" to .gitignore.`);
    }
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

/** Today's file turned back into its earlier version, or null if the file has changed since. */
function earlierVersion(file) {
  let text = readFileSync(path.join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');
  for (const [now, before] of EARLIER[file]) {
    const at = text.indexOf(now);
    if (at < 0 || text.indexOf(now, at + 1) >= 0) return null;
    text = text.slice(0, at) + before + text.slice(at + now.length);
  }
  return text;
}

const earlier = {};
for (const file of Object.keys(EARLIER)) {
  if (!existsSync(path.join(ROOT, file))) continue;
  earlier[file] = earlierVersion(file);
  if (earlier[file] === null) warnings.push(`${file} has changed since this history was written, so its earlier version is skipped (today's version is used from the start).`);
}

const planned = new Set();
for (const c of PLAN) {
  for (const file of [...(c.files ?? []), ...(c.earlier ?? [])]) {
    planned.add(file);
    if (!existsSync(path.join(ROOT, file))) warnings.push(`${file} is missing and will be skipped ("${c.message}").`);
  }
}
const extra = [...tracked].filter((f) => !planned.has(f)).sort();
if (extra.length) warnings.push(`Not in the milestones, so added in the last commit: ${extra.join(', ')}`);

const zoneLabel = args.utc ? 'UTC' : `your time zone (UTC${gitDate(dates[0]).slice(19)})`;
const activeDays = new Set(dates.map((d) => shortDate(d).slice(0, 10))).size;
const summary = `${PLAN.length} commits on ${activeDays} days, ${shortDate(dates[0]).slice(0, 10)} to ${shortDate(dates.at(-1)).slice(0, 10)}, in ${zoneLabel}`;

// ─── Dry run ─────────────────────────────────────────────────────────────────

if (args.dryRun) {
  console.log(`\n${summary}:\n`);
  PLAN.forEach((c, i) => {
    const n = (c.files?.length ?? 0) + (c.earlier?.length ?? 0) + (c.virtual?.length ?? 0);
    const removed = c.remove?.length ? `, ${c.remove.length} removed` : '';
    console.log(`  ${shortDate(dates[i])}  ${c.message}  (${n} file${n === 1 ? '' : 's'}${removed}${c.all ? ', plus anything left' : ''})`);
  });
  for (const w of warnings) console.log(`\n! ${w}`);
  console.log('\nNothing was changed. Run again without --dry-run to create the repository.\n');
  process.exit(0);
}

const name = gitOk(['config', 'user.name']) ? git(['config', 'user.name']) : '';
const email = gitOk(['config', 'user.email']) ? git(['config', 'user.email']) : '';
if (!name || !email) {
  fail('Set your git identity first, with the email from your GitHub account:\n  git config --global user.name "Your Name"\n  git config --global user.email "you@example.com"');
}

// ─── Build the history ───────────────────────────────────────────────────────

try {
  git(['init', '--quiet', `--initial-branch=${args.branch}`]);
} catch {
  git(['init', '--quiet']); // git before 2.28
  git(['symbolic-ref', 'HEAD', `refs/heads/${args.branch}`]);
}

const stageText = (file, text) => {
  const sha = git(['hash-object', '-w', '--stdin'], { input: text });
  git(['update-index', '--add', '--cacheinfo', `100644,${sha},${file}`]);
};
const stageFile = (file) => existsSync(path.join(ROOT, file)) && git(['add', '--', file]);

let made = 0;
PLAN.forEach((c, i) => {
  for (const key of c.virtual ?? []) stageText(VIRTUAL[key].path, VIRTUAL[key].text);
  for (const file of c.earlier ?? []) (earlier[file] != null ? stageText(file, earlier[file]) : stageFile(file));
  for (const file of c.files ?? []) stageFile(file);
  for (const file of c.remove ?? []) git(['rm', '--cached', '--quiet', '--ignore-unmatch', '--', file]);
  if (c.all) git(['add', '--all']);

  if (gitOk(['diff', '--cached', '--quiet'])) {
    warnings.push(`Skipped "${c.message}": nothing to commit.`);
    return;
  }
  const trailer = args.coAuthor ? '\n\nCo-authored-by: Claude <noreply@anthropic.com>' : '';
  const message = `${c.message}${c.body ? `\n\n${c.body}` : ''}${trailer}`;
  const date = gitDate(dates[i]);
  git(['commit', '--quiet', '--no-verify', '-m', message], { env: { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } });
  made += 1;
});

const dirty = git(['status', '--porcelain']);
if (dirty) warnings.push(`The working tree still differs from the last commit:\n${dirty}`);

console.log(`\n✔ Created ${made} commits on "${args.branch}" as ${name} <${email}>: ${summary}.`);
console.log(`  ${git(['log', '--reverse', '--format=%ad  %s', '--date=format:%a %d %b %H:%M']).split('\n').join('\n  ')}`);
for (const w of warnings) console.log(`\n! ${w}`);

// ─── Remote ──────────────────────────────────────────────────────────────────

if (args.remote) {
  if (gitOk(['remote', 'get-url', 'origin'])) git(['remote', 'set-url', 'origin', args.remote]);
  else git(['remote', 'add', 'origin', args.remote]);
  console.log(`\nRemote "origin" → ${args.remote}`);
}
if (args.push) {
  if (!gitOk(['remote', 'get-url', 'origin'])) fail('There is no "origin" remote to push to. Pass --remote <url>.');
  execFileSync('git', ['push', '-u', 'origin', args.branch], { cwd: ROOT, stdio: 'inherit' });
} else {
  console.log(`\nNext: create an empty repository on GitHub, then\n  git remote add origin <url>\n  git push -u origin ${args.branch}\n`);
}
