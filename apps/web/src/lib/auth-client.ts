import {
  adminClient,
  inferAdditionalFields,
  inferOrgAdditionalFields,
  magicLinkClient,
  organizationClient,
  passkeyClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import type { auth } from '@/lib/auth';

export const authClient = createAuthClient({
  // auth server is running on the same domain as your client, hence no need to set baseURL
  // baseURL: config.siteUrl,
  plugins: [
    inferAdditionalFields<typeof auth>(),
    magicLinkClient(),
    passkeyClient(),
    organizationClient({ schema: inferOrgAdditionalFields<typeof auth>() }),
    adminClient(),
  ],
});

export type Session = typeof authClient.$Infer.Session;
export type ActiveOrganization = typeof authClient.$Infer.ActiveOrganization;
export type Invitation = typeof authClient.$Infer.Invitation;
export type Member = typeof authClient.$Infer.Member;
export type { Organization, Passkey } from '@/lib/auth';

export async function magicLinkLogin({ email, name }: { email: string; name?: string }) {
  // https://www.better-auth.com/docs/plugins/magic-link
  await authClient.signIn.magicLink({
    email,
    name,
    callbackURL: `/dashboard`,
    newUserCallbackURL: `/dashboard/welcome`,
  });
}
