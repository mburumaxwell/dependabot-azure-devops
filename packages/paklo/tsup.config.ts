import { defineConfig } from 'tsup';

export default defineConfig({
  // TODO: stop producing cjs when we stop using azure-devops-node-api which uses dynamic requires
  // azure-devops-node-api should be replaced with simple fetch calls (not axios)
  format: ['esm', 'cjs'],
  target: 'node22',
  platform: 'node',
  splitting: false,
  clean: true,
  dts: true,
  sourcemap: true,
  // tsup default for libraries: mark all node_modules as external
  noExternal: ['semver', 'azure-devops-node-api', 'cpu-features', 'ssh2', 'dockerode'],
  skipNodeModulesBundle: true, // TODO: investigate why this is needed
  entry: {
    azure: 'src/azure/index.ts',
    dependabot: 'src/dependabot/index.ts',
    environment: 'src/environment/index.ts',
    github: 'src/github/index.ts',
    logger: 'src/logger.ts',
    cli: 'src/cli/index.ts',
  },
  outDir: 'dist',
});
