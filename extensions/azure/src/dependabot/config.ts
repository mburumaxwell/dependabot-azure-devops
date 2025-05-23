import axios from 'axios';
import * as tl from 'azure-pipelines-task-lib/task';
import { getVariable } from 'azure-pipelines-task-lib/task';
import * as fs from 'fs';
import { load } from 'js-yaml';
import * as path from 'path';
import { URL } from 'url';
import { convertPlaceholder } from '../utils/placeholder';
import { type ISharedVariables } from '../utils/shared-variables';

/**
 * Represents the dependabot.yaml configuration file options.
 * See: https://docs.github.com/en/github/administering-a-repository/configuration-options-for-dependency-updates#configuration-options-for-dependabotyml
 */
export interface IDependabotConfig {
  /**
   * Mandatory. configuration file version.
   **/
  'version': number;

  /**
   * Mandatory. Configure how Dependabot updates the versions or project dependencies.
   * Each entry configures the update settings for a particular package manager.
   */
  'updates': IDependabotUpdate[];

  /**
   * Optional.
   * Specify authentication details to access private package registries.
   */
  'registries'?: Record<string, IDependabotRegistry>;

  /**
   * Optional. Enables updates for ecosystems that are not yet generally available.
   * https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference#enable-beta-ecosystems-
   */
  'enable-beta-ecosystems'?: boolean;
}

export interface IDependabotUpdate {
  'package-ecosystem': string;
  'directory': string;
  'directories': string[];
  'allow'?: IDependabotAllowCondition[];
  'assignees'?: string[];
  'commit-message'?: IDependabotCommitMessage;
  'cooldown'?: IDependabotCooldown;
  'groups'?: Record<string, IDependabotGroup>;
  'ignore'?: IDependabotIgnoreCondition[];
  'insecure-external-code-execution'?: string;
  'labels'?: string[];
  'milestone'?: string;
  'open-pull-requests-limit'?: number;
  'pull-request-branch-name'?: IDependabotPullRequestBranchName;
  'rebase-strategy'?: string;
  'registries'?: string[];
  'schedule'?: IDependabotSchedule;
  'target-branch'?: string;
  'vendor'?: boolean;
  'versioning-strategy'?: string;
}

export interface IDependabotRegistry {
  'type': string;
  'url'?: string;
  'username'?: string;
  'password'?: string;
  'key'?: string;
  'token'?: string;
  'replaces-base'?: boolean;
  'host'?: string; // for terraform and composer only
  'registry'?: string; // for npm only
  'organization'?: string; // for hex-organisation only
  'repo'?: string; // for hex-repository only
  'public-key-fingerprint'?: string; // for hex-repository only
}

export interface IDependabotGroup {
  'applies-to'?: string;
  'dependency-type'?: string;
  'patterns'?: string[];
  'exclude-patterns'?: string[];
  'update-types'?: string[];
}

export interface IDependabotAllowCondition {
  'dependency-name'?: string;
  'dependency-type'?: string;
}

export interface IDependabotIgnoreCondition {
  'dependency-name'?: string;
  'versions'?: string[];
  'update-types'?: string[];
}

export interface IDependabotSchedule {
  interval?: string;
  day?: string;
  time?: string;
  timezone?: string;
}

export interface IDependabotCommitMessage {
  'prefix'?: string;
  'prefix-development'?: string;
  'include'?: string;
}

export interface IDependabotCooldown {
  'default-days'?: number;
  'semver-major-days'?: number;
  'semver-minor-days'?: number;
  'semver-patch-days'?: number;
  'include'?: string[];
  'exclude'?: string[];
}

export interface IDependabotPullRequestBranchName {
  separator?: string;
}

/**
 * Parse the dependabot config YAML file to specify update configuration.
 * The file should be located at '/.azuredevops/dependabot.yml' or '/.github/dependabot.yml'
 *
 * To view YAML file format, visit
 * https://docs.github.com/en/github/administering-a-repository/configuration-options-for-dependency-updates#allow
 *
 * @param taskInputs the input variables of the task
 * @returns {IDependabotConfig} config - the dependabot configuration
 */
