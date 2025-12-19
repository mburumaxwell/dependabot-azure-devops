import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { RepositoriesView } from './page.client';

export async function generateMetadata(props: PageProps<'/dashboard/[org]/projects/[proj]'>): Promise<Metadata> {
  const { org: organizationSlug, proj: id } = await props.params;
  const { organization, project } = await getProject({ organizationSlug, id });
  if (!organization || !project) return notFound();

  return {
    title: project.name,
    description: `View project ${project.name}`,
    openGraph: { url: `/dashboard/${organizationSlug}/projects/${id}` },
  };
}

export default async function ProjectPage(props: PageProps<'/dashboard/[org]/projects/[proj]'>) {
  const { org: organizationSlug, proj: id } = await props.params;
  const { organization, project } = await getProject({ organizationSlug, id });
  if (!organization || !project) return notFound();

  const repositories = await prisma.repository.findMany({
    where: { projectId: project.id },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      synchronizationStatus: true,
      synchronizedAt: true,
    },
  });

  return <RepositoriesView organization={organization} project={project} repositories={repositories} />;
}

async function getProject({ organizationSlug, id }: { organizationSlug: string; id: string }) {
  const organization = await prisma.organization.findUnique({
    where: { slug: organizationSlug },
    select: { id: true, slug: true },
  });
  if (!organization) return { organization: undefined, project: undefined };

  const project = await prisma.project.findUnique({
    // must belong to an organization they are a member of (the active one)
    where: { organizationId: organization.id, id },
    select: {
      id: true,
      name: true,
      url: true,
      synchronizationStatus: true,
      synchronizedAt: true,
      organizationId: true,
    },
  });

  return { organization, project };
}
