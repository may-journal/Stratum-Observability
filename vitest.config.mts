import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@plugins\/(.*)$/, replacement: r('./src/plugins/$1') },
      { find: /^@types$/, replacement: r('./src/types') },
      { find: /^@$/, replacement: r('./src') }
    ]
  },
  test: {
    unstubGlobals: true,
    include: ['tests/**/*.{spec,test}.{ts,tsx}'],
    setupFiles: ['tests/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['src/**'],
      exclude: [],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100
      }
    }
  }
});
