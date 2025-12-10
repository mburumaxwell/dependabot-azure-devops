import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { listAvailableProjects } from '@/actions/projects';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ConnectProjectsView } from './page.client';

export const metadata: Metadata = {
  title: 'Connect Projects',
  description: 'Connect your projects to start managing them',
  openGraph: { url: `/dashboard/projects/connect` },
};

export default async function ProjectConnectPage() {
  const headers = await requestHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session || !session.session.activeOrganizationId) return null;

  const organizationId = session.session.activeOrganizationId;
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });
  if (!organization) return null;

  const projects = await listAvailableProjects(organization);

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div className='flex items-center gap-4'>
        <div>
          <h1 className='text-3xl font-semibold mb-2'>Connect Projects</h1>
          <p className='text-muted-foreground'>Select projects from your integration provider to connect</p>
        </div>
      </div>

      <ConnectProjectsView organizationId={organization.id} type={organization.type} projects={projects} />
    </div>
  );
}
