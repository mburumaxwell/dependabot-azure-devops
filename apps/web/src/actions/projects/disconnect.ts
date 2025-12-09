'use server';

import { prisma } from '@/lib/prisma';

export async function disconnectProject({ organizationId, projectId }: { organizationId: string; projectId: string }) {
  // fetch organization
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  // delete service hooks for the given project on azure
  if (organization.type === 'azure') {
    // TODO: implement service hook deletion
  }

  // delete the project if it belongs to the organization
  // cascading deletes will handle related entities
  await prisma.project.deleteMany({
    // must belong to the organization
    where: { organizationId, id: projectId },
  });

  // jobs should not be deleted because of billing and analysis purposes
  // they are modelled with onDelete: NoAction in schema.prisma
}
