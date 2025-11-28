#!/usr/bin/env node

import { logger } from '@paklo/core/logger';
import { Command, Option } from 'commander';
import packageJson from '../package.json';
import { cleanup, fetchImages, run, validate } from './commands';

const root = new Command();

root.name('paklo').description('CLI tool for running E2E dependabot updates locally.');
root.usage();
root.version(packageJson.version, '--version');
root.addOption(
  new Option('-v, --verbosity <level>', 'set verbosity level')
    .choices(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
);
root.addCommand(fetchImages);
root.addCommand(validate);
root.addCommand(run);
root.addCommand(cleanup);

root.hook('preAction', (thisCommand) => {
  const options = thisCommand.opts();
  const verbosity = options.verbosity || 'info';
  // Set the logger level based on the verbosity option
  logger.level = verbosity;
});

const args = process.argv;
root.parse(args);

// If no command is provided, show help
if (!args.slice(2).length) {
  root.help();
}
