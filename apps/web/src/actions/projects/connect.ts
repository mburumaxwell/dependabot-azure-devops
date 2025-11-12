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
