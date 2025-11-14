import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RepositoriesView } from './page.client';

export async function generateMetadata(props: PageProps<'/dashboard/projects/[id]/view'>): Promise<Metadata> {
  const params = await props.params;
  const project = await getProject({ id: params.id });
  if (!project) {
    notFound();
  }

  return {
    title: project.name,
    description: `View project ${project.name}`,
    openGraph: { url: `/dashboard/projects/${params.id}/view` },
  };
}

export default async function ProjectPage(props: PageProps<'/dashboard/projects/[id]/view'>) {
  const params = await props.params;
  const project = await getProject({ id: params.id });
  if (!project) {
    notFound();
  }

  const repositories = await prisma.repository.findMany({
    where: { projectId: project.id },
  });

  return <RepositoriesView project={project} repositories={repositories} />;
}

async function getProject({ id }: { id: string }) {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    return undefined;
  }

  const project = await prisma.project.findUnique({
    where: {
      organizationId, // must belong to an organization they are a member of (the active one)
      id,
    },
    select: {
      id: true,
      name: true,
      url: true,
      synchronizationStatus: true,
      synchronizedAt: true,
      organizationId: true,
      maxRepositories: true,
    },
  });

  return project;
}
