import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  clean: true,
  dts: true,
  sourcemap: true,
  entry: {
    azure: 'src/azure/index.ts',
    dependabot: 'src/dependabot/index.ts',
    environment: 'src/environment/index.ts',
    github: 'src/github/index.ts',
    http: 'src/http/index.ts',
    logger: 'src/logger.ts',
    'shared-data': 'src/shared-data/index.ts',
    usage: 'src/usage.ts',
  },
  outDir: 'dist',
});
