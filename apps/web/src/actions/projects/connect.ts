'use server';

import { generateId } from '@paklo/core/keygen';
import { requestSync } from '@/actions/sync';
import { prisma } from '@/lib/prisma';
import type { AvailableProject } from './available';

export async function connectProjects({
  organizationId,
  projects,
}: {
  organizationId: string;
  projects: AvailableProject[];
}) {
  // ensure projects to be connected will not exceed the limit
  const existingCount = await prisma.project.count({ where: { organizationId } });
  const maxProjects =
    (
      await prisma.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: { maxProjects: true },
      })
    ).maxProjects || 1; // TODO: remove default once onboarding flow is enforced
  if (existingCount + projects.length > maxProjects) {
    throw new Error(`Connecting these projects would exceed the limit of ${maxProjects} projects provisioned.`);
  }

  // create projects
  const projectIds = projects.map(() => generateId()); // generate a new ID for each project
  const result = await prisma.project.createMany({
    data: projects.map((project, index) => ({
      id: projectIds[index]!,
      organizationId,
      providerId: project.providerId,
      name: project.name,
      url: project.url,
      permalink: project.permalink,
      synchronizationStatus: 'pending',
      synchronizedAt: null,
    })),
  });

  // schedule synchronization for the newly connected projects
  for (const projectId of projectIds) {
    await requestSync({
      organizationId,
      projectId,
      scope: 'all', // sync all repositories
      trigger: true, // trigger update jobs
    });
  }

  return result.count;
}
