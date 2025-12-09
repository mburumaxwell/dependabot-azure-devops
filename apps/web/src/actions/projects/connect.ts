'use server';

import { requestSync } from '@/actions/sync';
import { PakloId } from '@/lib/ids';
import { getOrganizationTierInfo } from '@/lib/organizations/tiers';
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
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });
  const { maxProjects } = organization;
  if (existingCount + projects.length > maxProjects) {
    throw new Error(`Connecting these projects would exceed the limit of ${maxProjects} projects provisioned.`);
  }

  const tierInfo = getOrganizationTierInfo(organization.tier);

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
      maxRepositories: tierInfo.maxRepositoriesPerProject,
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
    const created = await prisma.project.findMany({ where: { id: { in: projectIds } } });
    for (const _project of created) {
      // TODO: implement service hook creation
    }
  }

  return result.count;
}
