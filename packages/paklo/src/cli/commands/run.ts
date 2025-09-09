import { stdin, stdout } from 'node:process';
import readline from 'node:readline/promises';
import { Command, Option } from 'commander';
import { z } from 'zod/v4';

import { AzureLocalJobsRunner, type AzureLocalJobsRunnerOptions, extractUrlParts, getDependabotConfig } from '@/azure';
import {
  DEFAULT_EXPERIMENTS,
  DEPENDABOT_DEFAULT_AUTHOR_EMAIL,
  DEPENDABOT_DEFAULT_AUTHOR_NAME,
  parseExperiments,
} from '@/dependabot';
import { logger } from '../logger';
import { type HandlerOptions, handlerOptions } from './base';

const MERGE_STRATEGIES = ['squash', 'rebase', 'merge'] as const;
const schema = z.object({
  organisationUrl: z.string(),
  project: z.string(),
  repository: z.string(),
  gitToken: z.string(),
  githubToken: z.string().optional(),
  outDir: z.string(),
  jobTokenOverride: z.string().optional(),
  credentialsTokenOverride: z.string().optional(),
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
  experiments: z.string().optional(),
  updaterImage: z.string().optional(),
  debug: z.boolean(),
  dryRun: z.boolean(),
});
type Options = z.infer<typeof schema>;

async function handler({ options, error }: HandlerOptions<Options>) {
  let { organisationUrl } = options;
  const {
    gitToken,
    project,
    repository,
    authorName,
    authorEmail,
    experiments: rawExperiments,
    updaterImage,
    ...remainingOptions
  } = options;

  // Convert experiments from comma separated key value pairs to a record
  // If no experiments are defined, use the default experiments
  let experiments = parseExperiments(rawExperiments);
  if (!experiments) {
    experiments = DEFAULT_EXPERIMENTS;
    logger.debug('No experiments provided; Using default experiments.');
  }
  logger.debug(`Experiments: ${JSON.stringify(experiments)}`);

  if (updaterImage) {
    // If the updater image is provided but does not contain the "{ecosystem}" placeholder, tell the user they've misconfigured it
    if (!updaterImage.includes('{ecosystem}')) {
      error(
        `Dependabot Updater image '${updaterImage}' is invalid. ` +
          `Please ensure the image contains a "{ecosystem}" placeholder to denote the package ecosystem; e.g. "ghcr.io/dependabot/dependabot-updater-{ecosystem}:latest"`,
      );
      return;
    }
  }

  function secretMasker(secret: string) {
    // TODO: implement this (basically hide from logs)
  }

  // extract url parts
  if (!organisationUrl.endsWith('/')) organisationUrl = `${organisationUrl}/`; // without trailing slash the extraction fails
  const url = extractUrlParts({ organisationUrl, project, repository });

  // prepare to find variables from env or by asking user for input
  const variables = new Map<string, string>();
  const rl = readline.createInterface({ input: stdin, output: stdout });
  async function variableFinder(name: string) {
    // first, check cache
    if (variables.has(name)) return variables.get(name);

    // second, check environment
    let value = process.env[name];
    if (value) {
      logger.trace(`Found value for variable named: ${name} in environment`);
      variables.set(name, value);
      return value;
    }

    // finally, ask user
    logger.trace(`Asking value for variable named: ${name}`);
    value = await rl.question(`Please provide the value for '${name}': `);
    variables.set(name, value);
    return value;
  }

  // Parse dependabot configuration file
  const config = await getDependabotConfig({
    url,
    token: gitToken,
    variableFinder,
  });
  rl.close();
  logger.info(
    `Configuration file valid: ${config.updates.length} update(s) and ${config.registries?.length ?? 'no'} registries.`,
  );

  try {
    const runnerOptions: AzureLocalJobsRunnerOptions = {
      config,
      secretMasker,

      url,
      gitToken,
      author: { email: authorEmail, name: authorName },
      experiments,
      updaterImage,
      ...remainingOptions,
    };
    const runner = new AzureLocalJobsRunner(runnerOptions);
    const result = await runner.run();
    const success = result.every((r) => r.success);
    if (!success) {
      error(result.map((r) => r.message).join('\n'));
      return;
    }
  } catch (err) {
    error((err as Error).message);
    return;
  }
}

export const command = new Command('run')
  .description('Run dependabot updates for a given repository.')
  .requiredOption(
    '--organisation-url <ORGANISATION-URL>',
    'URL of the organisation e.g. https://dev.azure.com/my-org or https://my-org.visualstudio.com or http://my-org.com:8443/tfs',
  )
  .requiredOption('--project <PROJECT>', 'Name or ID of the project')
  .requiredOption('--repository <REPOSITORY>', 'Name or ID of the repository')
  .requiredOption('--git-token <GIT-TOKEN>', 'Token to use for authenticating access to the git repository.')
  .option(
    '--github-token <GITHUB-TOKEN>',
    'GitHub token to use for authentication. If not specified, you may get rate limited.',
  )
  .option('--out-dir', 'Working directory.', 'work')
  .option(
    '--job-token-override <JOB-TOKEN-OVERRIDE>',
    'Override for the job token. This should be used for testing only.',
  )
  .option(
    '--credentials-token-override <CREDENTIALS-TOKEN-OVERRIDE>',
    'Override for the credentials token. This should be used for testing only.',
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
  .option(
    '--experiments <EXPERIMENTS>',
    'Comma-separated list of experiments to enable. If not set, default experiments will be used.',
  )
  .option(
    '--updater-image <UPDATER-IMAGE>',
    'The dependabot-updater docker image to use for updates. e.g. ghcr.io/dependabot/dependabot-updater-{ecosystem}:latest',
  )
  .option('--port <PORT>', 'Port to run the API server on.', '3000')
  .option('--debug', 'Whether to enable debug logging.', false)
  .option('--dry-run', 'Whether to enable dry run mode.', false)
  .action(
    async (...args) =>
      await handler(
        await handlerOptions({
          schema,
          input: {
            ...args[0],
          },
          command: args.at(-1),
        }),
      ),
  );
