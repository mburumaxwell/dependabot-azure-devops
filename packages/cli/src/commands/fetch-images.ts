import { DependabotPackageManagerSchema } from '@paklo/core/dependabot';
import { ImageService, PROXY_IMAGE_NAME, updaterImageName } from '@paklo/runner';
import { Argument, Command } from 'commander';
import { z } from 'zod';
import { type HandlerOptions, handlerOptions } from './base';

const schema = z.object({
  packageManager: DependabotPackageManagerSchema,
});
type Options = z.infer<typeof schema>;

async function handler({ options }: HandlerOptions<Options>) {
  const { packageManager } = options;
  await ImageService.pull(updaterImageName(packageManager));
  await ImageService.pull(PROXY_IMAGE_NAME);
}

export const command = new Command('fetch-images')
  .description('Fetch Docker images.')
  .addArgument(new Argument('<packageManager>', 'The package manager to fetch the updater image for.'))
  .action(
    async (...args) =>
      await handler(
        await handlerOptions({
          schema,
          input: {
            packageManager: args[0],
            ...args[1],
          },
          command: args.at(-1),
        }),
      ),
  );
