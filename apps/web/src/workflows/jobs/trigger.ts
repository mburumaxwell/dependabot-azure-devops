import {
  DEFAULT_EXPERIMENTS,
  type DependabotConfig,
  type DependabotCredential,
  DependabotJobBuilder,
  type DependabotProxyConfig,
  type FileFetcherInput,
  type FileUpdaterInput,
  makeDirectoryKey,
  mapPackageEcosystemToPackageManager,
  type PackageEcosystem,
  parseDependabotConfig,
} from '@paklo/core/dependabot';
import { Keygen } from '@paklo/core/keygen';
import {
  CA_CERT_FILENAME,
  CA_CERT_INPUT_PATH,
  CONFIG_FILE_NAME,
  extractUpdaterSha,
  JOB_INPUT_FILENAME,
  JOB_INPUT_PATH,
  JOB_OUTPUT_FILENAME,
  JOB_OUTPUT_PATH,
  PROXY_IMAGE_NAME,
  ProxyBuilder,
  REPO_CONTENTS_PATH,
  updaterImageName,
} from '@paklo/runner';
import { filesize } from 'filesize';
import { createHook, FatalError, getWorkflowMetadata, sleep, type WorkflowMetadata } from 'workflow';
import { z } from 'zod';
import { getGithubToken, getSecretValue } from '@/actions/organizations';
import {
  AzureRestError,
  type ContainerAppJob,
  consoleLogsContainer,
  containerAppsClient,
  logsContainer,
  managedAppEnvironmentId,
  resourceGroupNameJobs,
} from '@/lib/azure';
import { enableDependabotConnectivityCheck } from '@/lib/flags';
import { SequenceNumber } from '@/lib/ids';
import { logger } from '@/lib/logger';
import { prisma, type UpdateJob, type UpdateJobTrigger } from '@/lib/prisma';
import { type RegionCode, toAzureLocation } from '@/lib/regions';
import { streamToString } from '@/lib/utils';
import { config } from '@/site-config';

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

/** Result of hook waiting for job completion */
export type UpdateJobHookResult = {
  /** Indicates whether the job completed. */
  completed: boolean;
  /** Timestamp when the job was completed. */
  finishedAt?: Date;
};

export async function triggerUpdateJobs(options: TriggerUpdateJobsWorkflowOptions) {
  'use workflow';

  const { workflowRunId } = getWorkflowMetadata();
  const { ids } = await getOrCreateUpdateJobs({ workflowRunId, ...options });
  await Promise.all(ids.map((id) => runUpdateJob({ id })));

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

    // determine existing PR count (TODO: implement properly)
    const openPullRequestsCount = 0;
    if (openPullRequestsLimit > 0 && openPullRequestsCount >= openPullRequestsLimit) {
      // skip creating job as limit is reached
      continue;
    }

    const id = SequenceNumber.generate().toString();
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
      id,
      // TODO: figure out how to pass appropriate values here
      command: undefined,
      dependencyNamesToUpdate: undefined,
      existingPullRequests: [],
      securityVulnerabilities: undefined,
    });

    const jobConfig: FileFetcherInput | FileUpdaterInput = { job };

    // create new job
    const newJob = await prisma.updateJob.create({
      data: {
        id,
        status: 'scheduled',
        trigger,

        organizationId: organization.id,
        projectId: project.id,
        repositoryId: repository.id,
        repositoryUpdateId: repoUpdate.id,
        repositorySlug: repository.slug,
        workflowRunId,

        commit: repository.latestCommit!,
        ecosystem: repoUpdate.ecosystem,
        packageManager: mapPackageEcosystemToPackageManager(repoUpdate.ecosystem as PackageEcosystem),
        directory: repoUpdate.directory,
        directories: repoUpdate.directories,
        directoryKey,

        secret: {
          create: {
            jobToken: Keygen.generate({ length: 48 }),
            credentialsToken: Keygen.generate({ length: 48 }),
            hookToken: Keygen.generate({ length: 20 }),
          },
        },

        config: JSON.stringify(jobConfig),
        credentials: JSON.stringify(credentials),
        region: organization.region,

        startedAt: null,
        finishedAt: null,
        duration: null,
        errorType: null,
        errorDetails: null,
      },
    });
    createdUpdateJobs.push(newJob);
  }

  return {
    ids: [...existingUpdateJobs, ...createdUpdateJobs].map((job) => job.id),
    existing: existingUpdateJobs.length,
    created: createdUpdateJobs.length,
  };
}

