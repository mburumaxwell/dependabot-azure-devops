import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';

/** @type {import("vitest/config").ViteUserConfig} */
export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    watch: false,
    // mode defines what ".env.{mode}" file to choose if exists
    env: loadEnv(mode, process.cwd(), ''), // loads env variables from .env files
    exclude: [...configDefaults.exclude, '.next/**'],
    alias: {
      '~/': fileURLToPath(new URL('./src/', import.meta.url)),
    },
  },
}));
