import { debug, error, getVariable, setResult, setVariable, TaskResult, which } from 'azure-pipelines-task-lib/task';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { AzureLocalJobsRunner, getDependabotConfig, type AzureLocalJobsRunnerOptions } from 'paklo/azure';
import {
  DEPENDABOT_DEFAULT_AUTHOR_EMAIL,
  DEPENDABOT_DEFAULT_AUTHOR_NAME,
  type GitAuthor,
  type SecretMasker,
} from 'paklo/dependabot';
import { section, setSecrets } from './formatting';
import parseTaskInputConfiguration from './shared-variables';

async function run() {
  const outDir = join(tmpdir(), 'dependabot-azure-devops');
  try {
    // Check if required tools are installed
    debug('Checking for `docker` install...');
    which('docker', true);

    // Parse task input configuration
    const inputs = parseTaskInputConfiguration();
    if (!inputs) {
      throw new Error('Failed to parse task input configuration');
    }

    const { url, authorEmail, authorName, ...remainingInputs } = inputs;

    // Mask environment, organisation, and project specific variables from the logs.
    // Most user's environments are private and they're less likely to share diagnostic info when it exposes information about their environment or organisation.
    // Although not exhaustive, this will mask the most common information that could be used to identify the user's environment.
    if (inputs.secrets) {
      setSecrets(
        url.hostname,
        url.project,
        url.repository,
        inputs.githubAccessToken,
        inputs.systemAccessUser,
        inputs.systemAccessToken,
        inputs.autoApproveUserToken,
        authorEmail,
      );
    }

    // Parse dependabot configuration file
    const config = await getDependabotConfig({
      url,
      token: inputs.systemAccessToken,
      rootDir: getVariable('Build.SourcesDirectory')!,
      variableFinder: getVariable,
    });
    if (!config) {
      throw new Error('Failed to parse dependabot.yaml configuration file from the target repository');
    }

    // Create a secret masker for Azure Pipelines
    const secretMasker: SecretMasker = (value: string) => (inputs.secrets ? setSecrets(value) : value);

    // Create the author object
    const author: GitAuthor = {
      name: authorName || DEPENDABOT_DEFAULT_AUTHOR_NAME,
      email: authorEmail || DEPENDABOT_DEFAULT_AUTHOR_EMAIL,
    };

    // Setup the jobs runner options
    const runnerOptions: AzureLocalJobsRunnerOptions = {
      ...remainingInputs,
      config,
      outDir,
      port: inputs.dependabotCliApiListeningPort || 3001,
      url,
      secretMasker,
      gitToken: inputs.systemAccessToken,
      githubToken: inputs.githubAccessToken,
      author,
      autoApproveToken: inputs.autoApproveUserToken,
      // TODO: pass proxyCertPath support if needed
    };

    // Run the Azure Local Jobs Runner
    section('Starting Dependabot update jobs');
    const runner = new AzureLocalJobsRunner(runnerOptions);
    const result = await runner.run();
    const success = result.every((r) => r.success);

    if (success) {
      setResult(TaskResult.Succeeded, 'All update tasks completed successfully');
    } else {
      let message = result
        .map((r) => r.message)
        .join('\n')
        .trim();
      if (message.length === 0) {
        message = 'Update tasks failed. Check the logs for more information';
      }
      setResult(TaskResult.Failed, message);
    }

    // Collect unique list of all affected PRs and set it as an output variable
    const prs = Array.from(new Set(result.flatMap((r) => r.affectedPrs)));

    setVariable(
      'affectedPrs', // name
      prs.join(','), // value
      false, // secret
      true, // isOutput
    );
  } catch (e) {
    const err = e as Error;
    setResult(TaskResult.Failed, err.message);
    error(`An unhandled exception occurred: ${e}`);
    console.debug(e); // Dump the stack trace to help with debugging
  } finally {
    if (existsSync(outDir)) {
      await rm(outDir, { recursive: true, force: true });
    }
  }
}

run();
