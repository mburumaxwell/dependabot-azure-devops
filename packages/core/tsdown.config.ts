import { defineConfig, type UserConfig } from 'tsdown';

const config: UserConfig = {
  format: ['esm'],
  dts: true,
  sourcemap: true,
  entry: [
    'src/environment/index.ts',
    'src/github/index.ts',
    'src/http/index.ts',
    'src/logger.ts',
    'src/shared-data/index.ts',
    'src/usage.ts',
  ],
};
export default defineConfig([
  {
    ...config,
    platform: 'node',
    outDir: 'dist/node',
    entry: [
      ...(config.entry as string[]),
      // additional
      'src/azure/index.ts',
      'src/dependabot/index.ts',
    ],
  },
  {
    ...config,
    platform: 'browser',
    outDir: 'dist/browser',
  },
]);
