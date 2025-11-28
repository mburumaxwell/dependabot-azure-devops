import {
  DEFAULT_EXPERIMENTS,
  type DependabotConfig,
  DependabotJobBuilder,
  makeDirectoryKey,
  parseDependabotConfig,
} from '@paklo/core/dependabot';
import { Keygen } from '@paklo/core/keygen';
import { FatalError, getWorkflowMetadata, sleep, type WorkflowMetadata } from 'workflow';
import { getGithubToken, getSecretValue } from '@/actions/organizations';
import { SequenceNumber } from '@/lib/ids';
import { logger } from '@/lib/logger';
import { prisma, type UpdateJob, type UpdateJobPlatform, type UpdateJobTrigger } from '@/lib/prisma';

export type TriggerUpdateJobsWorkflowOptions = {
  organizationId: string;
  projectId: string;
  repositoryId: string;
  /**
   * Optional identifiers of the repository updates.
   * When `undefined` or an empty array all updates in the repository are scheduled to run.
   */
  repositoryUpdateIds?: string[];
  trigger: UpdateJobTrigger;
};

export async function triggerUpdateJobs(options: TriggerUpdateJobsWorkflowOptions) {
  'use workflow';

  const { workflowRunId } = getWorkflowMetadata();
  const { ids } = await getOrCreateUpdateJobs({ workflowRunId, ...options });
  for (const id of ids) {
    await runJob(id);
  }
  return { ids };
}

