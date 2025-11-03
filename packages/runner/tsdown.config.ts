import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['esm'],
  dts: true,
  sourcemap: true,
  entry: [
    'src/index.ts',

    // local
    'src/local/index.ts',
    'src/local/azure/index.ts',
  ],
});
