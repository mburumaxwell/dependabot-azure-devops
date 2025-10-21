import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  clean: true,
  dts: true,
  sourcemap: true,
  entry: 'src/index.ts',
  outDir: 'dist',
});
