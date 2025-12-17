'use server';

import { createAzdoClient } from '@/actions/organizations';
import { requestSync } from '@/actions/sync';
import { PakloId } from '@/lib/ids';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getWebhooksUrl, HEADER_NAME_ORGANIZATION, HEADER_NAME_PROJECT } from '@/lib/webhooks';
import type { AvailableProject } from './available';

export async function connectProjects({
  organizationId,
  projects,
}: {
  organizationId: string;
  projects: AvailableProject[];
}): Promise<{ count?: number; error?: { message: string } }> {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  // ensure billing is setup
  if (!organization.subscriptionId) {
    return { error: { message: 'Organization must have an active subscription' } };
  }

  // create projects
  const projectIds = projects.map(() => PakloId.generate('project')); // generate a new ID for each project
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

  // create service hooks on azure
  if (organization.type === 'azure') {
    const credential = await prisma.organizationCredential.findUniqueOrThrow({
      where: { id: organizationId },
    });
    const client = await createAzdoClient({ organization, credential }, true);
    const created = await prisma.project.findMany({ where: { id: { in: projectIds } } });
    for (const project of created) {
      logger.info(`Creating service hooks for project ${project.id} (${project.url})`);
      await client.createOrUpdateHookSubscriptions({
        url: getWebhooksUrl(organization),
        headers: {
          Authorization: credential.webhooksToken,
          [HEADER_NAME_ORGANIZATION]: organizationId,
          [HEADER_NAME_PROJECT]: project.id,
        },
        project: project.providerId,
      });
      logger.info(`Service hooks created for project ${project.id} (${project.url})`);
    }
  }

  return { count: result.count };
}