export async function parseConfigFile(taskInputs: ISharedVariables): Promise<IDependabotConfig> {
  const possibleFilePaths = [
    '/.azuredevops/dependabot.yml',
    '/.azuredevops/dependabot.yaml',
    '/.github/dependabot.yaml',
    '/.github/dependabot.yml',
  ];

  let configPath: null | string;
  let configContents: null | string;

  /*
   * The configuration file can be available locally if the repository is cloned.
   * Otherwise, we should get it via the API which supports 2 scenarios:
   * 1. Running the pipeline without cloning, which is useful for huge repositories (multiple submodules or large commit log)
   * 2. Running a single pipeline to update multiple repositories https://github.com/tinglesoftware/dependabot-azure-devops/issues/328
   */
  if (taskInputs.repositoryOverridden) {
    tl.debug(`Attempting to fetch configuration file via REST API ...`);
    for (const fp of possibleFilePaths) {
      // make HTTP request
      const url = `${taskInputs.organizationUrl}${taskInputs.project}/_apis/git/repositories/${taskInputs.repository}/items?path=${fp}`;
      tl.debug(`GET ${url}`);

      try {
        const response = await axios.get(url, {
          auth: {
            username: 'x-access-token',
            password: taskInputs.systemAccessToken,
          },
          headers: {
            Accept: '*/*', // Gotcha!!! without this SH*T fails terribly
          },
        });
        if (response.status === 200) {
          tl.debug(`Found configuration file at '${url}'`);
          configContents = response.data;
          configPath = fp;
          break;
        }
      } catch (error) {
        const responseStatusCode = error?.response?.status;

        if (responseStatusCode === 404) {
          tl.debug(`No configuration file at '${url}'`);
          continue;
        } else if (responseStatusCode === 401) {
          throw new Error(`No access token has been provided to access '${url}'`);
        } else if (responseStatusCode === 403) {
          throw new Error(`The access token provided does not have permissions to access '${url}'`);
        } else {
          throw error;
        }
      }
    }
  } else {
    const rootDir = getVariable('Build.SourcesDirectory');
    for (const fp of possibleFilePaths) {
      const filePath = path.join(rootDir, fp);
      if (fs.existsSync(filePath)) {
        tl.debug(`Found configuration file cloned at ${filePath}`);
        configContents = fs.readFileSync(filePath, 'utf-8');
        configPath = filePath;
        break;
      } else {
        tl.debug(`No configuration file cloned at ${filePath}`);
      }
    }
  }

  // Ensure we have file contents. Otherwise throw a well readable error.
  if (!configContents || typeof configContents !== 'string') {
    throw new Error(`Configuration file not found at possible locations: ${possibleFilePaths.join(', ')}`);
  } else {
    tl.debug('Configuration file contents read.');
  }

  const config = load(configContents);

  // Ensure the config object parsed is an object
  if (config === null || typeof config !== 'object') {
    throw new Error('Invalid dependabot config object');
  } else {
    tl.debug('Parsed YAML content from configuration file contents.');
  }

  const rawVersion = config['version'];
  let version = -1;

  // Ensure the version has been specified
  if (!rawVersion) throw new Error('The version must be specified in dependabot.yml');

  // Try convert the version to integer
  try {
    version = parseInt(rawVersion, 10);
  } catch {
    throw new Error('Dependabot version specified must be a valid integer');
  }

  // Ensure the version is == 2
  if (version !== 2) {
    throw new Error('Only version 2 of dependabot is supported. Version specified: ' + version);
  }

  const updates = parseUpdates(config, configPath);
  const registries = parseRegistries(config);
  validateConfiguration(updates, registries);

  return {
    version: version,
    updates: updates,
    registries: registries,
  };
}

export function parseUpdates(config: unknown, configPath: string): IDependabotUpdate[] {
  const updates: IDependabotUpdate[] = [];

  // Check the updates parsed
  const rawUpdates = config['updates'];

  // Check if the array of updates exists
  if (!Array.isArray(rawUpdates)) {
    throw new Error('Invalid dependabot config object: Dependency updates config array not found');
  }

  // Parse the value of each of the updates obtained from the file
  rawUpdates.forEach((update) => {
    const dependabotUpdate: IDependabotUpdate = update;

    if (!dependabotUpdate['package-ecosystem']) {
      throw new Error("The value 'package-ecosystem' in dependency update config is missing");
    }

    // zero is a valid value
    if (!dependabotUpdate['open-pull-requests-limit'] && dependabotUpdate['open-pull-requests-limit'] !== 0) {
      dependabotUpdate['open-pull-requests-limit'] = 5;
    }

    // either 'directory' or 'directories' must be specified
    if (!dependabotUpdate.directory && dependabotUpdate.directories.length === 0) {
      throw new Error(
        "The values 'directory' and 'directories' in dependency update config is missing, you must specify at least one",
      );
    }

    // populate the 'ignore' conditions 'source' and 'updated-at' properties, if missing
    // NOTE: 'source' and 'updated-at' are not documented in the dependabot.yml config docs, but are defined in the dependabot-core and dependabot-cli models.
    //       Currently they don't appear to add much value to the update process, but are populated here for completeness.
    if (dependabotUpdate.ignore) {
      dependabotUpdate.ignore.forEach((ignoreCondition) => {
        if (!ignoreCondition['source']) {
          ignoreCondition['source'] = configPath;
        }
        if (!ignoreCondition['updated-at']) {
          // we don't know the last updated time, so we use the current time
          ignoreCondition['updated-at'] = new Date().toISOString();
        }
      });
    }

    updates.push(dependabotUpdate);
  });
  return updates;
}

