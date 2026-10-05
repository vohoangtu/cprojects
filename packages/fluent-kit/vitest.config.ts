import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.tsx', 'src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    server: { deps: { inline: ['@testing-library/react'] } },
  },
  esbuild: { jsx: 'automatic' },
  define: { __DEV__: 'true' },
});
