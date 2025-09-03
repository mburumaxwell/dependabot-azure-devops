import { FlatCompat } from '@eslint/eslintrc';
import { config as baseConfig } from '../../eslint-react.config.mjs';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

/** @type {import("eslint").Linter.Config} */
export default [
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts', '.source/**'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  ...baseConfig,
];
