'use server';

import { prisma } from '@/lib/prisma';

export async function disconnectProject({ organizationId, projectId }: { organizationId: string; projectId: string }) {
  // Delete the project if it belongs to the organization
  await prisma.project.deleteMany({
    where: {
      organizationId, // must belong to the organization
      id: projectId,
    },
  });

  // cascading deletes should be automatic but with MongoDB we need to do it manually
  await prisma.repository.deleteMany({
    where: {
      projectId,
    },
  });

  // jobs should not be deleted because of billing and analysis purposes
}
