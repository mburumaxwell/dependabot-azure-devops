import { type DependabotConfig, parseDependabotConfig } from '@paklo/core/dependabot';
import { generateId } from '@paklo/core/keygen';
import { start } from 'workflow/api';
import { logger } from '@/lib/logger';
import { type Organization, type OrganizationCredential, type Project, prisma, type Repository } from '@/lib/prisma';
import { type TriggerUpdateJobsWorkflowOptions, triggerUpdateJobs } from '@/workflows/jobs';
import { type ISyncProvider, type SynchronizerConfigurationItem, toSynchronizerProject } from './provider';

export type SyncResult = { count: number; deleted: number; updated: number };
export type SyncSingleResult = { skipped?: boolean; updated: boolean };

export class Synchronizer {
  constructor(
    readonly organization: Organization,
    readonly credential: OrganizationCredential,
    readonly provider: ISyncProvider,
    readonly project: Project,
    readonly trigger?: boolean,
  ) {}

  async syncProject(): Promise<SyncSingleResult> {
    const { project, provider } = this;

    // fetch project from provider
    const providerProj = await provider.getProject(project.providerId);
    if (!providerProj) {
      logger.warn(`Project ${project.id} not found in provider.`);
      return { updated: false };
    }

    // update project info
    logger.info(`Updating info for project ${project.id}.`);
    await prisma.project.update({
      where: { id: project.id },
      data: {
        name: providerProj.name,
        synchronizedAt: new Date(),
        synchronizationStatus: 'success',
      },
    });

    return { updated: true };
  }

