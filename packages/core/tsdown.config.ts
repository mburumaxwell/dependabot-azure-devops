import { defineConfig, type UserConfig } from 'tsdown';

const config: UserConfig = {
  format: ['esm'],
  clean: true,
  dts: true,
  sourcemap: true,
  entry: {
    environment: 'src/environment/index.ts',
    github: 'src/github/index.ts',
    http: 'src/http/index.ts',
    logger: 'src/logger.ts',
    'shared-data': 'src/shared-data/index.ts',
    usage: 'src/usage.ts',
  },
};
export default defineConfig([
  {
    ...config,
    target: 'node22',
    platform: 'node',
    outDir: 'dist/node',
    entry: {
      ...(config.entry as Record<string, string>),
      azure: 'src/azure/index.ts',
      dependabot: 'src/dependabot/index.ts',
    },
  },
  {
    ...config,
    target: 'es2020',
    platform: 'browser',
    outDir: 'dist/browser',
  },
]);
