import { Command, Option } from 'commander';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { stdin, stdout } from 'node:process';
import readline from 'node:readline/promises';
import { z } from 'zod/v4';

import {
  AzureDevOpsWebApiClient,
  AzureLocalDependabotServer,
  extractUrlParts,
  getDependabotConfig,
  parsePullRequestProperties,
  type AzureLocalDependabotServerOptions,
} from '@/azure';
import {
  DEFAULT_EXPERIMENTS,
  DEPENDABOT_DEFAULT_AUTHOR_EMAIL,
  DEPENDABOT_DEFAULT_AUTHOR_NAME,
  DependabotJobBuilder,
  JobRunner,
  JobRunnerImagingError,
  JobRunnerUpdaterError,
  makeRandomJobToken,
  mapPackageEcosystemToPackageManager,
  type DependabotCredential,
  type DependabotJobConfig,
  type DependabotUpdate,
} from '@/dependabot';
import {
  GitHubGraphClient,
  SecurityVulnerabilitySchema,
  filterVulnerabilities,
  getGhsaPackageEcosystemFromDependabotPackageManager,
  type Package,
  type SecurityVulnerability,
} from '@/github';
import { logger } from '../logger';
import { handlerOptions, type HandlerOptions } from './base';

const MERGE_STRATEGIES = ['squash', 'rebase', 'merge'] as const;
const schema = z.object({
  organisationUrl: z.string(),
  project: z.string(),
  repository: z.string(),
  gitToken: z.string(),
  githubToken: z.string().optional(),
  pullRequestId: z.coerce.string().optional(),
  outDir: z.string(),
  jobToken: z.string().optional(),
  credentialsToken: z.string().optional(),
  port: z.coerce.number().min(1).max(65535),
  securityAdvisoriesFile: z.string().optional(),
  autoApprove: z.boolean(),
  autoApproveToken: z.string().optional(),
  setAutoComplete: z.boolean(),
  mergeStrategy: z.enum(MERGE_STRATEGIES),
  autoCompleteIgnoreConfigIds: z.coerce.number().array(),
  authorName: z.string(),
  authorEmail: z.email(),
  targetUpdateIds: z.coerce.number().array(),
  debug: z.boolean(),
  dryRun: z.boolean(),
});
type Options = z.infer<typeof schema>;

