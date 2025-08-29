import { Command, Option } from 'commander';
import * as yaml from 'js-yaml';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
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
  makeRandomJobToken,
  mapPackageEcosystemToPackageManager,
  type DependabotOperation,
} from '@/dependabot';
import { type SecurityVulnerability } from '@/github';
import { logger } from '../logger';
import { handlerOptions, type HandlerOptions } from './base';

const MERGE_STRATEGIES = ['squash', 'rebase', 'merge'] as const;
const schema = z.object({
  organisationUrl: z.string(),
  project: z.string(),
  repository: z.string(),
  gitToken: z.string(),
  githubToken: z.string().optional(),
  forListDependencies: z.boolean(),
  pullRequestId: z.coerce.string().optional(),
  outDir: z.string(),
  generateOnly: z.boolean(),
  port: z.coerce.number().min(1).max(65535),
  autoApprove: z.boolean(),
  autoApproveToken: z.string().optional(),
  setAutoComplete: z.boolean(),
  mergeStrategy: z.enum(MERGE_STRATEGIES),
  autoCompleteIgnoreConfigIds: z.array(z.number()),
  authorName: z.string(),
  authorEmail: z.email(),
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
    forListDependencies,
    pullRequestId,
    outDir,
    generateOnly,
    port,
    autoApprove,
    autoApproveToken,
    setAutoComplete,
    mergeStrategy,
    autoCompleteIgnoreConfigIds,
    authorName,
    authorEmail,
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

  // Prepare local server if we are not in generate-only mode
  const jobToken = makeRandomJobToken();
  let server: AzureLocalDependabotServer | undefined = undefined;
  if (!generateOnly) {
    const serverOptions: AzureLocalDependabotServerOptions = {
      apiKey: jobToken,
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
    server = new AzureLocalDependabotServer(serverOptions);
    server.start(port);
  }

  // create output directory if it does not exist
  if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

  const updates = config.updates;
  for (const update of updates) {
    const updateId = updates.indexOf(update).toString();
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

    // If this is a security-only update (i.e. 'open-pull-requests-limit: 0'), then we first need to discover the dependencies
    // that need updating and check each one for vulnerabilities. This is because Dependabot requires the list of vulnerable dependencies
    // to be supplied in the job definition of security-only update job, it will not automatically discover them like a versioned update does.
    // https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/configuring-dependabot-security-updates#overriding-the-default-behavior-with-a-configuration-file
    let securityVulnerabilities: SecurityVulnerability[] = [];
    let dependencyNamesToUpdate: string[] = [];
    const securityUpdatesOnly = update['open-pull-requests-limit'] === 0;
    if (securityUpdatesOnly) {
      // TODO: handle this
      securityVulnerabilities = [];
      dependencyNamesToUpdate = [];
      error('Security only updates not yet implemented. Sorry');
      return;
    }

    let operation: DependabotOperation | undefined = undefined;
    if (forListDependencies) {
      operation = builder.forDependenciesList({
        id: `discover-${updateId}-${update['package-ecosystem']}-dependency-list`,
      });
    } else {
      if (pullRequestId) {
        operation = builder.forUpdate({
          id: `update-pr-${pullRequestId}`,
          existingPullRequests: existingPullRequestDependenciesForPackageManager,
          pullRequestToUpdate: existingPullRequestsForPackageManager[pullRequestId]!,
          securityVulnerabilities,
        });
      } else {
        operation = builder.forUpdate({
          id: `update-${updateId}-${update['package-ecosystem']}-${securityUpdatesOnly ? 'security-only' : 'all'}`,
          dependencyNamesToUpdate,
          existingPullRequests: existingPullRequestDependenciesForPackageManager,
          securityVulnerabilities,
        });
      }
    }

    const contents = yaml.dump({
      job: operation.job,
      credentials: operation.credentials,
    });
    logger.trace(`JobConfig:\r\n${contents}`);
    const outputPath = join(outDir, `${operation.job.id}.yaml`);
    await writeFile(outputPath, contents);

    // if we only wanted to generate the files, continue to the next one
    if (generateOnly) continue;

    // add the job to the local server for tracking
    server!.addJob({ ...operation, token: jobToken });

    // TODO: run the docker container(s) using logic from dependabot-action
    await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
    error('This has not been implemented yet. Sorry');
  }

  server?.stop();
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
  .option('--for-list-dependencies', 'Whether to only generate the job for listing dependencies.', false)
  .option(
    '--pull-request-id <PULL-REQUEST-ID>',
    'Identifier of pull request to update. If not specified, a job that updates everything is generated.',
  )
  .option('--out-dir', 'Output directory. If not specified, defaults to "dependabot-jobs".', 'dependabot-jobs')
  .option('--auto-approve', 'Whether to automatically approve the pull request.', false)
  .option('--auto-approve-token <AUTO-APPROVE-TOKEN>', 'Token to use for auto-approving the pull request.')
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
  .option('--generate-only', 'Whether to only generate the job files without running it.', false)
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
