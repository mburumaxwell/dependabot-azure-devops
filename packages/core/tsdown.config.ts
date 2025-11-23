import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['esm'],
  dts: true,
  sourcemap: true,
  entry: [
    // base
    'src/http/index.ts',
    'src/hono.ts',
    'src/keygen.ts',
    'src/logger.ts',
    'src/usage.ts',

    // dependabot
    'src/github/index.ts',
    'src/dependabot/index.ts',
    'src/azure/index.ts',
  ],
});
