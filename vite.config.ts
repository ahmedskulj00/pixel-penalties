import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `vite build` → dist/index.html: one self-contained file with the JS and CSS inlined, so it can be
// opened straight from disk or published as a single page.
// `vite build --mode development` → dist-debug/index.html: the same, unminified, with React's
// development build and its warnings.
export default defineConfig(({ mode }) => {
  const debug = mode === 'development';
  return {
    plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    define: debug ? { 'process.env.NODE_ENV': JSON.stringify('development') } : {},
    build: {
      outDir: debug ? 'dist-debug' : 'dist',
      target: ['es2020', 'safari15'],
      cssTarget: ['safari15', 'chrome100', 'firefox100'],
      minify: !debug,
      reportCompressedSize: false,
      modulePreload: { polyfill: false },
    },
    test: {
      include: ['tests/**/*.test.ts'],
      environment: 'node',
    },
  };
});
