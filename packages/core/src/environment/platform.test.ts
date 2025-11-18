import { expect, test } from 'vitest';
import { getPlatform } from './platform';

test('getPlatform should return "azure_container_apps" when CONTAINER_APP_ENV_DNS_SUFFIX is set', () => {
  process.env.CONTAINER_APP_ENV_DNS_SUFFIX = 'example.com';
  expect(getPlatform()).toBe('azure_container_apps');
  delete process.env.CONTAINER_APP_ENV_DNS_SUFFIX;
});

test('getPlatform should return "vercel" when VERCEL_BRANCH_URL is set', () => {
  process.env.VERCEL_BRANCH_URL = 'https://vercel.com';
  expect(getPlatform()).toBe('vercel');
  delete process.env.VERCEL_BRANCH_URL;
});

test('getPlatform should return "local" when no environment variables are set', () => {
  expect(getPlatform()).toBe(undefined);
});
