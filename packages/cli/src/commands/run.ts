import fs from 'node:fs/promises';
import { dirname } from 'node:path';
import { stdin, stdout } from 'node:process';
import readline from 'node:readline/promises';
import {
  AZDO_PULL_REQUEST_MERGE_STRATEGIES,
  AzdoPullRequestMergeStrategySchema,
  extractRepositoryUrl,
  getDependabotConfig,
} from '@paklo/core/azure';
import {
  DEFAULT_EXPERIMENTS,
  DEPENDABOT_COMMANDS,
  DEPENDABOT_DEFAULT_AUTHOR_EMAIL,
  DEPENDABOT_DEFAULT_AUTHOR_NAME,
  DependabotCommandSchema,
  type DependabotRequestType,
  parseExperiments,
} from '@paklo/core/dependabot';
import { logger } from '@paklo/core/logger';
import { AzureLocalJobsRunner, type AzureLocalJobsRunnerOptions } from '@paklo/runner/local/azure';
import { Command, Option } from 'commander';
import { z } from 'zod';
import { type HandlerOptions, handlerOptions } from './base';

const schema = z.object({
  provider: z.enum(['azure']),
  repositoryUrl: z.url(),
  gitToken: z.string(),
  githubToken: z.string().optional(),
  command: DependabotCommandSchema.default('update'),
  jobTokenOverride: z.string().optional(),
  credentialsTokenOverride: z.string().optional(),
  port: z.coerce.number().min(1).max(65535).optional(),
  securityAdvisoriesFile: z.string().optional(),
  autoApprove: z.boolean(),
  autoApproveToken: z.string().optional(),
  setAutoComplete: z.boolean(),
  mergeStrategy: AzdoPullRequestMergeStrategySchema,
  autoCompleteIgnoreConfigIds: z.coerce.number().array(),
  authorName: z.string(),
  authorEmail: z.email(),
  targetUpdateIds: z.coerce.number().array(),
  experiments: z.string().optional(),
  updaterImage: z.string().optional(),
  inspect: z.boolean().optional(),
  debug: z.boolean(),
  dryRun: z.boolean(),
});
type Options = z.infer<typeof schema>;

async function handler({ options, error }: HandlerOptions<Options>) {
  const {
    provider,
    repositoryUrl,
    gitToken,
    authorName,
    authorEmail,
    experiments: rawExperiments,
    updaterImage,
    command,
    inspect,
    ...remainingOptions
  } = options;

  if (provider !== 'azure') {
    error(`Unsupported provider: '${provider}'. Currently only 'azure' is supported.`);
    return;
  }

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
    // hide from logs, (clueless how to do this with pino without being global)
  }

  // extract url parts
  const url = extractRepositoryUrl({ repositoryUrl });

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
    remote: true, // not supporting local mode in CLI yet
    variableFinder,
  });
  rl.close();
  logger.info(
    `Configuration file valid: ${config.updates.length} update(s) and ${config.registries?.length ?? 'no'} registries.`,
  );

  async function requestInspector(id: string, type: DependabotRequestType, raw: unknown) {
    const path = `./inspections/${id}/${type}/${crypto.randomUUID()}.json`;
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, JSON.stringify(raw, null, 2), 'utf-8');
  }

  try {
    const runnerOptions: AzureLocalJobsRunnerOptions = {
      config,
      secretMasker,

      url,
      gitToken,
      author: { email: authorEmail, name: authorName },
      experiments,
      updaterImage,
      command,
      inspect: inspect ? requestInspector : undefined,
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
  .addOption(
    new Option('--provider <PROVIDER>', "Repository provider. Currently only ('azure') Azure DevOps is supported.")
      .choices(['azure'])
      .makeOptionMandatory(),
  )
  .requiredOption(
    '--repository-url <REPOSITORY-URL>',
    'Full URL of the Azure DevOps repository. Examples: https://dev.azure.com/my-org/project/_git/repo, https://my-org.visualstudio.com/project/_git/repo, http://my-org.com:8443/tfs/org/project/_git/repo',
  )
  .requiredOption('--git-token <GIT-TOKEN>', 'Token to use for authenticating access to the git repository.')
  .option(
    '--github-token <GITHUB-TOKEN>',
    'GitHub token to use for authentication. If not specified, you may get rate limited.',
  )
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
      .choices(AZDO_PULL_REQUEST_MERGE_STRATEGIES)
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
  .addOption(new Option('--command <COMMAND>', 'The command to run for the update.').choices(DEPENDABOT_COMMANDS))
  .option('--inspect', 'Whether to enable request inspection. Only for troubleshooting.')
  .option('--port <PORT>', 'Port to run the API server on.')
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
