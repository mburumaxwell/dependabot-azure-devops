import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  clean: true,
  dts: true,
  sourcemap: true,
  entry: {
    index: 'src/index.ts',
    'local/index': 'src/local/index.ts',
    'local/azure': 'src/local/azure/index.ts',
  },
  outDir: 'dist',
});
