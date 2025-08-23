import { Command } from 'commander';
import * as yaml from 'js-yaml';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { stdin, stdout } from 'node:process';
import readline from 'node:readline/promises';
import { z } from 'zod/v4';

import { extractUrlParts, getDependabotConfig } from '@/azure';
import {
  DEFAULT_EXPERIMENTS,
  DependabotJobBuilder,
  LocalDependabotServer,
  makeRandomJobToken,
  type DependabotOperation,
  type LocalDependabotServerAppOptions,
} from '@/dependabot';
import { logger } from '../logger';
import { handlerOptions, type HandlerOptions } from './base';

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
});
type Options = z.infer<typeof schema>;

async function handler({ options, error }: HandlerOptions<Options>) {
  let { organisationUrl } = options;
  const { githubToken, gitToken, project, repository, forListDependencies, pullRequestId, outDir, generateOnly, port } =
    options;

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
    variableFinder: variableFinder,
  });
  rl.close();
  logger.info(
    `Configuration file valid: ${config.updates.length} update(s) and ${config.registries?.length ?? 'no'} registries.`,
  );

  // create output directory if it does not exist
  if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

  const jobToken = makeRandomJobToken();
  let server: LocalDependabotServer | undefined = undefined;
  if (!generateOnly) {
    const serverOptions: LocalDependabotServerAppOptions = {
      apiKey: jobToken,
      async handle(type, data) {
        // TODO: actually do something useful here
        logger.info(`Received operation of type ${type} with data: ${JSON.stringify(data)}`);
        return true;
      },
    };
    server = new LocalDependabotServer(serverOptions);
    server.start(port);
  }

  const updates = config.updates;
  for (const update of updates) {
    const updateId = updates.indexOf(update).toString();

    const builder = new DependabotJobBuilder({
      source: { provider: 'azure', ...url },
      config,
      update,
      systemAccessToken: gitToken,
      githubToken,
      experiments: DEFAULT_EXPERIMENTS,
      debug: false,
    });

    let operation: DependabotOperation | undefined = undefined;
    if (forListDependencies) {
      operation = builder.forDependenciesList({
        id: `discover-${updateId}-${update['package-ecosystem']}-dependency-list`,
      });
    } else {
      // TODO: complete this once we have abstracted out a way to get existing PRs and security vulnerabilities into something reusable
      // if (pullRequestId) {
      //   operation = builder.forUpdate({
      //     id: `update-pr-${pullRequestId}`
      //     existingPullRequests: existingPullRequestDependenciesForPackageManager,
      //     pullRequestToUpdate: existingPullRequestsForPackageManager[pullRequestId]!,
      //     securityVulnerabilities,
      //   });
      // } else {
      //   operation = builder.forUpdate({
      //     id: `update-${updateId}-${update['package-ecosystem']}-${securityUpdatesOnly ? 'security-only' : 'all'}`,
      //     dependencyNamesToUpdate,
      //     existingPullRequests: existingPullRequestDependenciesForPackageManager,
      //     securityVulnerabilities,
      //   });
      // }

      error('This has not been implemented yet. Sorry');
      return;
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

    // TODO: run the docker container(s) using logic from dependabot-action
    await new Promise((resolve) => setTimeout(resolve, 10 * 1000));

    // return;
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
  .option('--generate-only', 'Whether to only generate the job files without running it.', false)
  .option('--port <PORT>', 'Port to run the API server on.', '3000')
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
