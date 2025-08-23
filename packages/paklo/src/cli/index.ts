#!/usr/bin/env node

import { Command } from 'commander';
import packageJson from '../../package.json';
import { run, validate } from './commands';

const root = new Command();

root.name('paklo').description('CLI tool for running E2E dependabot updates locally.');
root.usage();
root.version(packageJson.version, '--version');
root.addCommand(validate);
root.addCommand(run);

const args = process.argv;
root.parse(args);

// If no command is provided, show help
if (!args.slice(2).length) {
  root.help();
}
