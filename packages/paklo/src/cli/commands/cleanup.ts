import { Command } from 'commander';
import { z } from 'zod/v4';

import { cleanup } from '@/dependabot';
import { type HandlerOptions, handlerOptions } from './base';

const schema = z.object({});
type Options = z.infer<typeof schema>;

async function handler({ options, error }: HandlerOptions<Options>) {
  cleanup();
}

export const command = new Command('cleanup').description('Clean up old Docker images and containers.').action(
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