export function makeResourceName({ id }: { id: string }) {
  /**
   * ACA rule:
   * A name must consist of lower case alphanumeric characters or '-',
   * start with an alphabetic character, end with an alphanumeric character,
   * and not have '--'. The length must be between 2 and 32 characters inclusive.
   *
   * Our job ID e.g. "1446430592043323392" is 19 characters long
   * So we can prefix it with "job-" to make it 23 characters long and valid.
   */
  return `job-${id}`;
}

async function runUpdateJob({ id }: { id: string }) {
  // this must not be a step as hooks can only be created in workflows

  // create and start the job resource
  const resourceName = makeResourceName({ id });
  const { hookToken } = await createAndStartJobResources({ id, resourceName });

  // create a hook that shall be used to report job completion
  const hook = createHook<UpdateJobHookResult>({ token: hookToken, metadata: { id } });

  // wait for completion (max 1 hour)
  const mayBeResult = await Promise.race([hook, sleep('1h')]);
  const completed =
    mayBeResult && typeof mayBeResult === 'object' && 'completed' in mayBeResult && mayBeResult.completed;
  const finishedAt = (completed ? mayBeResult.finishedAt : undefined) ?? new Date();

  // if completed, we wait for a short time for the container to actually complete
  if (completed) {
    await sleep('5s');
  }

  // fetch execution and stop the job resource
  let execution = await getJobResourceExecution({ resourceName });
  if (execution?.name && execution.status === 'Running') {
    await stopJobResource({ resourceName, executionName: execution.name! });
    execution = await getJobResourceExecution({ resourceName });
  }

  // we must have an execution here
  if (!execution) {
    throw new FatalError(`Failed to fetch execution status for job '${id}'.`);
  }

  // update the job based on the execution
  const executionStatus = execution.status;
  const startedAt = execution.start;
  await saveUpdateJobStatus({ id, executionStatus, startedAt, finishedAt });

  // remove job resources
  await removeJobResources({ resourceName });

  // wait 5 minutes to ensure logs are available in Azure Monitor
  await sleep('5m');

  // collect logs
  await collectJobResourceLogs({ id, resourceName, startedAt, finishedAt });

  // report for billing
  await reportUsageBilling();
}

