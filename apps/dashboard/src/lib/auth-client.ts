import {
  adminClient,
  inferAdditionalFields,
  magicLinkClient,
  organizationClient,
  passkeyClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import type { auth } from '@/lib/auth.ts';

import { config } from '@/site-config';

export const authClient = createAuthClient({
  baseURL: config.siteUrl,
  plugins: [
    inferAdditionalFields<typeof auth>(),
    magicLinkClient(),
    passkeyClient(),
    organizationClient(),
    adminClient(),
  ],
});
