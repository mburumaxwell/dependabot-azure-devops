import {
  adminClient,
  inferAdditionalFields,
  magicLinkClient,
  organizationClient,
  passkeyClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import type { auth } from '@/lib/auth.ts';

import type { SiteConfig } from '@/site-config';

// TODO: this function is exposing all of site config and we may not want that so figure out a fix

// for some reason getting the baseUrl from site-config has wrong port in
// development if this file loaded on browser. Hence why a factory method is used.

function createAuthClientInstance(config: SiteConfig) {
  return createAuthClient({
    baseURL: config.siteUrl,
    plugins: [
      inferAdditionalFields<typeof auth>(),
      magicLinkClient(),
      passkeyClient(),
      organizationClient(),
      adminClient(),
    ],
  });
}

export { createAuthClientInstance as createAuthClient };
export type AuthClient = ReturnType<typeof createAuthClientInstance>;

export async function magicLinkLogin({
  authClient,
  config,
  email,
  name,
}: {
  authClient?: AuthClient;
  config?: SiteConfig;
  email: string;
  name?: string;
}) {
  // either config or authClient must be provided
  if (!authClient && !config) {
    throw new Error('Either authClient or config must be provided');
  }

  authClient = authClient ?? createAuthClientInstance(config!);

  // https://www.better-auth.com/docs/plugins/magic-link
  await authClient.signIn.magicLink({
    email,
    name: name ?? email.split('@')[0], // use part of email as name suggestion
    callbackURL: `/`,
    newUserCallbackURL: `/welcome`,
  });
}
