import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import * as path from 'path';

import {
  parseDependabotConfig,
  POSSIBLE_CONFIG_FILE_PATHS,
  type DependabotConfig,
  type VariableFinderFn,
} from '@/dependabot';
import { logger } from './logger';
import { type AzureDevOpsUrl } from './url-parts';

/**
 * Parse the dependabot config YAML file to specify update configuration.
 * The file should be located at any of `POSSIBLE_CONFIG_FILE_PATHS`.
 *
 * To view YAML file format, visit
 * https://docs.github.com/en/github/administering-a-repository/configuration-options-for-dependency-updates#allow
 *
 * @returns {DependabotConfig} config - the dependabot configuration
 */
export async function getDependabotConfig({
  url,
  token,
  rootDir,
  variableFinder,
}: {
  url: AzureDevOpsUrl;
  token: string;
  rootDir: string;
  variableFinder: VariableFinderFn;
}): Promise<DependabotConfig> {
  let configPath: undefined | string;
  let configContents: undefined | string;

  /*
   * The configuration file can be available locally if the repository is cloned.
   * Otherwise, we should get it via the API which supports 2 scenarios:
   * 1. Running the pipeline without cloning, which is useful for huge repositories (multiple submodules or large commit log)
   * 2. Running a single pipeline to update multiple repositories https://github.com/mburumaxwell/dependabot-azure-devops/issues/328
   */

  for (const fp of POSSIBLE_CONFIG_FILE_PATHS) {
    const filePath = path.join(rootDir, fp);
    if (existsSync(filePath)) {
      logger.debug(`Found configuration file cloned at ${filePath}`);
      configContents = await readFile(filePath, 'utf-8');
      configPath = filePath;
      break;
    } else {
      logger.trace(`No configuration file cloned at ${filePath}`);
    }
  }

  if (!configContents) {
    logger.debug(`Attempting to fetch configuration file via REST API ...`);
    for (const fp of POSSIBLE_CONFIG_FILE_PATHS) {
      // make HTTP request
      const requestUrl = `${url.url}${url.project}/_apis/git/repositories/${url.repository}/items?path=/${fp}`;
      logger.debug(`GET ${requestUrl}`);

      try {
        const authHeader = 'Basic ' + Buffer.from(`x-access-token:${token}`).toString('base64');
        const response = await fetch(requestUrl, {
          headers: {
            Authorization: authHeader,
            Accept: '*/*', // Gotcha!!! without this SH*T fails terribly
          },
        });
        if (response.ok) {
          logger.debug(`Found configuration file at '${requestUrl}'`);
          configContents = await response.text();
          configPath = fp;
          break;
        } else if (response.status === 404) {
          logger.trace(`No configuration file at '${requestUrl}'`);
          continue;
        } else if (response.status === 401) {
          throw new Error(`No or invalid access token has been provided to access '${requestUrl}'`);
        } else if (response.status === 403) {
          throw new Error(`The access token provided does not have permissions to access '${requestUrl}'`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('access token')) {
          throw error;
        } else {
          throw error;
        }
      }
    }
  }

  // Ensure we have file contents. Otherwise throw a well readable error.
  if (!configContents || !configPath || typeof configContents !== 'string') {
    throw new Error(`Configuration file not found at possible locations: ${POSSIBLE_CONFIG_FILE_PATHS.join(', ')}`);
  } else {
    logger.trace('Configuration file contents read.');
  }

  return await parseDependabotConfig({ configContents, configPath, variableFinder });
}
