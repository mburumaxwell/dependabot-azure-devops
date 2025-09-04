import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import {
  DEFAULT_EXPERIMENTS,
  DependabotJobBuilder,
  LocalJobsRunner,
  mapPackageEcosystemToPackageManager,
  runJob,
  type DependabotCredential,
  type DependabotJobConfig,
  type DependabotUpdate,
  type LocalDependabotServer,
  type LocalJobsRunnerOptions,
  type RunJobResult,
} from '@/dependabot';
import {
  filterVulnerabilities,
  getGhsaPackageEcosystemFromDependabotPackageManager,
  GitHubGraphClient,
  SecurityVulnerabilitySchema,
  type Package,
  type SecurityVulnerability,
} from '@/github';

import { AzureDevOpsWebApiClient } from './client';
import { logger } from './logger';
import { DEVOPS_PR_PROPERTY_MICROSOFT_GIT_SOURCE_REF_NAME, type IPullRequestProperties } from './models';
import { AzureLocalDependabotServer, type AzureLocalDependabotServerOptions } from './server';
import { normalizeBranchName, parsePullRequestProperties } from './utils';

export type AzureLocalJobsRunnerOptions = LocalJobsRunnerOptions &
  Omit<
    AzureLocalDependabotServerOptions,
    'authorClient' | 'approverClient' | 'existingBranchNames' | 'existingPullRequests'
  > & {
    port: number;
    securityAdvisoriesFile?: string;
    gitToken: string;
    githubToken?: string;
    autoApproveToken?: string;
  };

export class AzureLocalJobsRunner extends LocalJobsRunner {
  private readonly options: AzureLocalJobsRunnerOptions;
  private readonly authorClient: AzureDevOpsWebApiClient;
  private readonly approverClient?: AzureDevOpsWebApiClient;

  constructor(options: AzureLocalJobsRunnerOptions) {
    super({ ...options });
    const { url, gitToken, autoApprove, debug } = (this.options = options);

    // Initialise the DevOps API clients (one for authoring the other for auto-approving (if configured))
    this.authorClient = new AzureDevOpsWebApiClient(url, gitToken, debug);
    this.approverClient = autoApprove
      ? new AzureDevOpsWebApiClient(url, options.autoApproveToken || gitToken, debug)
      : undefined;
  }

  public async run(): Promise<RunJobResult> {
    await super.run(); // common logic

    const {
      options: { url, port, config, targetUpdateIds, outDir },
      authorClient,
      approverClient,
    } = this;

    // Fetch the active pull requests created by the author user
    const existingBranchNames = await authorClient.getBranchNames(url.project, url.repository);
    const existingPullRequests = await authorClient.getActivePullRequestProperties(
      url.project,
      url.repository,
      await authorClient.getUserId(),
    );

    // Prepare local server
    const serverOptions: AzureLocalDependabotServerOptions = {
      authorClient,
      approverClient,
      existingBranchNames,
      existingPullRequests,
      ...this.options,
    };
    const server = new AzureLocalDependabotServer(serverOptions);
    server.start(port);
    // give the server a second to start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // The API urls is constant when working in this CLI. Asking people to setup NGROK or similar just to get
    // HTTPS for the job token to be used is too much hassle.
    // Using same value for dependabotApiUrl and dependabotApiDockerUrl so as to capture /record_metrics calls.
    // dependabotApiLocalUrl is used to avoid Docker for local calls.
    const dependabotApiUrl = `http://host.docker.internal:${port}/api`;
    const dependabotApiDockerUrl = dependabotApiUrl;
    const dependabotApiLocalUrl = `${server.url}/api`;

    // If update identifiers are specified, select them; otherwise handle all
    let updates: DependabotUpdate[] = [];
    if (targetUpdateIds && targetUpdateIds.length > 0) {
      for (const id of targetUpdateIds) {
        const upd = config.updates[id];
        if (!upd) {
          logger.warn(
            `
            Unable to find target update id '${id}'.
            This value should be a zero based index of the update in your config file.
            Expected range: 0-${config.updates.length - 1}
            `,
          );
        } else {
          updates.push(upd);
        }
      }
    } else {
      updates = config.updates;
    }

    try {
      // Abandon all pull requests where the source branch has been deleted
      await this.abandonPullRequestsWhereSourceRefIsDeleted(existingBranchNames, existingPullRequests);

      // Perform updates for each of the [targeted] update blocks in dependabot.yaml
      return await this.performUpdates(
        outDir,
        server,
        updates,
        existingPullRequests,
        dependabotApiUrl,
        dependabotApiDockerUrl,
        dependabotApiLocalUrl,
      );
    } finally {
      server.stop();
    }
  }

