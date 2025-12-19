import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listAvailableProjects } from '@/actions/projects';
import { prisma } from '@/lib/prisma';
import { ConnectProjectsView } from './page.client';

export async function generateMetadata(props: PageProps<'/dashboard/[org]/projects/connect'>): Promise<Metadata> {
  const { org: organizationSlug } = await props.params;
  const organization = await getOrganization(organizationSlug);
  if (!organization) return notFound();

  return {
    title: 'Connect Projects',
    description: 'Connect your projects to start managing them',
    openGraph: { url: `/dashboard/${organizationSlug}/projects/connect` },
  };
}

export default async function ProjectConnectPage(props: PageProps<'/dashboard/[org]/projects/connect'>) {
  const { org: organizationSlug } = await props.params;
  const organization = await getOrganization(organizationSlug);
  if (!organization) return notFound();

  const projects = await listAvailableProjects(organization);

  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div className='flex items-center gap-4'>
        <div>
          <h1 className='text-3xl font-semibold mb-2'>Connect Projects</h1>
          <p className='text-muted-foreground'>Select projects from your integration provider to connect</p>
        </div>
      </div>

      <ConnectProjectsView organization={organization} projects={projects} />
    </div>
  );
}

function getOrganization(slug: string) {
  return prisma.organization.findUnique({
    where: { slug },
  });
}
