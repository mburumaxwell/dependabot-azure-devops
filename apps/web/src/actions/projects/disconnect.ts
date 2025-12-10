'use server';

import { AzureDevOpsClientWrapper, extractOrganizationUrl } from '@paklo/core/azure';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getWebhooksUrl } from '@/lib/webhooks';

export async function disconnectProject({ organizationId, projectId }: { organizationId: string; projectId: string }) {
  // fetch organization
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  // fetch the project to be disconnected
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
  });

  // delete service hooks for the given project on azure
  if (organization.type === 'azure') {
    const url = extractOrganizationUrl({ organisationUrl: organization.url });
    const credential = await prisma.organizationCredential.findUniqueOrThrow({
      where: { id: organizationId },
    });
    const client = new AzureDevOpsClientWrapper(url, credential.token);
    logger.info(`Deleting service hooks for project ID ${project.id} (${project.url})`);
    await client.deleteHookSubscriptions({
      url: getWebhooksUrl(organization),
      project: project.providerId,
    });
    logger.info(`Service hooks deleted for project ID ${project.id} (${project.url})`);
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
