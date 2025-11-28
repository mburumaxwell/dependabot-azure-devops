import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['esm'],
  tsconfig: true,
  sourcemap: true,
  entry: ['src/index.ts'],
});