type GetOrCreateUpdateJobOptions = TriggerUpdateJobsWorkflowOptions & Pick<WorkflowMetadata, 'workflowRunId'>;
async function getOrCreateUpdateJobs(options: GetOrCreateUpdateJobOptions) {
  'use step';

  const { organizationId, projectId, repositoryId, repositoryUpdateIds, trigger, workflowRunId } = options;

  // fetch related entities in parallel
  const [organization, organizationCredential, project, repository] = await Promise.all([
    prisma.organization.findUnique({ where: { id: organizationId } }),
    prisma.organizationCredential.findUnique({ where: { id: organizationId } }),
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.repository.findUnique({ where: { id: repositoryId } }),
  ]);
  if (!organization || !organizationCredential || !project || !repository) {
    throw new FatalError('Organization, Project, or Repository not found');
  }

  // if no specific repository updates are provided, fetch all updates for the repository
  const hasRequestedSpecificUpdates = repositoryUpdateIds && repositoryUpdateIds.length > 0;
  const repositoryUpdates = await prisma.repositoryUpdate.findMany({
    where: {
      id: hasRequestedSpecificUpdates ? { in: repositoryUpdateIds } : undefined,
      repositoryId: hasRequestedSpecificUpdates ? undefined : repositoryId,
    },
  });

  let config: DependabotConfig | undefined;
  const githubToken = await getGithubToken({ id: organization.id });

  // work on each update
  const existingUpdateJobs: UpdateJob[] = [];
  const createdUpdateJobs: UpdateJob[] = [];
  for (const repoUpdate of repositoryUpdates) {
    // a job is already existing for this run if it matches: ecosystem, directoryKey, workflowRunId
    const directoryKey = makeDirectoryKey(repoUpdate);
    const existingJob = await prisma.updateJob.findFirst({
      where: { ecosystem: repoUpdate.ecosystem, directoryKey, workflowRunId },
    });

    // if job already exists, skip to next
    if (existingJob) {
      logger.debug(
        `A job for update '${repoUpdate.repositoryId}(${repoUpdate.id})' in project '${projectId}' requested by event '${workflowRunId}' already exists. Skipping it's creation ...`,
      );
      existingUpdateJobs.push(existingJob);
      continue;
    }

    // parse config if not already done
    // parsing config happens once here because the repository is one here
    // however, to avoid repeating calls for secret lookups, we cache the parsed config
    if (!config) {
      const variables = new Map<string, string | undefined>();
      config = await parseDependabotConfig({
        configContents: repository.configFileContents!,
        configPath: repository.configPath!,
        async variableFinder(name) {
          // first, check cache
          if (variables.has(name)) return variables.get(name);

          // second, check organization secrets
          const value = await getSecretValue({ organizationId: organization.id, name });
          variables.set(name, value);
          return value;
        },
      });
    }

    const update = config.updates.find((u) => makeDirectoryKey(u) === directoryKey);
    if (!update) {
      logger.warn(
        `No matching update found in configuration for repository update '${repoUpdate.id}' (directoryKey: '${directoryKey}'). Skipping job creation.`,
      );
      continue;
    }

    const openPullRequestsLimit = update['open-pull-requests-limit']!;
    const securityUpdatesOnly = openPullRequestsLimit === 0;
    if (securityUpdatesOnly) {
      // TODO: handle security-only updates once we are storing "dependency graph"

      // we skip security updates only for now
      logger.warn(
        `Repository update '${repoUpdate.id}' requests security updates only, which is not yet supported. Skipping job creation.`,
      );
      continue;
    }

    const builder = new DependabotJobBuilder({
      source: {
        provider: organization.type,
        hostname: organization.providerHostname,
        'api-endpoint': organization.providerApiEndpoint,
        'repository-slug': repository.slug,
      },
      config,
      update,
      systemAccessToken: organizationCredential.token,
      githubToken: githubToken,
      experiments: DEFAULT_EXPERIMENTS,
      debug: false,
    });
    const { job, credentials } = builder.forUpdate({
      // TODO: figure out how to pass appropriate values here
      command: undefined,
      dependencyNamesToUpdate: undefined,
      existingPullRequests: [],
      securityVulnerabilities: undefined,
    });

    // determine existing PR count (TODO: implement properly)
    const openPullRequestsCount = 0;
    if (openPullRequestsLimit > 0 && openPullRequestsCount >= openPullRequestsLimit) {
      // skip creating job as limit is reached
      continue;
    }

    // decide on platform (TODO: this may need to be placed at org level)
    const platform: UpdateJobPlatform = 'azure_pipelines';

    // create new job
    const newJob = await prisma.updateJob.create({
      data: {
        id: SequenceNumber.generate().toString(),
        status: 'scheduled',
        trigger,

        organizationId: organization.id,
        projectId: project.id,
        repositoryId: repository.id,
        repositoryUpdateId: repoUpdate.id,
        repositorySlug: repository.slug,
        workflowRunId,
        platform,

        commit: repository.latestCommit!,
        ecosystem: repoUpdate.ecosystem,
        directory: repoUpdate.directory,
        directories: repoUpdate.directories,
        directoryKey,

        secret: {
          create: {
            jobToken: Keygen.generate({ length: 48 }),
            credentialsToken: Keygen.generate({ length: 48 }),
          },
        },

        config: JSON.stringify(job),
        credentials: JSON.stringify(credentials),

        startedAt: null,
        finishedAt: null,
        duration: null,
        externalLogsUrl: null,
        downloadLogsUrl: null,
        errorType: null,
        errorDetails: null,
      },
    });
    createdUpdateJobs.push(newJob);

    // update the RepositoryUpdate
    await prisma.repositoryUpdate.update({
      where: { id: repoUpdate.id },
      data: {
        latestUpdateJobId: newJob.id,
        latestUpdateJobStatus: newJob.status,
        latestUpdateJobAt: newJob.createdAt,
      },
    });
  }

  return {
    ids: [...existingUpdateJobs, ...createdUpdateJobs].map((job) => job.id),
    existing: existingUpdateJobs.length,
    created: createdUpdateJobs.length,
  };
}

async function runJob(id: string) {
  'use step';

  const job = await prisma.updateJob.findUnique({ where: { id } });
  if (!job) {
    logger.error(`Update job with ID '${id}' not found.`);
    return;
  }

  // TODO: implement job execution logic
  await sleep('5s');
}
