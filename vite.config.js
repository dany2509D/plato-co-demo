import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: { environment: 'node', include: ['tests/**/*.test.js'], exclude: ['tests/e2e/**', 'node_modules/**'] },
});
