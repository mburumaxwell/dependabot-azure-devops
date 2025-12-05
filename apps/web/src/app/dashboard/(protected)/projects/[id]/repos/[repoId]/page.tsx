import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { enableSbomDownload } from '@/lib/flags';
import { prisma, type UpdateJobStatus } from '@/lib/prisma';
import { RepositoryView } from './page.client';

export async function generateMetadata(props: PageProps<'/dashboard/projects/[id]/repos/[repoId]'>): Promise<Metadata> {
  const { id: projectId, repoId: repositoryId } = await props.params;
  const { project, repository } = await getRepository({ projectId, repositoryId });
  if (!project || !repository) {
    notFound();
  }

  return {
    title: `${repository.name} - ${project.name}`,
    description: `View repository ${repository.name}`,
    openGraph: { url: `/dashboard/projects/${projectId}/repos/${repositoryId}` },
  };
}

export default async function RepositoryPage(props: PageProps<'/dashboard/projects/[id]/repos/[repoId]'>) {
  const { id: projectId, repoId: repositoryId } = await props.params;
  const { triggeredUpdateId } = await props.searchParams;
  const { project, repository } = await getRepository({ projectId, repositoryId });
  if (!project || !repository) {
    notFound();
  }

  const updates = await prisma.repositoryUpdate.findMany({
    // must belong to the repository
    where: { repositoryId },
    select: {
      id: true,
      ecosystem: true,
      files: true,
    },
  });

  const enrichedUpdates = await Promise.all(
    updates.map(async (update) => {
      const latestUpdateJob = await prisma.updateJob.findFirst({
        where: { repositoryUpdateId: update.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true },
      });
      return {
        ...update,
        // if this was triggered, override status to 'scheduled'
        latestUpdateJob:
          triggeredUpdateId === update.id
            ? {
                id: latestUpdateJob?.id || 'dummy',
                status: 'scheduled' as UpdateJobStatus,
              }
            : latestUpdateJob,
      };
    }),
  );

  const sbomAllowed = updates.length > 0 && (await enableSbomDownload());
  return (
    <RepositoryView project={project} repository={repository} updates={enrichedUpdates} sbomAllowed={sbomAllowed} />
  );
}

async function getRepository({ projectId, repositoryId }: { projectId: string; repositoryId: string }) {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    return { project: undefined, repository: undefined };
  }

  const project = await prisma.project.findUnique({
    // must belong to an organization they are a member of (the active one)
    where: { organizationId, id: projectId },
    select: {
      id: true,
      name: true,
      organizationId: true,
      organization: { select: { type: true } },
    },
  });

  const repository = await prisma.repository.findUnique({
    // must belong to the project
    where: { projectId, id: repositoryId },
    select: {
      id: true,
      name: true,
      url: true,
      slug: true,
      updatedAt: true,
      projectId: true,
      synchronizationStatus: true,
      synchronizedAt: true,
      synchronizationError: true,
    },
  });

  return { project, repository };
}
