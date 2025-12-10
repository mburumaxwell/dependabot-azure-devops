import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RepositoriesView } from './page.client';

export async function generateMetadata(props: PageProps<'/dashboard/projects/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  const { project } = await getProject({ id });
  if (!project) {
    notFound();
  }

  return {
    title: project.name,
    description: `View project ${project.name}`,
    openGraph: { url: `/dashboard/projects/${id}` },
  };
}

export default async function ProjectPage(props: PageProps<'/dashboard/projects/[id]'>) {
  const { id } = await props.params;
  const { project } = await getProject({ id });
  if (!project) {
    notFound();
  }

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

  return <RepositoriesView project={project} repositories={repositories} />;
}

async function getProject({ id }: { id: string }) {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    return { project: undefined };
  }

  const project = await prisma.project.findUnique({
    // must belong to an organization they are a member of (the active one)
    where: { organizationId, id },
    select: {
      id: true,
      name: true,
      url: true,
      synchronizationStatus: true,
      synchronizedAt: true,
      organizationId: true,
    },
  });

  return { project };
}
