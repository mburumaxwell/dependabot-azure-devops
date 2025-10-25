import { fileURLToPath } from 'url';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';

/** @type {import("vitest/config").ViteUserConfig} */
export default defineConfig({
  plugins: [
    tsconfigPaths({
      // output:standalone and optimizePackageImports: ['@prisma/client'] cause tests to fail
      // hence we ignore errors from the tsconfig files copied
      ignoreConfigErrors: true,
    }),
  ],
  test: {
    globals: true,
    watch: false,
    exclude: [...configDefaults.exclude, '.next/**'],
    alias: {
      '~/': fileURLToPath(new URL('./src/', import.meta.url)),
    },
  },
});
