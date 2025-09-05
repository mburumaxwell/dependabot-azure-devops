import { Command } from 'commander';
import { z } from 'zod/v4';

import { cleanup } from '@/dependabot';
import { handlerOptions, type HandlerOptions } from './base';

const schema = z.object({});
type Options = z.infer<typeof schema>;

async function handler({ options, error }: HandlerOptions<Options>) {
  cleanup();
}

export const command = new Command('cleanup').description('Clean up old Docker images and containers.').action(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (...args: any[]) =>
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