const SECRET_NAME_PROXY_CONFIG = 'proxy-config';
const SECRET_NAME_CA_CERT = 'ca-cert';
const SECRET_NAME_JOB_CONFIG = 'job-config';
export async function createAndStartJobResources({
  id,
  resourceName,
}: {
  id: string;
  resourceName: string;
}): Promise<{ hookToken: string }> {
  'use step';

  // fetch the job and its secret
  const job = await prisma.updateJob.findUniqueOrThrow({ where: { id } });
  const secret = await prisma.updateJobSecret.findUniqueOrThrow({ where: { id: job.id } });

  const jobConfig = JSON.parse(job.config) as FileFetcherInput | FileUpdaterInput;
  const jobCredentials = JSON.parse(job.credentials) as DependabotCredential[];

  const { region } = job;
  try {
    const response = await containerAppsClient.jobs.get(resourceGroupNameJobs, resourceName);
    if (response) return { hookToken: secret.hookToken }; // already exists
  } catch (error) {
    // do nothing when it is an azure error and the code is not found
    if (error instanceof AzureRestError && error.statusCode === 404) {
    } else {
      throw error;
    }
  }

  // generate proxy config
  const ca = await ProxyBuilder.generateCertificateAuthority();
  const proxyConfig: DependabotProxyConfig = { all_credentials: jobCredentials, ca };

  const apiUrl = `${config.siteUrl}/api`;
  const proxyUrl = `http://localhost:1080`; // in the same pod/container-group
  const updaterImage = updaterImageName(job.packageManager);
  const updaterSha = extractUpdaterSha(updaterImage);

  // create the job resource
  const cachedMode = Object.hasOwn(jobConfig.job.experiments, 'proxy-cached') === true;
  const app: ContainerAppJob = {
    location: toAzureLocation(region as RegionCode)!,
    environmentId: managedAppEnvironmentId,
    configuration: {
      triggerType: 'Manual',
      manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 },
      replicaTimeout: 3600, // 1 hour
      replicaRetryLimit: 1,
      secrets: [
        { name: 'job-token', value: secret.jobToken },
        { name: SECRET_NAME_PROXY_CONFIG, value: JSON.stringify(proxyConfig) },
        { name: SECRET_NAME_CA_CERT, value: ca.cert },
        { name: SECRET_NAME_JOB_CONFIG, value: JSON.stringify(jobConfig) },
      ],
    },
    template: {
      containers: [
        {
          name: 'proxy',
          image: PROXY_IMAGE_NAME,
          resources: { cpu: 0.25, memory: '0.5Gi' },
          env: [
            { name: 'JOB_ID', value: job.id },
            { name: 'JOB_TOKEN', secretRef: 'job-token' },
            { name: 'PROXY_CACHE', value: cachedMode ? 'true' : 'false' },
            { name: 'DEPENDABOT_API_URL', value: apiUrl },
          ],
          volumeMounts: [
            { volumeName: SECRET_NAME_PROXY_CONFIG, mountPath: `/${CONFIG_FILE_NAME}`, subPath: CONFIG_FILE_NAME },
          ],
          command: ['sh', '-c', '/usr/sbin/update-ca-certificates && /update-job-proxy'],
        },
        {
          name: 'updater',
          image: updaterImage,
          // TODO: decide if this is really enough (we use 8GB in runner); consider billing
          // This affects the available ephemeral storage as well
          // https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts?tabs=smb&pivots=azure-cli#ephemeral-storage
          resources: { cpu: 1, memory: '2Gi' },
          env: [
            { name: 'DEPENDABOT_JOB_ID', value: job.id },
            { name: 'DEPENDABOT_JOB_TOKEN', value: '' },
            { name: 'DEPENDABOT_JOB_PATH', value: `${JOB_INPUT_PATH}/${JOB_INPUT_FILENAME}` },
            { name: 'DEPENDABOT_OPEN_TIMEOUT_IN_SECONDS', value: '15' },
            // not using the file share because we are not consuming the output yet
            { name: 'DEPENDABOT_OUTPUT_PATH', value: `${JOB_OUTPUT_PATH}/${JOB_OUTPUT_FILENAME}` },
            // not using the file share because we do not need to clone repos there
            { name: 'DEPENDABOT_REPO_CONTENTS_PATH', value: REPO_CONTENTS_PATH },
            { name: 'DEPENDABOT_API_URL', value: apiUrl },
            { name: 'SSL_CERT_FILE', value: '/etc/ssl/certs/ca-certificates.crt' },
            { name: 'http_proxy', value: proxyUrl },
            { name: 'HTTP_PROXY', value: proxyUrl },
            { name: 'https_proxy', value: proxyUrl },
            { name: 'HTTPS_PROXY', value: proxyUrl },
            { name: 'UPDATER_ONE_CONTAINER', value: '1' },

            // enable or disable connectivity check based on feature flag
            ...((await enableDependabotConnectivityCheck())
              ? [{ name: 'ENABLE_CONNECTIVITY_CHECK', value: '1' }]
              : [{ name: 'ENABLE_CONNECTIVITY_CHECK', value: '0' }]),

            // for updates relying on .NET (e.g. NuGet) and running on macOS (e.g. dev laptop or local MacMini),
            // we need to disable WriteXorExecute to avoid issues with emulation of Linux containers on macOS hosts
            // with Apple Silicon (M1/M2) chips
            // See - https://github.com/dotnet/runtime/issues/103063#issuecomment-2149599940
            //     - https://github.com/dependabot/dependabot-core/issues/5037
            ...(process.platform === 'darwin' ? [{ name: 'DOTNET_EnableWriteXorExecute', value: '0' }] : []),

            ...(updaterSha ? [{ name: 'DEPENDABOT_UPDATER_SHA', value: updaterSha }] : []),
          ],
          volumeMounts: [
            {
              volumeName: SECRET_NAME_CA_CERT,
              mountPath: `${CA_CERT_INPUT_PATH}/${CA_CERT_FILENAME}`,
              subPath: CA_CERT_FILENAME,
            },
            {
              volumeName: SECRET_NAME_JOB_CONFIG,
              mountPath: `${JOB_INPUT_PATH}/${JOB_INPUT_FILENAME}`,
              subPath: JOB_INPUT_FILENAME,
            },
          ],
          command: [
            '/bin/sh',
            '-c',
            [
              '/usr/sbin/update-ca-certificates',
              'mkdir -p /home/dependabot/dependabot-updater/output',
              `$DEPENDABOT_HOME/dependabot-updater/bin/run ${jobConfig.job.command === 'graph' ? 'update_graph' : 'update_files'}`,
            ].join(' && '),
          ],
        },
      ],
      volumes: [
        {
          name: SECRET_NAME_PROXY_CONFIG,
          storageType: 'Secret',
          secrets: [{ secretRef: SECRET_NAME_PROXY_CONFIG, path: CONFIG_FILE_NAME }],
        },
        {
          name: SECRET_NAME_CA_CERT,
          storageType: 'Secret',
          secrets: [{ secretRef: SECRET_NAME_CA_CERT, path: CA_CERT_FILENAME }],
        },
        {
          name: SECRET_NAME_JOB_CONFIG,
          storageType: 'Secret',
          secrets: [{ secretRef: SECRET_NAME_JOB_CONFIG, path: JOB_INPUT_FILENAME }],
        },
      ],
    },
  };
  const response = await containerAppsClient.jobs.beginCreateOrUpdateAndWait(resourceGroupNameJobs, resourceName, app);
  logger.debug(`Created ACA job: ${response.id}`);

  // start the job
  await containerAppsClient.jobs.beginStartAndWait(resourceGroupNameJobs, resourceName);
  logger.debug(`Started ACA job: ${resourceName}`);

  // update job status to running
  await prisma.updateJob.update({
    where: { id: job.id },
    data: { status: 'running', startedAt: new Date() },
  });

  return { hookToken: secret.hookToken };
}

