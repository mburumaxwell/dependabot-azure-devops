import { FatalError } from 'workflow';
import { type Organization, type Project, prisma, type Repository } from '@/lib/prisma';
import { createSyncProvider } from './provider';
import { Synchronizer, type SyncResult, type SyncSingleResult } from './synchronizer';

export type SyncWorkflowOptions = {
  organizationId: string;
  projectId: string;
  scope: 'project' | 'repository' | 'all';
  repositoryId?: string;
  repositoryProviderId?: string;
  trigger?: boolean;
};

export type SyncWorkflowResult = SyncResult | SyncSingleResult;

export async function synchronizeWithProvider(options: SyncWorkflowOptions): Promise<SyncWorkflowResult> {
  'use workflow';

  const { organizationId, projectId, scope, repositoryId, repositoryProviderId, trigger } = options;

  // fetch organization
  const organization = await getOrganization(organizationId);
  const project = await getProject(projectId, organizationId);

  if (scope === 'project' || scope === 'all') {
    const result = await synchronizeProject(organization, project, trigger);
    if (scope === 'project') return result;
  }

  if (scope === 'repository') {
    if (repositoryId) {
      const repository = await getRepository(repositoryId, project.id);
      return await synchronizeRepo(organization, project, repository, trigger);
    } else if (repositoryProviderId) {
      return await synchronizeRepoByProvider(organization, project, repositoryProviderId, trigger);
    } else {
      throw new FatalError(
        'Either repositoryId or repositoryProviderId must be provided for repository synchronization',
      );
    }
  }

  // at this point, we are syncing all repositories
  return await synchronizeRepositories(organization, project, trigger);
}

async function getOrganization(id: string) {
  'use step';

  // fetch organization
  if (!id) throw new FatalError('Organization ID is required');
  const organization = await prisma.organization.findUnique({
    where: { id },
  });
  if (!organization) throw new FatalError('Organization not found');

  return organization;
}

async function getProject(id: string, organizationId: string) {
  'use step';

  // fetch project
  if (!id) throw new FatalError('Project ID is required');
  const project = await prisma.project.findUnique({
    where: { id, organizationId },
    include: { repositories: true },
  });
  if (!project) throw new FatalError('Project not found');

  return project;
}

async function getRepository(id: string, projectId: string) {
  'use step';

  // fetch repository
  if (!id) throw new FatalError('Repository ID is required');
  const repository = await prisma.repository.findUnique({
    where: { id, projectId },
  });
  if (!repository) throw new FatalError('Repository not found');

  return repository;
}

async function synchronizeProject(organization: Organization, project: Project, trigger?: boolean) {
  'use step';

  const { synchronizer } = await makeSynchronizer(organization, project, trigger);
  return await synchronizer.syncProject();
}

async function synchronizeRepositories(organization: Organization, project: Project, trigger?: boolean) {
  'use step';

  const { synchronizer } = await makeSynchronizer(organization, project, trigger);
  return await synchronizer.syncRepositories();
}

async function synchronizeRepo(
  organization: Organization,
  project: Project,
  repository: Repository,
  trigger?: boolean,
) {
  'use step';

  const { synchronizer } = await makeSynchronizer(organization, project, trigger);
  return await synchronizer.syncRepo({ repository });
}

async function synchronizeRepoByProvider(
  organization: Organization,
  project: Project,
  repositoryProviderId: string,
  trigger?: boolean,
) {
  'use step';

  const { synchronizer } = await makeSynchronizer(organization, project, trigger);
  return await synchronizer.syncRepoByProvider({ repositoryProviderId });
}

async function makeSynchronizer(organization: Organization, project: Project, trigger?: boolean) {
  const credential = await prisma.organizationCredential.findUniqueOrThrow({
    where: { id: organization.id },
  });

  const provider = createSyncProvider(organization, credential);
  const synchronizer = new Synchronizer(organization, credential, provider, project, trigger);
  return { provider, synchronizer };
}