async function handler({ options, error }: HandlerOptions<Options>) {
  let { organisationUrl } = options;
  const {
    githubToken,
    gitToken,
    project,
    repository,
    pullRequestId,
    outDir,
    jobToken: jobTokenOverride,
    credentialsToken: credentialsTokenOverride,
    port,
    securityAdvisoriesFile,
    autoApprove,
    autoApproveToken,
    setAutoComplete,
    mergeStrategy,
    autoCompleteIgnoreConfigIds,
    authorName,
    authorEmail,
    targetUpdateIds,
    debug,
    dryRun,
  } = options;

  // extract url parts
  if (!organisationUrl.endsWith('/')) organisationUrl = `${organisationUrl}/`; // without trailing slash the extraction fails
  const url = extractUrlParts({ organisationUrl, project, repository });

  // prepare to find variables by asking user for input
  const variables = new Map<string, string>();
  const rl = readline.createInterface({ input: stdin, output: stdout });
  async function variableFinder(name: string) {
    if (variables.has(name)) return variables.get(name);
    logger.trace(`Asking value for variable named: ${name}`);
    const value = await rl.question(`Please provide the value for '${name}': `);
    variables.set(name, value);
    return value;
  }

  // Parse dependabot configuration file
  const config = await getDependabotConfig({
    url,
    token: gitToken,
    rootDir: process.cwd(),
    variableFinder,
  });
  rl.close();
  logger.info(
    `Configuration file valid: ${config.updates.length} update(s) and ${config.registries?.length ?? 'no'} registries.`,
  );

  // Print a warning about the required workarounds for security-only updates, if any update is configured as such
  // TODO: If and when Dependabot supports a better way to do security-only updates, remove this.
  if (config.updates?.some((u) => u['open-pull-requests-limit'] === 0)) {
    logger.warn(
      'Security-only updates incur a slight performance overhead due to limitations in Dependabot CLI. For more info, see: https://github.com/mburumaxwell/dependabot-azure-devops/blob/main/README.md#configuring-security-advisories-and-known-vulnerabilities',
    );
  }

  // Initialise the DevOps API clients (one for authoring the other for auto-approving (if configured))
  const authorClient = new AzureDevOpsWebApiClient(url, gitToken, debug);
  const approverClient = autoApprove
    ? new AzureDevOpsWebApiClient(url, autoApproveToken || gitToken, debug)
    : undefined;

  // Fetch the active pull requests created by the author user
  const existingBranchNames = await authorClient.getBranchNames(url.project, url.repository);
  const existingPullRequests = await authorClient.getActivePullRequestProperties(
    url.project,
    url.repository,
    await authorClient.getUserId(),
  );

  // The API urls is constant when working in this CLI. Asking people to setup NGROK or similar
  // just to get HTTPS for the job token to be used is too much hassle.
  const dependabotApiUrl = `http://host.docker.internal:${port}/api`;

  // Prepare local server
  const serverOptions: AzureLocalDependabotServerOptions = {
    url,
    authorClient,
    autoApprove,
    approverClient,
    setAutoComplete,
    mergeStrategy,
    autoCompleteIgnoreConfigIds,
    existingBranchNames,
    existingPullRequests,
    author: { email: authorEmail, name: authorName },
    debug,
    dryRun,
  };
  const server = new AzureLocalDependabotServer(serverOptions);
  server.start(port);
  // give the server a second to start
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // If update identifiers are specified, select them; otherwise handle all
  let dependabotUpdatesToPerform: DependabotUpdate[] = [];
  if (targetUpdateIds && targetUpdateIds.length > 0) {
    for (const id of targetUpdateIds) {
      const upd = config.updates[id];
      if (!upd) {
        logger.warn(
          `
          Unable to find target update id '${id}'.
          This value should be a zero based index of the update in your config file.
          Expected range: 0-${config.updates.length - 1}
          `,
        );
      } else {
        dependabotUpdatesToPerform.push(upd);
      }
    }
  } else {
    dependabotUpdatesToPerform = config.updates;
  }

  function makeTokens() {
    return {
      jobToken: jobTokenOverride ?? makeRandomJobToken(),
      credentialsToken: credentialsTokenOverride ?? makeRandomJobToken(),
    };
  }

  try {
    for (const update of dependabotUpdatesToPerform) {
      const packageEcosystem = update['package-ecosystem'];
      const packageManager = mapPackageEcosystemToPackageManager(packageEcosystem);

      // Parse the Dependabot metadata for the existing pull requests that are related to this update
      // Dependabot will use this to determine if we need to create new pull requests or update/close existing ones
      const existingPullRequestsForPackageManager = parsePullRequestProperties(existingPullRequests, packageManager);
      const existingPullRequestDependenciesForPackageManager = Object.values(existingPullRequestsForPackageManager);

      const builder = new DependabotJobBuilder({
        source: { provider: 'azure', ...url },
        config,
        update,
        systemAccessToken: gitToken,
        githubToken,
        experiments: DEFAULT_EXPERIMENTS,
        debug: false,
      });

      let job: DependabotJobConfig | undefined = undefined;
      let credentials: DependabotCredential[] | undefined = undefined; // TODO: remove this to be handled by the ApiClient
      let jobToken: string;
      let credentialsToken: string;

      // If this is a security-only update (i.e. 'open-pull-requests-limit: 0'), then we first need to discover the dependencies
      // that need updating and check each one for vulnerabilities. This is because Dependabot requires the list of vulnerable dependencies
      // to be supplied in the job definition of security-only update job, it will not automatically discover them like a versioned update does.
      // https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/configuring-dependabot-security-updates#overriding-the-default-behavior-with-a-configuration-file
      let securityVulnerabilities: SecurityVulnerability[] = [];
      let dependencyNamesToUpdate: string[] = [];
      const securityUpdatesOnly = update['open-pull-requests-limit'] === 0;
      if (securityUpdatesOnly) {
        // Run an update job to discover all dependencies
        ({ job, credentials } = builder.forDependenciesList({}));
        ({ jobToken, credentialsToken } = makeTokens());
        server.add({ id: job.id!, update, job, jobToken, credentialsToken });
        try {
          const runner = new JobRunner({ dependabotApiUrl, job, jobToken, credentialsToken });
          await runner.run({
            outDir,
            credentials,
          });
        } catch (err) {
          if (err instanceof JobRunnerImagingError) {
            error(`Error fetching updater images: ${err.message}`);
            return;
          } else if (err instanceof JobRunnerUpdaterError) {
            error(`Error running updater: ${err.message}`);
            return;
          }
        }
        logger.info(`Update job ${job.id} completed`);

        const outputs = server.requests(job.id!);
        const packagesToCheckForVulnerabilities: Package[] | undefined = outputs!
          .find((o) => o.type == 'update_dependency_list')
          ?.data.dependencies?.map((d) => ({ name: d.name, version: d.version }));
        if (packagesToCheckForVulnerabilities?.length) {
          logger.info(
            `Detected ${packagesToCheckForVulnerabilities.length} dependencies; Checking for vulnerabilities...`,
          );

          // parse security advisories from file (private)
          if (securityAdvisoriesFile) {
            const filePath = securityAdvisoriesFile;
            if (existsSync(filePath)) {
              const fileContents = await readFile(filePath, 'utf-8');
              securityVulnerabilities = await SecurityVulnerabilitySchema.array().parseAsync(JSON.parse(fileContents));
            } else {
              logger.info(`Private security advisories file '${filePath}' does not exist`);
            }
          }
          if (githubToken) {
            const ghsaClient = new GitHubGraphClient(githubToken);
            const githubVulnerabilities = await ghsaClient.getSecurityVulnerabilitiesAsync(
              getGhsaPackageEcosystemFromDependabotPackageManager(packageManager),
              packagesToCheckForVulnerabilities || [],
            );
            securityVulnerabilities.push(...githubVulnerabilities);
          } else {
            logger.info(
              'GitHub access token is not provided; Checking for vulnerabilities from GitHub is skipped. ' +
                'This is not an issue if you are using private security advisories file.',
            );
          }

          securityVulnerabilities = filterVulnerabilities(securityVulnerabilities);

          // Only update dependencies that have vulnerabilities
          dependencyNamesToUpdate = Array.from(new Set(securityVulnerabilities.map((v) => v.package.name)));
          logger.info(
            `Detected ${securityVulnerabilities.length} vulnerabilities affecting ${dependencyNamesToUpdate.length} dependencies`,
          );
          if (dependencyNamesToUpdate.length) {
            logger.trace(dependencyNamesToUpdate);
          }
        } else {
          logger.info(`No vulnerabilities detected for update ${update['package-ecosystem']} in ${update.directory}`);
          server.clear(job.id!);
          continue; // nothing more to do for this update
        }

        server.clear(job.id!);
      }

      if (pullRequestId) {
        ({ job, credentials } = builder.forUpdate({
          existingPullRequests: existingPullRequestDependenciesForPackageManager,
          pullRequestToUpdate: existingPullRequestsForPackageManager[pullRequestId]!,
          securityVulnerabilities,
        }));
      } else {
        ({ job, credentials } = builder.forUpdate({
          dependencyNamesToUpdate,
          existingPullRequests: existingPullRequestDependenciesForPackageManager,
          securityVulnerabilities,
        }));
      }

      // add the job to the local server for tracking
      ({ jobToken, credentialsToken } = makeTokens());
      server.add({ id: job.id!, update, job, jobToken, credentialsToken });

      try {
        const runner = new JobRunner({ dependabotApiUrl, job, jobToken, credentialsToken });
        await runner.run({
          outDir,
          credentials,
        });
      } catch (err) {
        if (err instanceof JobRunnerImagingError) {
          error(`Error fetching updater images: ${err.message}`);
          return;
        } else if (err instanceof JobRunnerUpdaterError) {
          error(`Error running updater: ${err.message}`);
          return;
        }
      }
      logger.info(`Update job ${job.id} completed`);
      server.clear(job.id!);
    }
  } finally {
    server.stop();
  }
}