async function saveUpdateJobStatus({
  id,
  executionStatus,
  startedAt,
  finishedAt,
}: {
  id: string;
  executionStatus: 'Failed' | string;
  startedAt: Date;
  finishedAt: Date;
}) {
  'use step';

  // a job is failed if the resource status is 'Failed' or if there is an error recorded in the job
  const updateJob = await prisma.updateJob.findUniqueOrThrow({ where: { id } });
  const failed = executionStatus === 'Failed' || !!updateJob.errorType || !!updateJob.errorDetails;

  // update the job based on the resource status
  await prisma.updateJob.update({
    where: { id },
    data: {
      // other statuses (scheduled, running) are handled elsewhere
      status: failed ? 'failed' : 'succeeded',
      startedAt,
      finishedAt,
      duration: finishedAt.getTime() - startedAt.getTime(),
    },
  });
}

export type JobResourceExecution = { name: string; start: Date; status: string };
export async function getJobResourceExecution({
  resourceName,
}: {
  resourceName: string;
}): Promise<JobResourceExecution | undefined> {
  'use step';

  try {
    for await (const execution of containerAppsClient.jobsExecutions.list(resourceGroupNameJobs, resourceName)) {
      // there is only one execution
      return {
        name: execution.name!,
        start: execution.startTime!,
        status: execution.status!,
      };
    }
  } catch (error) {
    // do nothing when it is an azure error and the code is not found
    if (error instanceof AzureRestError && error.statusCode === 404) {
      return; // no execution found to stop
    } else {
      throw error;
    }
  }
}

export async function stopJobResource({
  resourceName,
  executionName,
}: {
  resourceName: string;
  executionName: string;
}) {
  'use step';

  try {
    await containerAppsClient.jobs.beginStopExecutionAndWait(resourceGroupNameJobs, resourceName, executionName);
    logger.debug(`Stopped ACA job: ${resourceName}`);
  } catch (error) {
    // do nothing when it is an azure error and the code is not found
    if (error instanceof AzureRestError && error.statusCode === 404) {
    } else {
      throw error;
    }
  }
}

export async function removeJobResources({ resourceName }: { resourceName: string }) {
  'use step';

  try {
    await containerAppsClient.jobs.beginDeleteAndWait(resourceGroupNameJobs, resourceName);
    logger.debug(`Deleted ACA job: ${resourceName}`);
  } catch (error) {
    // do nothing when it is an azure error and the code is not found
    if (error instanceof AzureRestError && error.statusCode === 404) {
    } else {
      throw error;
    }
  }
}