  /**
   * Abandon all pull requests where the source branch has been deleted.
   * @param existingBranchNames The names of the existing branches.
   * @param existingPullRequests The existing pull requests.
   */
  private async abandonPullRequestsWhereSourceRefIsDeleted(
    existingBranchNames?: string[],
    existingPullRequests?: IPullRequestProperties[],
  ): Promise<void> {
    if (!existingBranchNames || !existingPullRequests) return;

    const {
      options: { url, dryRun },
      authorClient,
    } = this;
    for (const pullRequestIndex in existingPullRequests) {
      const pullRequest = existingPullRequests[pullRequestIndex]!;
      const pullRequestSourceRefName = normalizeBranchName(
        pullRequest.properties?.find((x) => x.name === DEVOPS_PR_PROPERTY_MICROSOFT_GIT_SOURCE_REF_NAME)?.value,
      );
      if (pullRequestSourceRefName && !existingBranchNames.includes(pullRequestSourceRefName)) {
        // The source branch for the pull request has been deleted; abandon the pull request (if not dry run)
        if (!dryRun) {
          logger.warn(
            `Detected source branch for PR #${pullRequest.id} has been deleted; The pull request will be abandoned`,
          );
          await authorClient.abandonPullRequest({
            project: url.project,
            repository: url.repository,
            pullRequestId: pullRequest.id,
            // comment:
            //   'OK, I won't notify you again about this release, but will get in touch when a new version is available. ' +
            //   'If you'd rather skip all updates until the next major or minor version, add an ' +
            //   '[`ignore` condition](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference#ignore--) ' +
            //   'with the desired `update-types` to your config file.',
            comment:
              'It might be a good idea to add an ' +
              '[`ignore` condition](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference#ignore--) ' +
              'with the desired `update-types` to your config file.',
          });
        }
        // Remove the pull request from the list of existing pull requests to ensures that we don't attempt to update it later in the process.
        existingPullRequests.splice(existingPullRequests.indexOf(pullRequest), 1);
      }
    }
  }

