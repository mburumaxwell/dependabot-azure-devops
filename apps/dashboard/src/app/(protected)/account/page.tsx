import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { auth } from '@/lib/auth';
import { DangerSection, OrganizationsSection, PasskeysSection, ProfileSection, SessionsSection } from './client';

export const metadata: Metadata = {
  title: 'Account',
  description: 'Manage your Paklo account',
  openGraph: { url: `/account` },
};

export default async function AccountPage() {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;
  const sessions = await auth.api.listSessions({ headers });
  const organizations = await auth.api.listOrganizations({ headers });
  const passkeys = await auth.api.listPasskeys({ headers });

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-semibold mb-2'>Account Settings</h1>
        <p className='text-muted-foreground'>Manage your account preferences and security settings</p>
      </div>

      <ProfileSection user={session.user} />
      <PasskeysSection passkeys={passkeys} />
      <SessionsSection activeSessionId={session.session.id} sessions={sessions} />
      <OrganizationsSection organizations={organizations} activeOrganizationId={session.session.activeOrganizationId} />
      <DangerSection hasOrganizations={organizations.length > 0} />
    </div>
  );
}
