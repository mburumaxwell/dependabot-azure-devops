import { Command } from 'commander';
import { z } from 'zod/v4';

import { extractUrlParts, getDependabotConfig } from '@/azure';
import { type DependabotConfig } from '@/dependabot';
import { logger } from '../logger';
import { handlerOptions, type HandlerOptions } from './base';

const schema = z.object({
  organisationUrl: z.string(),
  project: z.string(),
  repository: z.string(),
  gitToken: z.string(),
});
type Options = z.infer<typeof schema>;

async function handler({ options, error }: HandlerOptions<Options>) {
  let { organisationUrl } = options;
  const { gitToken, project, repository } = options;

  // extract url parts
  if (!organisationUrl.endsWith('/')) organisationUrl = `${organisationUrl}/`; // without trailing slash the extraction fails
  const url = extractUrlParts({ organisationUrl, project, repository });

  // prepare to find variables by asking user for input
  const variables = new Set<string>();
  function variableFinder(name: string) {
    variables.add(name);
    return undefined;
  }
  // Parse dependabot configuration file
  let config: DependabotConfig;
  try {
    config = await getDependabotConfig({
      url,
      token: gitToken,
      rootDir: process.cwd(),
      variableFinder: variableFinder,
    });
  } catch (e) {
    error((e as Error).message);
    return;
  }

  logger.info(
    `Configuration file valid: ${config.updates.length} update(s) and ${config.registries?.length ?? 'no'} registries.`,
  );
  if (variables.size) {
    logger.info(`Found replaceable variables/tokens:\n- ${variables.values().toArray().join('\n- ')}`);
  } else {
    logger.info('No replaceable variables/tokens found.');
  }
}

export const command = new Command('validate')
  .description('Validate a dependabot configuration file.')
  .argument(
    '<organisation-url>',
    'URL of the organisation e.g. https://dev.azure.com/my-org or https://my-org.visualstudio.com or http://my-org.com:8443/tfs',
  )
  .argument('<project>', 'Name or ID of the project')
  .requiredOption('--repository <REPOSITORY>', 'Name or ID of the repository')
  .requiredOption('--git-token <GIT-TOKEN>', 'Token to use for authenticating access to the git repository.')
  .action(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (...args: any[]) =>
      await handler(
        await handlerOptions({
          schema,
          input: {
            organisationUrl: args[0],
            project: args[1],
            ...args[2],
          },
          command: args.at(-1),
        }),
      ),
  );
