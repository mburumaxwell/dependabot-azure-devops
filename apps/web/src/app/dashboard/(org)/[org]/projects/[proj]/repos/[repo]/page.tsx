import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { enableSbomDownload } from '@/lib/flags';
import { prisma, type UpdateJobStatus } from '@/lib/prisma';
import { RepositoryView } from './page.client';

export async function generateMetadata(
  props: PageProps<'/dashboard/[org]/projects/[proj]/repos/[repo]'>,
): Promise<Metadata> {
  const { org: organizationSlug, proj: projectId, repo: repositoryId } = await props.params;
  const { organization, project, repository } = await getRepository({ organizationSlug, projectId, repositoryId });
  if (!organization || !project || !repository) return notFound();

  return {
    title: `${repository.name} - ${project.name}`,
    description: `View repository ${repository.name}`,
    openGraph: { url: `/dashboard/${organizationSlug}/projects/${projectId}/repos/${repositoryId}` },
  };
}

export default async function RepositoryPage(props: PageProps<'/dashboard/[org]/projects/[proj]/repos/[repo]'>) {
  const { org: organizationSlug, proj: projectId, repo: repositoryId } = await props.params;
  const { triggeredUpdateId } = await props.searchParams;
  const { organization, project, repository } = await getRepository({ organizationSlug, projectId, repositoryId });
  if (!organization || !project || !repository) return notFound();

  const updates = await prisma.repositoryUpdate.findMany({
    // must belong to the repository
    where: { repositoryId },
    select: { id: true, ecosystem: true, files: true },
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
    <RepositoryView
      organization={organization}
      project={project}
      repository={repository}
      updates={enrichedUpdates}
      sbomAllowed={sbomAllowed}
    />
  );
}

async function getRepository({
  organizationSlug,
  projectId,
  repositoryId,
}: {
  organizationSlug: string;
  projectId: string;
  repositoryId: string;
}) {
  const organization = await prisma.organization.findUnique({
    where: { slug: organizationSlug },
    select: { id: true, slug: true },
  });
  if (!organization) return { organization: undefined, project: undefined, repository: undefined };

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

  return { organization, project, repository };
}
