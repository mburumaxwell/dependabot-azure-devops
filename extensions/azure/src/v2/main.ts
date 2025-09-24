import { AzureLocalJobsRunner, type AzureLocalJobsRunnerOptions, getDependabotConfig } from '@paklo/cli/azure';
import {
  DEPENDABOT_DEFAULT_AUTHOR_EMAIL,
  DEPENDABOT_DEFAULT_AUTHOR_NAME,
  type GitAuthor,
  type SecretMasker,
} from '@paklo/cli/dependabot';
import * as tl from 'azure-pipelines-task-lib/task';
import { setSecrets } from '../formatting';
import { getTaskInputs } from './inputs';

async function run() {
  try {
    // Check if required tools are installed
    tl.debug('Checking for `docker` install...');
    tl.which('docker', true);

    // Parse task input configuration
    const inputs = getTaskInputs();
    if (!inputs) {
      throw new Error('Failed to parse task input configuration');
    }

    const { url, authorEmail, authorName, ...remainingInputs } = inputs;

    // Parse dependabot configuration file
    const config = await getDependabotConfig({
      url,
      token: inputs.systemAccessToken,
      rootDir: tl.getVariable('Build.SourcesDirectory')!,
      variableFinder: tl.getVariable,
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
      port: inputs.dependabotApiPort,
      url,
      secretMasker,
      gitToken: inputs.systemAccessToken,
      githubToken: inputs.githubAccessToken,
      author,
      autoApproveToken: inputs.autoApproveUserToken,
      // TODO: pass proxyCertPath support if needed hence remove warning below
    };

    if (inputs.proxyCertPath) {
      tl.warning(
        'In a recent major update, the job logic was changed to replace dependabot-cli and follow dependabot-action closely. ' +
          'As a result, the proxy certificate path has not yet been fully integrated.' +
          'If this affects your setup and there is no alternative, please let me known by opening an issue on GitHub.',
      );
    }

    // Run the Azure Local Jobs Runner
    const runner = new AzureLocalJobsRunner(runnerOptions);
    const result = await runner.run();
    const success = result.every((r) => r.success);

    if (success) {
      tl.setResult(tl.TaskResult.Succeeded, 'All update tasks completed successfully');
    } else {
      let message = result
        .map((r) => r.message)
        .join('\n')
        .trim();
      if (message.length === 0) {
        message = 'Update tasks failed. Check the logs for more information';
      }
      tl.setResult(tl.TaskResult.Failed, message);
    }

    // Collect unique list of all affected PRs and set it as an output variable
    const prs = Array.from(new Set(result.flatMap((r) => r.affectedPrs)));

    tl.setVariable(
      'affectedPrs', // name
      prs.join(','), // value
      false, // secret
      true, // isOutput
    );
  } catch (e) {
    const err = e as Error;
    tl.setResult(tl.TaskResult.Failed, err.message);
    tl.error(`An unhandled exception occurred: ${e}`);
    console.debug(e); // Dump the stack trace to help with debugging
  } finally {
  }
}

run();
