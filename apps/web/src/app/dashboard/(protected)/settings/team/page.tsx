import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { auth, type Member } from '@/lib/auth';
import { DangerSection, MembersSection } from './page.client';

export const metadata: Metadata = {
  title: 'Team',
  description: 'Manage your organization team',
  openGraph: { url: `/dashboard/settings/team` },
};

export default async function TeamPage() {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;
  const organizationId = session.session.activeOrganizationId;

  const { members } = await auth.api.listMembers({ headers });
  const invitations = await auth.api.listInvitations({ headers });
  const activeMember = await auth.api.getActiveMember({ headers });

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-semibold mb-2'>Team</h1>
        <p className='text-muted-foreground'>Manage your organization members and invitations</p>
      </div>

      <MembersSection members={members as Member[]} invitations={invitations} />
      {organizationId && activeMember && activeMember.role === 'owner' && (
        <DangerSection organizationId={organizationId} />
      )}
    </div>
  );
}
