import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  splitting: false,
  clean: true,
  dts: true,
  sourcemap: true,
  entry: {
    core: 'src/core/index.ts',
    azure: 'src/azure/index.ts',
    dependabot: 'src/dependabot/index.ts',
    environment: 'src/environment/index.ts',
    github: 'src/github/index.ts',
    logger: 'src/logger.ts',
    cli: 'src/cli/index.ts',
    'shared-data': 'src/shared-data/index.ts',
  },
  outDir: 'dist',
});
