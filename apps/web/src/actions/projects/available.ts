'use server';

import { AzureDevOpsWebApiClient, extractOrganizationUrl } from '@paklo/core/azure';
import type { OrganizationType } from '@/lib/organization-types';
import { prisma } from '@/lib/prisma';

export type AvailableProject = {
  name: string;
  providerId: string;
  description?: string;
  url: string;
  /**
   * The link that never changes even if the name changes (only for some providers).
   * This tends to be the API url for the project.
   */
  permalink: string;
  connected: boolean;
};

type ListAvailableProjectsOptions = {
  id: string;
  type: OrganizationType | string;
  url: string;
};
export async function listAvailableProjects({
  id,
  type,
  url: inputUrl,
}: ListAvailableProjectsOptions): Promise<AvailableProject[]> {
  // get available projects from provider
  if (!providerProjectsFetchers.has(type as OrganizationType)) {
    throw new Error(`Unsupported organization type: ${type}`);
  }
  const fetcher = providerProjectsFetchers.get(type as OrganizationType);
  if (typeof fetcher !== 'function') {
    throw new Error(`Invalid fetcher for organization type: ${type}`);
  }
  const available = await fetcher({ id, url: inputUrl });

  // get connected projects from our database
  const connected = await prisma.project.findMany({
    where: { organizationId: id },
    select: { name: true, url: true, permalink: true, providerId: true },
  });

  // Merge the data, marking connected projects then sort by connected and name
  // Some projects may be in the connected list but not in the available list,
  // such as when they were deleted but we do not know about it yet, we include them too
  const projects = [...available, ...connected.filter((c) => !available.find((a) => a.providerId === c.providerId))]
    .map((p) => ({
      ...p,
      connected: connected.some((c) => c.providerId === p.providerId),
    }))
    .sort((a, b) => {
      if (a.connected && !b.connected) return -1;
      if (!a.connected && b.connected) return 1;
      return a.name.localeCompare(b.name);
    });

  return projects;
}

type ListProviderProjectsOptions = Omit<ListAvailableProjectsOptions, 'type'>;
type AvailableProviderProject = Omit<AvailableProject, 'connected'>;
type ProviderProjectsFetcher = (args: ListProviderProjectsOptions) => Promise<AvailableProviderProject[]>;
const providerProjectsFetchers = new Map<OrganizationType | string, ProviderProjectsFetcher>([
  ['azure', getAvailableForAzure],
  // future organization types can be added here
]);

async function getAvailableForAzure({
  id,
  url: inputUrl,
}: ListProviderProjectsOptions): Promise<AvailableProviderProject[]> {
  const url = extractOrganizationUrl({ organisationUrl: inputUrl });
  const token = (
    await prisma.organizationCredential.findUniqueOrThrow({
      where: { id },
      select: { token: true },
    })
  ).token;
  const client = new AzureDevOpsWebApiClient(url, token);

  return ((await client.getProjects())?.value || [])
    .filter((project) => project.state === 'wellFormed')
    .map((project) => ({
      name: project.name,
      description: project.description,
      url: `${url.value}/${project.name}`,
      permalink: project.url,
      providerId: project.id,
    }));
}
