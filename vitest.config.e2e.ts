import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // Suites share guarni_test; only requests within a concurrency test overlap.
    fileParallelism: false,
    setupFiles: ['./test/setup-env.ts'],
  },
});
