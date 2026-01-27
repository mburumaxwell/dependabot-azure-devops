import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { forbidden, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DangerSection, MembersSection } from './page.client';

export async function generateMetadata(props: PageProps<'/dashboard/[org]/settings/integrations'>): Promise<Metadata> {
  const { org: organizationSlug } = await props.params;
  const organization = await getOrganization(organizationSlug);
  if (!organization) return notFound();

  return {
    title: 'Team',
    description: 'Manage your organization team',
    openGraph: { url: `/dashboard/${organizationSlug}/settings/team` },
  };
}

export default async function TeamPage(props: PageProps<'/dashboard/[org]/settings/team'>) {
  const { org: organizationSlug } = await props.params;
  const organization = await getOrganization(organizationSlug);
  if (!organization) return notFound();

  const organizationId = organization.id;
  const headers = await requestHeaders();
  const session = await auth.api.getSession({ headers });
  const { members } = await auth.api.listMembers({ headers, query: { organizationId } });
  const invitations = await auth.api.listInvitations({ headers, query: { organizationId } });
  const activeMember = members.find((m) => m.userId === session?.user.id);
  if (!activeMember) return forbidden();

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6 p-6'>
      <div>
        <h1 className='mb-2 font-semibold text-3xl'>Team</h1>
        <p className='text-muted-foreground'>Manage your organization members and invitations</p>
      </div>

      <MembersSection
        organizationId={organization.id}
        role={activeMember.role}
        members={members}
        invitations={invitations}
      />
      {activeMember.role === 'owner' && <DangerSection organizationId={organization.id} />}
    </div>
  );
}

function getOrganization(slug: string) {
  return prisma.organization.findUnique({ where: { slug } });
}
