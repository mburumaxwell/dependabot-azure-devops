import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['esm'],
  dts: true,
  sourcemap: true,
  entry: [
    // base
    'src/environment/index.ts',
    'src/http/index.ts',
    'src/logger.ts',
    'src/shared-data/index.ts',
    'src/usage.ts',

    // dependabot
    'src/github/index.ts',
    'src/dependabot/index.ts',
    'src/azure/index.ts',
  ],
});
