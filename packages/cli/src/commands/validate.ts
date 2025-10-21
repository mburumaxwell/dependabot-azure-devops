import { extractUrlParts, getDependabotConfig } from '@paklo/core/azure';
import type { DependabotConfig } from '@paklo/core/dependabot';
import { Command } from 'commander';
import { z } from 'zod/v4';
import { logger } from '@/logger';
import { type HandlerOptions, handlerOptions } from './base';

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
      remote: true, // not supporting local mode in CLI yet
      variableFinder,
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
  .requiredOption(
    '--organisation-url <ORGANISATION-URL>',
    'URL of the organisation e.g. https://dev.azure.com/my-org or https://my-org.visualstudio.com or http://my-org.com:8443/tfs',
  )
  .requiredOption('--project <PROJECT>', 'Name or ID of the project')
  .requiredOption('--repository <REPOSITORY>', 'Name or ID of the repository')
  .requiredOption('--git-token <GIT-TOKEN>', 'Token to use for authenticating access to the git repository.')
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