const AzureMonitorLogLineSchema = z.object({
  time: z.coerce.date(),
  category: z.literal('ContainerAppConsoleLogs'),
  properties: z.object({
    ContainerJobName: z.string(),
    ContainerName: z.enum(['proxy', 'updater']),
    Log: z.string(),
  }),
});
type AzureMonitorLogLine = z.infer<typeof AzureMonitorLogLineSchema>;

export async function collectJobResourceLogs({
  id,
  resourceName,
  startedAt,
  finishedAt,
}: {
  id: string;
  resourceName: string;
  startedAt: Date;
  finishedAt: Date;
}) {
  'use step';

  /**
   * azure monitor stores the logs in blob storage in a container named 'insights-logs-containerappconsolelogs'
   * blob path format:
   * 'resourceId={upperCase(managedEnvironmentResourceId)}/y={year:d4}/m={month:d2}/d={day:d2}/h={hour:d2}/m={minute:d2}/PT1H.json'
   * e.g: resourceId=/SUBSCRIPTIONS/../RESOURCEGROUPS/../PROVIDERS/MICROSOFT.APP/MANAGEDENVIRONMENTS/../y=2025/m=12/d=05/h=16/m=00/PT1H.json
   */

  const marginMinutes = 5;
  const windowStart = new Date(startedAt.getTime() - marginMinutes * 60_1000);
  const windowEnd = new Date(finishedAt.getTime() + marginMinutes * 60_1000);

  /** Enumerate each day (UTC) between startedAt and finishedAt (inclusive) */
  function* enumerateDays(): Generator<Date> {
    // work in UTC; strip time-of-day
    const current = new Date(
      Date.UTC(windowStart.getUTCFullYear(), windowStart.getUTCMonth(), windowStart.getUTCDate()),
    );
    const end = new Date(Date.UTC(windowEnd.getUTCFullYear(), windowEnd.getUTCMonth(), windowEnd.getUTCDate()));
    while (current <= end) {
      yield new Date(current);
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  const records: { time: Date; line: string }[] = [];

  // scan only the dates that overlap the window
  for (const day of enumerateDays()) {
    // build the prefix for the day
    const prefix = [
      `resourceId=${managedAppEnvironmentId.toUpperCase()}`,
      `y=${day.getUTCFullYear()}`,
      `m=${String(day.getUTCMonth() + 1).padStart(2, '0')}`,
      `d=${String(day.getUTCDate()).padStart(2, '0')}`,
    ].join('/');

    for await (const blob of consoleLogsContainer.listBlobsFlat({ prefix })) {
      const blobClient = consoleLogsContainer.getBlobClient(blob.name);
      const download = await blobClient.download();
      const content = await streamToString(download.readableStreamBody);
      const lines = content.split(/\r?\n/);
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;

        let parsed: AzureMonitorLogLine;
        try {
          parsed = AzureMonitorLogLineSchema.parse(JSON.parse(line));
        } catch {
          continue; // skip malformed lines
        }

        // skip lines that do not belong to our job
        if (parsed.properties.ContainerJobName !== resourceName) continue;

        // skip lines outside the time window
        const { time } = parsed;
        if (time < windowStart || time > windowEnd) continue;

        const prefix = ((containerName: 'proxy' | 'updater') => {
          switch (containerName) {
            case 'proxy':
              return ' proxy';
            case 'updater':
              return 'updater';
          }
        })(parsed.properties.ContainerName);

        records.push({ time, line: `${prefix} | ${parsed.properties.Log}` });
      }
    }
  }

  // sort records by time
  records.sort((a, b) => a.time.getTime() - b.time.getTime());

  // merge the records into a single log
  const mergedLog =
    records.length === 0
      ? 'No logs found for this job in the time window.'
      : `${records.map((r) => r.line).join('\n')}\n`;

  // upload (overwrites) the merged log to the destination blob
  const mergedLogLength = Buffer.byteLength(mergedLog, 'utf-8');
  const blobClient = logsContainer.getBlockBlobClient(`${id}.txt`);
  await blobClient.upload(mergedLog, mergedLogLength, {
    blobHTTPHeaders: { blobContentType: 'text/plain; charset=utf-8' },
  });
  logger.debug(`Uploaded logs for job '${id}' to blob storage (${filesize(mergedLogLength)}).`);
}

export async function reportUsageBilling() {
  'use step';

  // TODO: implement usage reporting
}
