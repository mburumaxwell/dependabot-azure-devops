import { expect, test } from 'vitest';

import { getSiteUrlCombined, getSiteUrlForAca } from './site-url';

test('should work for Azure ContainerApps', () => {
  // should return undefined if CONTAINER_APP_ENV_DNS_SUFFIX is not set
  process.env.CONTAINER_APP_NAME = 'paklo-website';
  expect(getSiteUrlForAca()).toBe(undefined);
  delete process.env.CONTAINER_APP_NAME;

  // should return undefined if CONTAINER_APP_NAME is not set
  process.env.CONTAINER_APP_ENV_DNS_SUFFIX = 'jollyplant-9349db20.westeurope.azurecontainerapps.io';
  expect(getSiteUrlForAca()).toBe(undefined);
  delete process.env.CONTAINER_APP_ENV_DNS_SUFFIX;

  // should return the correct site URL
  process.env.CONTAINER_APP_ENV_DNS_SUFFIX = 'jollyplant-9349db20.westeurope.azurecontainerapps.io';
  process.env.CONTAINER_APP_NAME = 'paklo-website';
  expect(getSiteUrlForAca()).toBe('https://paklo-website.jollyplant-9349db20.westeurope.azurecontainerapps.io');
  delete process.env.CONTAINER_APP_ENV_DNS_SUFFIX;
  delete process.env.CONTAINER_APP_NAME;
});

test('development uses localhost', () => {
  expect(getSiteUrlCombined({ development: true, main: true, defaultValue: 'https://contoso.com' })).toBe(
    'http://localhost:3000',
  );
  expect(getSiteUrlCombined({ development: false, main: true, defaultValue: 'https://contoso.com' })).toBe(
    'https://contoso.com',
  );
});

test('main uses default value', () => {
  expect(getSiteUrlCombined({ development: false, main: true, defaultValue: 'https://contoso.com' })).toBe(
    'https://contoso.com',
  );
});

test('non-main uses correct value', () => {
  // works for ACA
  process.env.CONTAINER_APP_ENV_DNS_SUFFIX = 'blackbush-020715303.westeurope.azurecontainerapps.io';
  process.env.CONTAINER_APP_NAME = 'paklo-website';
  expect(getSiteUrlCombined({ development: false, main: false, defaultValue: 'https://contoso.com' })).toBe(
    'https://paklo-website.blackbush-020715303.westeurope.azurecontainerapps.io',
  );
  delete process.env.CONTAINER_APP_ENV_DNS_SUFFIX;
  delete process.env.CONTAINER_APP_NAME;

  // works for Vercel
  process.env.VERCEL_BRANCH_URL = 'website-git-dependabot-npmandyarn-360aad-maxwell-werus-projects.vercel.app/';
  expect(getSiteUrlCombined({ development: false, main: false, defaultValue: 'https://contoso.com' })).toBe(
    'https://website-git-dependabot-npmandyarn-360aad-maxwell-werus-projects.vercel.app/',
  );
  delete process.env.VERCEL_BRANCH_URL;

  // fallback
  expect(getSiteUrlCombined({ development: false, main: false, defaultValue: 'https://contoso.com' })).toBe(
    'https://contoso.com',
  );
});
