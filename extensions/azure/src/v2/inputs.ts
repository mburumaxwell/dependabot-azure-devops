import { type AzureDevOpsUrl, extractUrlParts } from '@paklo/core/azure';
import { DEFAULT_EXPERIMENTS, type DependabotExperiments, parseExperiments } from '@paklo/core/dependabot';
import * as tl from 'azure-pipelines-task-lib/task';
import { setSecrets } from '../formatting';

export type TaskInputs = {
  url: AzureDevOpsUrl;

  /** Whether the repository was overridden via input */
  repositoryOverridden: boolean;

  /** The github token */
  githubAccessToken?: string;
  /** The access User for Azure DevOps Repos */
  systemAccessUser?: string;
  /** The access token for Azure DevOps Repos */
  systemAccessToken: string;

  authorEmail?: string;
  authorName?: string;

  /** Determines if the pull requests that dependabot creates should have auto complete set */
  setAutoComplete: boolean;
  /** Merge strategies which can be used to complete a pull request */
  mergeStrategy?: string;
  /** List of any policy configuration Id's which auto-complete should not wait for */
  autoCompleteIgnoreConfigIds: number[];

  /** Determines if the pull requests that dependabot creates should be automatically approved */
  autoApprove: boolean;
  /** A personal access token of the user that should approve the PR */
  autoApproveUserToken: string;

  experiments: DependabotExperiments;

  /** Determines if verbose log messages are logged */
  debug: boolean;
  /** Determines if secrets are protected */
  secrets: boolean;

  /** List of update identifiers to run */
  targetUpdateIds: number[];

  securityAdvisoriesFile: string | undefined;

  /** Whether to test logic without creating, updating or abandoning pull requests */
  dryRun: boolean;

  /** The listening port of the dependabot API */
  dependabotApiPort?: number;
  /** The dependabot-updater docker image to use for updates. e.g. ghcr.io/dependabot/dependabot-updater-{ecosystem}:latest */
  dependabotUpdaterImage?: string;

  /* Path to a certificate the proxy will trust */
  proxyCertPath?: string;
};

/** Extract task inputs (a.k.a. shared variables). */
export function getTaskInputs(): TaskInputs {
  let project = tl.getInput('targetProjectName');
  const projectOverridden = typeof project === 'string';
  if (!projectOverridden) {
    // We use the project name because it is very readable.
    // It may not work in all APIs and if it fails, we can switch from `System.TeamProject` to `System.TeamProjectId`.
    project = tl.getVariable('System.TeamProject');
    tl.debug(`No custom project provided; Running update for current project.`);
  } else {
    tl.debug(`Custom project provided; Running update for specified project.`);
  }

  let repository = tl.getInput('targetRepositoryName');
  const repositoryOverridden = typeof repository === 'string';
  if (projectOverridden && !repositoryOverridden) {
    throw new Error(`Target repository must be provided when target project is overridden`);
  }
  if (!repositoryOverridden) {
    repository = tl.getVariable('Build.Repository.Name');
    tl.debug(`No custom repository provided; Running update for local repository.`);
  } else {
    tl.debug(`Custom repository provided; Running update for remote repository.`);
  }

  const organisationUrl = tl.getVariable('System.TeamFoundationCollectionUri')!;
  const urlParts = extractUrlParts({ organisationUrl, project: project!, repository: repository! });

  // Prepare the access credentials
  const githubAccessToken = getGithubAccessToken();
  const systemAccessUser = tl.getInput('azureDevOpsUser');
  const systemAccessToken = getAzureDevOpsAccessToken();

  const authorEmail: string | undefined = tl.getInput('authorEmail');
  const authorName: string | undefined = tl.getInput('authorName');

  // Prepare variables for auto complete
  const setAutoComplete = tl.getBoolInput('setAutoComplete', false);
  const mergeStrategy = tl.getInput('mergeStrategy', true);
  const autoCompleteIgnoreConfigIds = tl.getDelimitedInput('autoCompleteIgnoreConfigIds', ';', false).map(Number);

  // Prepare variables for auto approve
  const autoApprove: boolean = tl.getBoolInput('autoApprove', false);
  const autoApproveUserToken = tl.getInput('autoApproveUserToken')!;

  // Convert experiments from comma separated key value pairs to a record
  // If no experiments are defined, use the default experiments
  let experiments = parseExperiments(tl.getInput('experiments', false));
  if (!experiments) {
    experiments = DEFAULT_EXPERIMENTS;
    tl.debug('No experiments provided; Using default experiments.');
  }
  console.log('Experiments:', experiments);

  const debug: boolean = Boolean(tl.getVariable('System.Debug')?.match(/true/i));
  const secrets: boolean = Boolean(tl.getVariable('System.Secrets')?.match(/true/i));

  // Get the target identifiers
  const targetUpdateIds = tl.getDelimitedInput('targetUpdateIds', ';', false).map(Number);

  // Prepare other variables
  const securityAdvisoriesFile: string | undefined = tl.getInput('securityAdvisoriesFile');
  const dryRun: boolean = tl.getBoolInput('dryRun', false);

  const dependabotApiPortStr: string | undefined = tl.getInput('dependabotCliApiListeningPort', false);
  const dependabotApiPort: number | undefined =
    (dependabotApiPortStr ?? '').length > 0 ? Number(dependabotApiPortStr) : undefined;
  const dependabotUpdaterImage: string | undefined = tl.getInput('dependabotUpdaterImage');
  if (dependabotUpdaterImage) {
    // If the updater image is provided but does not contain the "{ecosystem}" placeholder, tell the user they've misconfigured it
    if (!dependabotUpdaterImage.includes('{ecosystem}')) {
      throw new Error(
        `Dependabot Updater image '${dependabotUpdaterImage}' is invalid. ` +
          `Please ensure the image contains a "{ecosystem}" placeholder to denote the package ecosystem; e.g. "ghcr.io/dependabot/dependabot-updater-{ecosystem}:latest"`,
      );
    }
  }

  const proxyCertPath: string | undefined = tl.getInput('proxyCertPath');

  const inputs: TaskInputs = {
    url: urlParts,
    repositoryOverridden,

    githubAccessToken,
    systemAccessUser,
    systemAccessToken,

    authorEmail,
    authorName,

    setAutoComplete,
    mergeStrategy,
    autoCompleteIgnoreConfigIds,

    autoApprove,
    autoApproveUserToken,

    experiments,

    debug,
    secrets,

    targetUpdateIds,
    securityAdvisoriesFile,

    dryRun,

    dependabotApiPort,
    dependabotUpdaterImage,

    proxyCertPath,
  };

  // Mask environment, organisation, and project specific variables from the logs.
  // Most user's environments are private and they're less likely to share diagnostic info when it exposes information about their environment or organisation.
  // Although not exhaustive, this will mask the most common information that could be used to identify the user's environment.
  if (inputs.secrets) {
    setSecrets(
      inputs.url.hostname,
      inputs.url.project,
      inputs.url.repository,
      inputs.githubAccessToken,
      inputs.systemAccessUser,
      inputs.systemAccessToken,
      inputs.autoApproveUserToken,
      authorEmail,
    );
  }

  return inputs;
}