export const command = new Command('run')
  .description('Run dependabot updates for a given repository.')
  .argument(
    '<organisation-url>',
    'URL of the organisation e.g. https://dev.azure.com/my-org or https://my-org.visualstudio.com or http://my-org.com:8443/tfs',
  )
  .argument('<project>', 'Name or ID of the project')
  .argument('<repository>', 'Name or ID of the repository')
  .requiredOption('--git-token <GIT-TOKEN>', 'Token to use for authenticating access to the git repository.')
  .option(
    '--github-token <GITHUB-TOKEN>',
    'GitHub token to use for authentication. If not specified, you may get rate limited.',
  )
  .option(
    '--pull-request-id <PULL-REQUEST-ID>',
    'Identifier of pull request to update. If not specified, a job that updates everything is generated.',
  )
  .option('--out-dir', 'Working directory.', 'work')
  .option(
    '--job-token <JOB-TOKEN>',
    'Token to use for the job API calls. If not specified, a random token will be generated. This should be used for testing only.',
  )
  .option(
    '--credentials-token <CREDENTIALS-TOKEN>',
    'Token to use for credentials API calls. If not specified, a random token will be generated. This should be used for testing only.',
  )
  .option('--auto-approve', 'Whether to automatically approve the pull request.', false)
  .option(
    '--auto-approve-token <AUTO-APPROVE-TOKEN>',
    'Token to use for auto-approving the pull request, if different from GIT-TOKEN.',
  )
  .option(
    '--set-auto-complete',
    'Whether to set the pull request to auto-complete once all policies have been met.',
    false,
  )
  .addOption(
    new Option(
      '--merge-strategy <MERGE-STRATEGY>',
      'The merge strategy to use when auto-completing pull requests. Only applies if --set-auto-complete is set.',
    )
      .choices(MERGE_STRATEGIES)
      .default('squash'),
  )
  .option(
    '--auto-complete-ignore-config-ids <AUTO-COMPLETE-IGNORE-CONFIG-IDS...>',
    'List of config IDs to ignore when setting pull requests to auto-complete. Only applies if --set-auto-complete is set.',
    [],
  )
  .option('--author-name <AUTHOR-NAME>', 'Name to use for the git author.', DEPENDABOT_DEFAULT_AUTHOR_NAME)
  .option('--author-email <AUTHOR-EMAIL>', 'Email to use for the git author.', DEPENDABOT_DEFAULT_AUTHOR_EMAIL)
  .option('--target-update-ids <TARGET-UPDATE-IDS...>', 'List of target update IDs to perform.', [])
  .option('--security-advisories-file <SECURITY-ADVISORIES-FILE>', 'Path to private security advisories file.')
  .option('--port <PORT>', 'Port to run the API server on.', '3000')
  .option('--debug', 'Whether to enable debug logging.', false)
  .option('--dry-run', 'Whether to enable dry run mode.', false)
  .action(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (...args: any[]) =>
      await handler(
        await handlerOptions({
          schema,
          input: {
            organisationUrl: args[0],
            project: args[1],
            repository: args[2],
            ...args[3],
          },
          command: args.at(-1),
        }),
      ),
  );