export function parseRegistries(config: unknown): Record<string, IDependabotRegistry> {
  const registries: Record<string, IDependabotRegistry> = {};

  const rawRegistries = config['registries'];

  if (rawRegistries == undefined) return registries;

  // Parse the value of each of the registries obtained from the file
  Object.entries(rawRegistries).forEach((item) => {
    const registryConfigKey = item[0];
    const registryConfig = item[1];

    // parse the type
    const rawType = registryConfig['type'];
    if (!rawType) {
      throw new Error(`The value for 'type' in dependency registry config '${registryConfigKey}' is missing`);
    }

    // ensure the type is a known one
    if (!KnownRegistryTypes.includes(rawType)) {
      throw new Error(
        `The value '${rawType}' for 'type' in dependency registry config '${registryConfigKey}' is not among the supported values.`,
      );
    }
    const type = rawType?.replace('-', '_');

    const parsed: IDependabotRegistry = { type: type };
    registries[registryConfigKey] = parsed;

    // handle special fields for 'hex-organization' types
    if (type === 'hex_organization') {
      const organization = registryConfig['organization'];
      if (!organization) {
        throw new Error(`The value 'organization' in dependency registry config '${registryConfigKey}' is missing`);
      }
      parsed.organization = organization;
    }

    // handle special fields for 'hex-repository' types
    if (type === 'hex_repository') {
      const repo = registryConfig['repo'];
      if (!repo) {
        throw new Error(`The value 'repo' in dependency registry config '${registryConfigKey}' is missing`);
      }

      parsed.repo = repo;
      parsed['auth-key'] = registryConfig['auth-key'];
      parsed['public-key-fingerprint'] = registryConfig['public-key-fingerprint'];
    }

    // parse username, password, key, and token while replacing tokens where necessary
    parsed.username = convertPlaceholder(registryConfig['username']);
    parsed.password = convertPlaceholder(registryConfig['password']);
    parsed.key = convertPlaceholder(registryConfig['key']);
    parsed.token = convertPlaceholder(registryConfig['token']);

    // add "replaces-base" if present
    const replacesBase = registryConfig['replaces-base'];
    if (replacesBase !== undefined) {
      parsed['replaces-base'] = replacesBase;
    }

    // parse the url
    const url = registryConfig['url'];
    if (!url && type !== 'hex_organization') {
      throw new Error(`The value 'url' in dependency registry config '${registryConfigKey}' is missing`);
    }
    if (url) {
      /*
       * Some credentials do not use the 'url' property in the Ruby updater.
       * The 'host' and 'registry' properties are derived from the given URL.
       * The 'registry' property is derived from the 'url' by stripping off the scheme.
       * The 'host' property is derived from the hostname of the 'url'.
       *
       * 'npm_registry' and 'docker_registry' use 'registry' only.
       * 'terraform_registry' uses 'host' only.
       * 'composer_repository' uses both 'url' and 'host'.
       * 'python_index' uses 'index-url' instead of 'url'.
       */

      if (URL.canParse(url)) {
        const parsedUrl = new URL(url);

        const addRegistry = type === 'docker_registry' || type === 'npm_registry';
        if (addRegistry) parsed.registry = url.replace('https://', '').replace('http://', '');

        const addHost = type === 'terraform_registry' || type === 'composer_repository';
        if (addHost) parsed.host = parsedUrl.hostname;
      }

      if (type === 'python_index') parsed['index-url'] = url;

      const skipUrl =
        type === 'docker_registry' ||
        type === 'npm_registry' ||
        type === 'terraform_registry' ||
        type === 'python_index';
      if (!skipUrl) parsed.url = url;
    }
  });
  return registries;
}

export function validateConfiguration(updates: IDependabotUpdate[], registries: Record<string, IDependabotRegistry>) {
  const configured = Object.keys(registries);
  const referenced: string[] = [];
  for (const u of updates) referenced.push(...(u.registries ?? []));

  // ensure there are no configured registries that have not been referenced
  const missingConfiguration = referenced.filter((el) => !configured.includes(el));
  if (missingConfiguration.length > 0) {
    throw new Error(
      `Referenced registries: '${missingConfiguration.join(',')}' have not been configured in the root of dependabot.yml`,
    );
  }

  // ensure there are no registries referenced but not configured
  const missingReferences = configured.filter((el) => !referenced.includes(el));
  if (missingReferences.length > 0) {
    throw new Error(`Registries: '${missingReferences.join(',')}' have not been referenced by any update`);
  }
}

const KnownRegistryTypes = [
  'composer-repository',
  'docker-registry',
  'git',
  'hex-organization',
  'hex-repository',
  'maven-repository',
  'npm-registry',
  'nuget-feed',
  'python-index',
  'rubygems-server',
  'terraform-registry',
];
