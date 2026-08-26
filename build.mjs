// Bundles the app with esbuild, runs the React Compiler (Babel) over our source,
// and inlines JS + CSS into a single self-contained dist/index.html.
import * as esbuild from 'esbuild';
import { transformAsync } from '@babel/core';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const watch = process.argv.includes('--watch');
const debug = process.argv.includes('--debug');
const stats = { compiled: 0, failed: [] };

const reactCompiler = {
  name: 'react-compiler',
  setup(build) {
    build.onLoad({ filter: /[\\/]src[\\/].*\.jsx?$/ }, async ({ path: file }) => {
      const source = await readFile(file, 'utf8');
      const result = await transformAsync(source, {
        filename: file,
        babelrc: false,
        configFile: false,
        sourceMaps: false,
        parserOpts: { plugins: ['jsx'] },
        plugins: [
          [
            'babel-plugin-react-compiler',
            {
              target: '19',
              logger: {
                logEvent(filename, event) {
                  if (event.kind === 'CompileSuccess') stats.compiled += 1;
                  else if (event.kind === 'CompileError' || event.kind === 'PipelineError')
                    stats.failed.push(`${path.relative(process.cwd(), filename)}: ${event.fnName ?? ''} ${event.detail?.reason ?? event.data ?? ''}`);
                },
              },
            },
          ],
        ],
      });
      return { contents: result.code, loader: 'jsx' };
    });
  },
};

async function bundle() {
  stats.compiled = 0;
  stats.failed = [];
  const js = await esbuild.build({
    entryPoints: ['src/main.jsx'],
    bundle: true,
    minify: !debug,
    format: 'iife',
    target: ['es2020', 'safari15'],
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': debug ? '"development"' : '"production"' },
    legalComments: 'none',
    write: false,
    plugins: [reactCompiler],
  });
  const css = await esbuild.transform(await readFile('src/styles.css', 'utf8'), { loader: 'css', minify: true, target: ['safari15', 'chrome100', 'firefox100'] });
  const code = js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const html = (await readFile('index.html', 'utf8'))
    .replace('/*__CSS__*/', () => css.code)
    .replace('//__JS__', () => code);
  await mkdir('dist', { recursive: true });
  await writeFile(debug ? 'dist/debug.html' : 'dist/index.html', html);
  console.log(`dist/index.html ${(html.length / 1024).toFixed(1)} kB (JS ${(code.length / 1024).toFixed(1)} kB, CSS ${(css.code.length / 1024).toFixed(1)} kB)`);
  console.log(`React Compiler: ${stats.compiled} components/hooks memoised${stats.failed.length ? `, ${stats.failed.length} skipped:` : ', none skipped'}`);
  for (const f of stats.failed) console.log('  -', f);
}

await bundle();
if (watch) {
  const { watch: fsWatch } = await import('node:fs');
  let timer;
  fsWatch('src', { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => bundle().catch((e) => console.error(e.message)), 80);
  });
  console.log('watching src/ …');
}
