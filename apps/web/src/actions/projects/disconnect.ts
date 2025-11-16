'use server';

import { prisma } from '@/lib/prisma';

export async function disconnectProject({ organizationId, projectId }: { organizationId: string; projectId: string }) {
  // delete the project if it belongs to the organization
  // cascading deletes will handle related entities
  await prisma.project.deleteMany({
    where: {
      organizationId, // must belong to the organization
      id: projectId,
    },
  });

  // jobs should not be deleted because of billing and analysis purposes
  // they are modelled with onDelete: NoAction in schema.prisma
}