  /**
   * Performs the updates.
   * @param server The local Dependabot server.
   * @param updates The updates to perform.
   * @param existingPullRequests The existing pull requests.
   */
  private async performUpdates(
    outDir: string,
    server: LocalDependabotServer,
    updates: DependabotUpdate[],
    existingPullRequests: IPullRequestProperties[],
    dependabotApiUrl: string,
    dependabotApiDockerUrl?: string,
    dependabotApiLocalUrl?: string,
  ): Promise<RunJobResult> {
    const {
      options: { url, gitToken, githubToken, config, dryRun, securityAdvisoriesFile, secretMasker },
    } = this;

    for (const update of updates) {
      const packageEcosystem = update['package-ecosystem'];
      const packageManager = mapPackageEcosystemToPackageManager(packageEcosystem);

      // Parse the Dependabot metadata for the existing pull requests that are related to this update
      // Dependabot will use this to determine if we need to create new pull requests or update/close existing ones
      const existingPullRequestsForPackageManager = parsePullRequestProperties(existingPullRequests, packageManager);
      const existingPullRequestDependenciesForPackageManager = Object.values(existingPullRequestsForPackageManager);

      const builder = new DependabotJobBuilder({
        source: { provider: 'azure', ...url },
        config,
        update,
        systemAccessToken: gitToken,
        githubToken,
        experiments: DEFAULT_EXPERIMENTS,
        debug: false,
      });

      let jobId: number | undefined = undefined;
      let job: DependabotJobConfig | undefined = undefined;
      let credentials: DependabotCredential[] | undefined = undefined; // TODO: remove this to be handled by the ApiClient
      let jobToken: string;
      let credentialsToken: string;

      // If this is a security-only update (i.e. 'open-pull-requests-limit: 0'), then we first need to discover the dependencies
      // that need updating and check each one for vulnerabilities. This is because Dependabot requires the list of vulnerable dependencies
      // to be supplied in the job definition of security-only update job, it will not automatically discover them like a versioned update does.
      // https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/configuring-dependabot-security-updates#overriding-the-default-behavior-with-a-configuration-file
      let securityVulnerabilities: SecurityVulnerability[] = [];
      let dependencyNamesToUpdate: string[] = [];
      const securityUpdatesOnly = update['open-pull-requests-limit'] === 0;
      if (securityUpdatesOnly) {
        // Run an update job to discover all dependencies
        ({ jobId, job, credentials } = builder.forDependenciesList({}));
        ({ jobToken, credentialsToken } = this.makeTokens());
        server.add({ id: jobId, update, job, jobToken, credentialsToken, credentials });
        const { success, message } = await runJob({
          outDir,
          dependabotApiUrl,
          dependabotApiDockerUrl,
          dependabotApiLocalUrl,
          jobId,
          jobToken,
          credentialsToken,
          secretMasker,
        });
        if (!success) return { success, message };

        const outputs = server.requests(jobId);
        const packagesToCheckForVulnerabilities: Package[] | undefined = outputs!
          .find((o) => o.type == 'update_dependency_list')
          ?.data.dependencies?.map((d) => ({ name: d.name, version: d.version }));
        if (packagesToCheckForVulnerabilities?.length) {
          logger.info(
            `Detected ${packagesToCheckForVulnerabilities.length} dependencies; Checking for vulnerabilities...`,
          );

          // parse security advisories from file (private)
          if (securityAdvisoriesFile) {
            const filePath = securityAdvisoriesFile;
            if (existsSync(filePath)) {
              const fileContents = await readFile(filePath, 'utf-8');
              securityVulnerabilities = await SecurityVulnerabilitySchema.array().parseAsync(JSON.parse(fileContents));
            } else {
              logger.info(`Private security advisories file '${filePath}' does not exist`);
            }
          }
          if (githubToken) {
            const ghsaClient = new GitHubGraphClient(githubToken);
            const githubVulnerabilities = await ghsaClient.getSecurityVulnerabilitiesAsync(
              getGhsaPackageEcosystemFromDependabotPackageManager(packageManager),
              packagesToCheckForVulnerabilities || [],
            );
            securityVulnerabilities.push(...githubVulnerabilities);
          } else {
            logger.info(
              'GitHub access token is not provided; Checking for vulnerabilities from GitHub is skipped. ' +
                'This is not an issue if you are using private security advisories file.',
            );
          }

          securityVulnerabilities = filterVulnerabilities(securityVulnerabilities);

          // Only update dependencies that have vulnerabilities
          dependencyNamesToUpdate = Array.from(new Set(securityVulnerabilities.map((v) => v.package.name)));
          logger.info(
            `Detected ${securityVulnerabilities.length} vulnerabilities affecting ${dependencyNamesToUpdate.length} dependencies`,
          );
          if (dependencyNamesToUpdate.length) {
            logger.trace(dependencyNamesToUpdate);
          }
        } else {
          logger.info(`No vulnerabilities detected for update ${update['package-ecosystem']} in ${update.directory}`);
          server.clear(jobId);
          continue; // nothing more to do for this update
        }

        server.clear(jobId);
      }

      // Run an update job for "all dependencies"; this will create new pull requests for dependencies that need updating
      const openPullRequestsLimit = update['open-pull-requests-limit']!;
      const openPullRequestsCount = Object.entries(existingPullRequestsForPackageManager).length;
      const hasReachedOpenPullRequestLimit =
        openPullRequestsLimit > 0 && openPullRequestsCount >= openPullRequestsLimit;
      if (!hasReachedOpenPullRequestLimit) {
        const dependenciesHaveVulnerabilities = dependencyNamesToUpdate.length && securityVulnerabilities.length;
        if (!securityUpdatesOnly || dependenciesHaveVulnerabilities) {
          ({ jobId, job, credentials } = builder.forUpdate({
            dependencyNamesToUpdate,
            existingPullRequests: existingPullRequestDependenciesForPackageManager,
            securityVulnerabilities,
          }));
          ({ jobToken, credentialsToken } = this.makeTokens());
          server.add({ id: jobId, update, job, jobToken, credentialsToken, credentials });
          const { success, message } = await runJob({
            outDir,
            dependabotApiUrl,
            dependabotApiDockerUrl,
            dependabotApiLocalUrl,
            jobId,
            jobToken,
            credentialsToken,
            secretMasker,
          });
          server.clear(jobId);
          if (!success) return { success, message };
        } else {
          logger.info('Nothing to update; dependencies are not affected by any known vulnerability');
        }
      } else {
        logger.warn(
          `Skipping update for ${packageEcosystem} packages as the open pull requests limit (${openPullRequestsLimit}) has already been reached`,
        );
      }

      // If there are existing pull requests, run an update job for each one; this will resolve merge conflicts and close pull requests that are no longer needed
      const numberOfPullRequestsToUpdate = Object.keys(existingPullRequestsForPackageManager).length;
      if (numberOfPullRequestsToUpdate > 0) {
        if (!dryRun) {
          for (const pullRequestId in existingPullRequestsForPackageManager) {
            ({ jobId, job, credentials } = builder.forUpdate({
              existingPullRequests: existingPullRequestDependenciesForPackageManager,
              pullRequestToUpdate: existingPullRequestsForPackageManager[pullRequestId]!,
              securityVulnerabilities,
            }));
            ({ jobToken, credentialsToken } = this.makeTokens());
            server.add({ id: jobId, update, job, jobToken, credentialsToken, credentials });
            const { success, message } = await runJob({
              outDir,
              dependabotApiUrl,
              dependabotApiDockerUrl,
              dependabotApiLocalUrl,
              jobId,
              jobToken,
              credentialsToken,
              secretMasker,
            });
            server.clear(jobId);
            if (!success) return { success, message };
          }
        } else {
          logger.warn(
            `Skipping update of ${numberOfPullRequestsToUpdate} existing ${packageEcosystem} package pull request(s) as 'dryRun' is set to 'true'`,
          );
        }
      }
    }

    return { success: true };
  }
}
