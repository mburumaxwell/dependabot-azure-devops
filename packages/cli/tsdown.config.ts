import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['esm'],
  sourcemap: true,
  entry: ['src/index.ts'],
});
