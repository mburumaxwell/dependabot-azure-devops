import { type DependabotConfig, makeDirectoryKey, parseDependabotConfig } from '@paklo/core/dependabot';
import { requestTriggerUpdateJobs } from '@/actions/repositories/trigger';
import { generateCron } from '@/lib/cron';
import { environment } from '@/lib/environment';
import { PakloId } from '@/lib/ids';
import { logger } from '@/lib/logger';
import { getMongoCollection } from '@/lib/mongodb';
import { type Organization, type OrganizationCredential, type Project, prisma, type Repository } from '@/lib/prisma';
import { type ISyncProvider, type SynchronizerConfigurationItem, toSynchronizerProject } from './provider';

export type SyncResult = { count: number; deleted: number; updated: number };
export type SyncSingleResult = { skipped?: boolean; updated: boolean };

const MAX_NON_PROD_REPOS = 1;

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
    logger.debug(`Updating info for project ${project.id}.`);
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
      if (!environment.production && syncPairs.filter(([item]) => item.hasConfiguration).length >= MAX_NON_PROD_REPOS) {
        logger.debug(`Development mode: limiting to syncing ${MAX_NON_PROD_REPOS} repository.`);
        break;
      }

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
    logger.debug(`Deleted ${deleted} repositories in project ${project.id} that no longer have configuration files.`);

    // synchronize each repository
    let updated = 0;
    for (const [sci, repository] of syncPairs) {
      const { updated: repoUpdated } = await this.synchronizeInner({
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
      logger.debug(`Skipping sync for ${providerRepo.name} in ${project.id} because it is disabled or is a fork`);
      return { updated: false };
    }

    // get the configuration file
    const sci = await provider.getConfigurationFile(toSynchronizerProject(project), providerRepo);

    // perform synchronization
    return await this.synchronizeInner({
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
      logger.debug(`Skipping sync for ${providerRepo.name} in ${project.id} because it is disabled or is a fork`);
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
      repository,
      providerInfo: sci,
    });
  }

  private async synchronizeInner({
    repository,
    providerInfo,
  }: {
    repository: Repository | null;
    providerInfo: SynchronizerConfigurationItem;
  }): Promise<SyncSingleResult> {
    const { organization, project, trigger } = this;
    // ensure not null (can be null when deleted and an event is sent)
    if (!providerInfo.hasConfiguration) {
      // delete repository
      if (repository) {
        logger.debug(`Deleting '${repository.slug}' in ${project.id} as it no longer has a configuration file.`);
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

    // create repository, if it does not exist
    if (!repository) {
      // check if adding this repository would exceed the limit
      const existingCount = await prisma.repository.count({ where: { projectId: project.id } });
      if (!environment.production && existingCount + 1 > MAX_NON_PROD_REPOS) {
        logger.debug(
          `Development mode: skipping creation of repository '${providerInfo.slug}' as it would exceed the limit.`,
        );
        return { skipped: true, updated: false };
      }

      // create repository
      repository = await prisma.repository.create({
        data: {
          id: PakloId.generate('repository'),
          projectId: project.id,
          providerId: providerInfo.id,
          name: providerInfo.name,
          slug: providerInfo.slug,
          url: providerInfo.url,
          permalink: providerInfo.permalink,
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
    logger.debug(`Changes detected for repository '${providerInfo.slug}' in project ${project.id} ...`);

    // parse the config
    let config: DependabotConfig | undefined;
    let syncError: string | undefined;
    try {
      config = await parseDependabotConfig({
        configContents: providerInfo.content!,
        configPath: providerInfo.path!,
        // no variable replacement as this happens during job creation
        variableFinder: () => undefined,
      });
      syncError = undefined;
    } catch (error) {
      config = undefined;
      syncError = (error as Error).message;
    }

    if (!config && !syncError) {
      throw new Error('Unexpected error: config is undefined but no sync error was reported.');
    }

    // update repository
    repository = await prisma.repository.update({
      where: { id: repository.id },
      data: {
        name: providerInfo.name,
        slug: providerInfo.slug,
        url: providerInfo.url,
        latestCommit: commitId,
        configFileContents: providerInfo.content,
        configPath: providerInfo.path,
        synchronizationStatus: syncError ? 'failed' : 'success',
        synchronizationError: syncError,
        synchronizedAt: new Date(),
      },
    });

    // if there is no valid config, we disable existing updates
    if (!config) {
      // disable existing updates since we are not deleting them
      await prisma.repositoryUpdate.updateMany({
        where: { repositoryId: repository.id },
        data: { enabled: false },
      });

      // no further processing
      return { updated: true };
    }

    // get the updates for this repository and check which need to be removed and which added/updated
    const updates = config.updates;
    const updatesMap = Object.fromEntries(updates.map((u) => [makeDirectoryKey(u), u]));
    const repositoryUpdates = await prisma.repositoryUpdate.findMany({
      where: { repositoryId: repository.id },
    });
    const updatesToDelete = repositoryUpdates.filter((u) => !updatesMap[makeDirectoryKey(u)]);
    const updatesToDeleteIds = updatesToDelete.map((u) => u.id);
    const { count: deleted } = await prisma.repositoryUpdate.deleteMany({
      where: { id: { in: updatesToDeleteIds } },
    });
    const collection = await getMongoCollection('repository_update_dependencies');
    await collection.deleteMany({ _id: { $in: updatesToDeleteIds } });
    logger.debug(`Deleted ${deleted} updates in repository ${repository.id} that have been removed.`);
    const updatesToUpsert = updates;
    for (const update of updatesToUpsert) {
      const directoryKey = makeDirectoryKey(update);
      const timezone = update.schedule.timezone;
      const { cron, next: nextUpdateJobAt } = generateCron(update.schedule, timezone);
      await prisma.repositoryUpdate.upsert({
        where: {
          repositoryId_ecosystem_directoryKey: {
            repositoryId: repository.id,
            ecosystem: update['package-ecosystem'],
            directoryKey,
          },
        },
        create: {
          id: PakloId.generate('repository_update'),
          repositoryId: repository.id,
          enabled: true,
          ecosystem: update['package-ecosystem'],
          directory: update.directory,
          directories: update.directories,
          directoryKey,
          cron,
          timezone,
          nextUpdateJobAt,
          files: [], // will be populated when running update jobs
        },
        update: {
          enabled: true,
          cron,
          timezone,
          nextUpdateJobAt,
        },
      });
    }

    // trigger update jobs for the whole repository, if requested
    if (trigger) {
      await requestTriggerUpdateJobs({
        organizationId: organization.id,
        projectId: project.id,
        repositoryId: repository.id,
        repositoryUpdateIds: undefined, // run all updates
        trigger: 'synchronization',
      });
    }

    return { updated: true };
  }
}