  async syncRepositories(): Promise<SyncResult> {
    const { project, provider } = this;

    // track synchronization pairs
    const syncPairs: [SynchronizerConfigurationItem, Repository | null][] = [];

    // get the repositories from provider
    logger.debug(`Listing repositories in project ${project.id} ...`);
    const repos = await provider.getRepositories(project.providerId);
    if (!repos) {
      logger.debug(`No repositories found in project ${project.id}.`);
      return { count: 0, deleted: 0, updated: 0 };
    }
    logger.debug(`Found ${repos.length} repositories in ${project.id}`);
    const providerReposMap = Object.fromEntries(repos.map((r) => [r.id.toString(), r]));

    // synchronize each repository
    for (const [providerRepoId, providerRepo] of Object.entries(providerReposMap)) {
      // skip disabled or fork repositories
      if (providerRepo.disabled || providerRepo.fork) {
        logger.debug(`Skipping sync for ${providerRepo.name} in ${project.id} because it is disabled or is a fork`);
        continue;
      }

      // get the repository from the database
      const repository = await prisma.repository.findUnique({
        where: {
          projectId_providerId: { projectId: project.id, providerId: providerRepoId },
        },
      });

      // get the configuration file
      const sci = await provider.getConfigurationFile(toSynchronizerProject(project), providerRepo);

      // track for further synchronization
      syncPairs.push([sci, repository]);

      // add delay of 30ms to avoid rate limiting, every 10 repositories
      if (syncPairs.length % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
    }

    // remove repositories that are no longer tracked (i.e. the repository was removed)
    const providerIdsToKeep = syncPairs.filter(([item]) => item.hasConfiguration).map(([item]) => item.id);
    const { count: deleted } = await prisma.repository.deleteMany({
      where: {
        projectId: project.id,
        providerId: { notIn: providerIdsToKeep },
      },
    });
    logger.info(`Deleted ${deleted} repositories in project ${project.id} that no longer have configuration files.`);

    // synchronize each repository
    let updated = 0;
    for (const [sci, repository] of syncPairs) {
      const { updated: repoUpdated } = await this.synchronizeInner({
        project,
        repository,
        providerInfo: sci,
      });
      if (repoUpdated) updated++;
    }

    return { count: repos.length, deleted, updated };
  }

  async syncRepo(params: { repository: Repository }): Promise<SyncSingleResult> {
    const { project, provider } = this;
    const { repository } = params;

    // get repository from provider
    const providerRepo = await provider.getRepository(project.providerId, repository.providerId);
    if (!providerRepo) {
      logger.warn(`Repository ${repository.providerId} not found in project ${project.id}.`);
      return { updated: false };
    }

    // skip disabled or fork repository
    if (providerRepo.disabled || providerRepo.fork) {
      logger.info(`Skipping sync for ${providerRepo.name} in ${project.id} because it is disabled or is a fork`);
      return { updated: false };
    }

    // get the configuration file
    const sci = await provider.getConfigurationFile(toSynchronizerProject(project), providerRepo);

    // perform synchronization
    return await this.synchronizeInner({
      project,
      repository,
      providerInfo: sci,
    });
  }

  async syncRepoByProvider(params: { repositoryProviderId: string }): Promise<SyncSingleResult> {
    const { project, provider } = this;
    const { repositoryProviderId } = params;

    // get repository from provider
    const providerRepo = await provider.getRepository(project.providerId, repositoryProviderId);
    if (!providerRepo) {
      logger.warn(`Repository ${repositoryProviderId} not found in project ${project.id}.`);
      return { updated: false };
    }

    // skip disabled or fork repository
    if (providerRepo.disabled || providerRepo.fork) {
      logger.info(`Skipping sync for ${providerRepo.name} in ${project.id} because it is disabled or is a fork`);
      return { updated: false };
    }

    // get the configuration file
    const sci = await provider.getConfigurationFile(toSynchronizerProject(project), providerRepo);

    // get the repository from the database
    const repository = await prisma.repository.findUnique({
      where: {
        projectId_providerId: { projectId: project.id, providerId: providerRepo.id },
      },
    });

    // perform synchronization
    return await this.synchronizeInner({
      project,
      repository,
      providerInfo: sci,
    });
  }

  private async synchronizeInner({
    project,
    repository,
    providerInfo,
  }: {
    project: Project;
    repository: Repository | null;
    providerInfo: SynchronizerConfigurationItem;
  }): Promise<SyncSingleResult> {
    // ensure not null (can be null when deleted and an event is sent)
    if (!providerInfo.hasConfiguration) {
      // delete repository
      if (repository) {
        logger.info(`Deleting '${repository.slug}' in ${project.id} as it no longer has a configuration file.`);
        await prisma.repository.delete({ where: { id: repository.id } });
      }

      return { updated: false };
    }

    // check if the file changed (different commit)
    let commitChanged: boolean = true; // assume changes unless otherwise
    const commitId = providerInfo.commitId;
    if (repository) {
      commitChanged = commitId !== repository.latestCommit;
    }

    // create repository
    if (!repository) {
      repository = await prisma.repository.create({
        data: {
          id: generateId(),
          projectId: project.id,
          providerId: providerInfo.id,
          name: providerInfo.name,
          slug: providerInfo.slug,
          url: providerInfo.url,
          permalink: providerInfo.permalink,
          latestCommit: commitId,
          configFileContents: providerInfo.content,
          synchronizationStatus: 'pending',
        },
      });
    }

    // if the name/slug/url of the repository has changed then we assume the commit changed so that we update stuff
    if (
      repository.name !== providerInfo.name ||
      repository.slug !== providerInfo.slug ||
      repository.url !== providerInfo.url
    ) {
      commitChanged = true;
    }

    if (!commitChanged) return { updated: false };

    // at this point we know the commit or info changed
    logger.info(`Changes detected for repository '${providerInfo.slug}' in project ${project.id} ...`);

    // update repository info
    let _config: DependabotConfig;
    let syncError: string | null = null;
    try {
      _config = await parseDependabotConfig({
        configContents: providerInfo.content!,
        configPath: providerInfo.path!,
        variableFinder: () => undefined,
      });
    } catch (error) {
      syncError = (error as Error).message;
    }

    repository = await prisma.repository.update({
      where: { id: repository.id },
      data: {
        name: providerInfo.name,
        slug: providerInfo.slug,
        url: providerInfo.url,
        latestCommit: commitId,
        configFileContents: providerInfo.content,
        synchronizationStatus: syncError ? 'failed' : 'success',
        synchronizationError: syncError,
        synchronizedAt: new Date(),
      },
    });

    // TODO: save updates from parsed config into own table/collection

    if (this.trigger) {
      // trigger update jobs for the whole repository
      await start(triggerUpdateJobs, [
        {
          organizationId: this.organization.id,
          projectId: project.id,
          repositoryId: repository.id,
          repositoryUpdateId: undefined, // run all
          trigger: 'synchronization',
        } satisfies TriggerUpdateJobsWorkflowOptions,
      ]);
    }

    return { updated: true };
  }
}
