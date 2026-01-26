import { extractRepositoryUrl, getDependabotConfig } from '@paklo/core/azure';
import type { DependabotConfig } from '@paklo/core/dependabot';
import { logger } from '@paklo/core/logger';
import { Command, Option } from 'commander';
import { z } from 'zod';
import { type HandlerOptions, handlerOptions } from './base';

const schema = z.object({
  provider: z.enum(['azure']),
  repositoryUrl: z.url(),
  gitToken: z.string(),
});
type Options = z.infer<typeof schema>;

async function handler({ options, error }: HandlerOptions<Options>) {
  const { provider, repositoryUrl, gitToken } = options;
  if (provider !== 'azure') {
    error(`Unsupported provider: '${provider}'. Currently only 'azure' is supported.`);
    return;
  }

  // extract url parts
  const url = extractRepositoryUrl({ repositoryUrl });

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
  .addOption(
    new Option('--provider <PROVIDER>', "Repository provider. Currently only ('azure') Azure DevOps is supported.")
      .choices(['azure'])
      .makeOptionMandatory(),
  )
  .requiredOption(
    '--repository-url <REPOSITORY-URL>',
    'Full URL of the Azure DevOps repository. Examples: https://dev.azure.com/my-org/project/_git/repo, https://my-org.visualstudio.com/project/_git/repo, https://my-org.com:8443/tfs/org/project/_git/repo',
  )
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
