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
