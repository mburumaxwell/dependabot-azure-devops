import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { UpdateJobsView } from './page.client';

export async function generateMetadata(
  props: PageProps<'/dashboard/[org]/projects/[proj]/repos/[repo]/updates/[upd]/jobs'>,
): Promise<Metadata> {
  const { org, proj: projectId, repo: repositoryId, upd: updateId } = await props.params;
  const { organization, project, repository, update } = await getRepositoryUpdate({
    organizationSlug: org,
    projectId,
    repositoryId,
    updateId,
  });
  if (!organization || !project || !repository || !update) return notFound();

  return {
    title: `Update jobs - ${repository.slug}`,
    description: `View update jobs`,
    openGraph: { url: `/dashboard/${org}/projects/${projectId}/repos/${repositoryId}/updates/${updateId}/jobs` },
  };
}

export default async function RepositoryUpdateJobsPage(
  props: PageProps<'/dashboard/[org]/projects/[proj]/repos/[repo]/updates/[upd]/jobs'>,
) {
  const { org, proj: projectId, repo: repositoryId, upd: updateId } = await props.params;
  const { organization, project, repository, update } = await getRepositoryUpdate({
    organizationSlug: org,
    projectId,
    repositoryId,
    updateId,
  });
  if (!organization || !project || !repository || !update) return notFound();

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
      errors: true,
      affectedPrIds: true,
    },
  });

  return (
    <UpdateJobsView organization={organization} project={project} repository={repository} update={update} jobs={jobs} />
  );
}

async function getRepositoryUpdate({
  organizationSlug,
  projectId,
  repositoryId,
  updateId,
}: {
  organizationSlug: string;
  projectId: string;
  repositoryId: string;
  updateId: string;
}) {
  const organization = await prisma.organization.findUnique({
    where: { slug: organizationSlug },
    select: { id: true, slug: true, type: true },
  });
  if (!organization) return { organization: null, project: null, repository: null, update: null };

  const project = await prisma.project.findUnique({
    // must belong to an organization they are a member of (the active one)
    where: { organizationId: organization.id, id: projectId },
    select: {
      id: true,
      name: true,
      organizationId: true,
      organization: { select: { type: true } },
    },
  });
  if (!project) return { organization, project: null, repository: null, update: null };

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
  if (!repository) return { organization, project, repository: null, update: null };

  const update = await prisma.repositoryUpdate.findUnique({
    // must belong to the repository
    where: { repositoryId: repositoryId, id: updateId },
    select: { id: true, updatedAt: true, ecosystem: true, files: true },
  });

  return { organization, project, repository, update };
}