/**
 * Get the access token for Azure DevOps Repos.
 * If the user has not provided one, we use the one from the SystemVssConnection.
 */
function getAzureDevOpsAccessToken() {
  const systemAccessToken = tl.getInput('azureDevOpsAccessToken');
  if (systemAccessToken) {
    tl.debug('azureDevOpsAccessToken provided, using for authenticating');
    return systemAccessToken;
  }

  const serviceConnectionName = tl.getInput('azureDevOpsServiceConnection');
  if (serviceConnectionName) {
    tl.debug('TFS connection supplied. A token shall be extracted from it.');
    return tl.getEndpointAuthorizationParameter(serviceConnectionName, 'apitoken', false)!;
  }

  tl.debug("No custom token provided. The SystemVssConnection's AccessToken shall be used.");
  return tl.getEndpointAuthorizationParameter('SystemVssConnection', 'AccessToken', false)!;
}

/** Extract the Github access token from `gitHubAccessToken` or `gitHubConnection` inputs. */
function getGithubAccessToken(): string | undefined {
  let gitHubAccessToken = tl.getInput('gitHubAccessToken');
  if (gitHubAccessToken) {
    tl.debug('gitHubAccessToken provided, using for authenticating');
    return gitHubAccessToken;
  }

  const githubEndpointId = tl.getInput('gitHubConnection');
  if (githubEndpointId) {
    tl.debug('GitHub connection supplied. A token shall be extracted from it.');
    gitHubAccessToken = getGithubEndPointToken(githubEndpointId);
  }

  return gitHubAccessToken;
}

/** Extract access token from Github endpoint. */
function getGithubEndPointToken(githubEndpoint: string): string {
  const githubEndpointObject = tl.getEndpointAuthorization(githubEndpoint, false);
  let githubEndpointToken: string | undefined;

  if (githubEndpointObject) {
    tl.debug(`Endpoint scheme: ${githubEndpointObject.scheme}`);

    if (githubEndpointObject.scheme === 'PersonalAccessToken') {
      githubEndpointToken = githubEndpointObject.parameters.accessToken;
    } else if (githubEndpointObject.scheme === 'OAuth') {
      githubEndpointToken = githubEndpointObject.parameters.AccessToken;
    } else if (githubEndpointObject.scheme === 'Token') {
      githubEndpointToken = githubEndpointObject.parameters.AccessToken;
    } else if (githubEndpointObject.scheme) {
      throw new Error(tl.loc('InvalidEndpointAuthScheme', githubEndpointObject.scheme));
    }
  }

  if (!githubEndpointToken) {
    throw new Error(tl.loc('InvalidGitHubEndpoint', githubEndpoint));
  }

  return githubEndpointToken;
}
