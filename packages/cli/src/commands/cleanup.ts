import { cleanup } from '@paklo/runner';
import { Command } from 'commander';
import { z } from 'zod';
import { type HandlerOptions, handlerOptions } from './base';

const TimeUnitsSchema = z.enum(['ms', 's', 'm', 'h', 'd', 'w', 'y']);
const TimeStringSchema = z.templateLiteral([z.number(), TimeUnitsSchema]);

const schema = z.object({
  cutoff: TimeStringSchema.optional().default('24h'),
});
type Options = z.infer<typeof schema>;

async function handler({ options, error }: HandlerOptions<Options>) {
  const { cutoff } = options;
  cleanup(cutoff);
}

export const command = new Command('cleanup')
  .description('Clean up old Docker images and containers.')
  .option('--cutoff <duration>', 'Cutoff time for cleanup (e.g., 24h, 7d)', '24h')
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
