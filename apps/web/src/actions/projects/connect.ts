'use server';

import { generateId } from '@paklo/core/keygen';
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

  const result = await prisma.project.createMany({
    data: projects.map((project) => ({
      id: generateId(), // generate a new ID for the project
      organizationId,
      providerId: project.providerId,
      name: project.name,
      url: project.url,
      permalink: project.permalink,
      synchronizationStatus: 'pending',
      synchronizedAt: null,
    })),
  });

  // TODO: schedule synchronization for the newly connected projects

  return result.count;
}
