import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UpdateJobsView } from './page.client';

export async function generateMetadata(
  props: PageProps<'/dashboard/projects/[id]/repos/[repoId]/updates/[updateId]/jobs'>,
): Promise<Metadata> {
  const { id: projectId, repoId: repositoryId, updateId } = await props.params;
  const { project, repository, update } = await getRepositoryUpdate({ projectId, repositoryId, updateId });
  if (!project || !repository || !update) {
    notFound();
  }

  return {
    title: `Update jobs - ${repository.slug}`,
    description: `View update jobs`,
    openGraph: { url: `/dashboard/projects/${projectId}/repos/${repositoryId}/updates/${updateId}/jobs` },
  };
}

export default async function RepositoryUpdateJobsPage(
  props: PageProps<'/dashboard/projects/[id]/repos/[repoId]/updates/[updateId]/jobs'>,
) {
  const { id: projectId, repoId: repositoryId, updateId } = await props.params;
  const { project, repository, update } = await getRepositoryUpdate({ projectId, repositoryId, updateId });
  if (!project || !repository || !update) {
    notFound();
  }

  // get top 10 latest jobs for the update
  const jobs = await prisma.updateJob.findMany({
    where: { repositoryUpdateId: update.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      status: true,
      createdAt: true,
      finishedAt: true,
      errorType: true,
      errorDetails: true,
      affectedPrIds: true,
    },
  });

  return <UpdateJobsView project={project} repository={repository} update={update} jobs={jobs} />;
}

async function getRepositoryUpdate({
  projectId,
  repositoryId,
  updateId,
}: {
  projectId: string;
  repositoryId: string;
  updateId: string;
}) {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    return { project: undefined, repository: undefined, update: undefined };
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
      updatedAt: true,
      synchronizationStatus: true,
      synchronizedAt: true,
      projectId: true,
      slug: true,
      synchronizationError: true,
      updates: true,
    },
  });

  const update = await prisma.repositoryUpdate.findUnique({
    // must belong to the repository
    where: { repositoryId: repositoryId, id: updateId },
    select: {
      id: true,
      updatedAt: true,
      ecosystem: true,
      files: true,
      latestUpdateJobStatus: true,
    },
  });

  return { project, repository, update };
}
