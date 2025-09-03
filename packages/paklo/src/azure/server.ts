import {
  getBranchNameForUpdate,
  LocalDependabotServer,
  type DependabotRequest,
  type DependabotRequestHandleResult,
  type LocalDependabotServerOptions,
} from '@/dependabot';
import { type AzureDevOpsWebApiClient } from './client';
import { logger } from './logger';
import { type IPullRequestProperties } from './models';
import { GitPullRequestMergeStrategy } from './types';
import { type AzureDevOpsUrl } from './url-parts';
import {
  buildPullRequestProperties,
  getPullRequestChangedFilesForOutputData,
  getPullRequestCloseReasonForOutputData,
  getPullRequestDependenciesPropertyValueForOutputData,
  getPullRequestDescription,
  getPullRequestForDependencyNames,
  parsePullRequestProperties,
} from './utils';

export type AzureLocalDependabotServerOptions = LocalDependabotServerOptions & {
  url: AzureDevOpsUrl;
  authorClient: AzureDevOpsWebApiClient;
  autoApprove: boolean;
  approverClient?: AzureDevOpsWebApiClient;
  setAutoComplete: boolean;
  mergeStrategy?: string;
  autoCompleteIgnoreConfigIds: number[];
  existingBranchNames: string[] | undefined;
  existingPullRequests: IPullRequestProperties[];
};

export class AzureLocalDependabotServer extends LocalDependabotServer {
  private readonly options: AzureLocalDependabotServerOptions;

  constructor(options: AzureLocalDependabotServerOptions) {
    super(options);
    this.options = options;
  }

  protected async handle(id: number, request: DependabotRequest): Promise<DependabotRequestHandleResult> {
    await super.handle(id, request); // common logic

    const {
      options: {
        url,
        authorClient,
        approverClient,
        existingBranchNames,
        existingPullRequests,
        autoApprove,
        mergeStrategy,
        setAutoComplete,
        autoCompleteIgnoreConfigIds,
        author,
        debug,
        dryRun,
      },
      createdPullRequestIds,
    } = this;

    const { type, data } = request;
    const job = this.job(id);
    if (!job) {
      logger.error(`No job found for ID '${id}', cannot process request of type '${type}'`);
      return { success: false };
    }
    const { ['package-manager']: packageManager } = job;
    logger.info(`Processing '${type}' for job ID '${id}'`);
    if (debug) {
      logger.debug(JSON.stringify(data));
    }

    const update = this.update(id)!; // exists because job exists
    const { project, repository } = url;

    switch (type) {
      // Documentation on the 'data' model for each output type can be found here:
      // See: https://github.com/dependabot/cli/blob/main/internal/model/update.go

      case 'create_pull_request': {
        const title = data['pr-title'];
        if (dryRun) {
          logger.warn(`Skipping pull request creation of '${title}' as 'dryRun' is set to 'true'`);
          return { success: true };
        }

        // Skip if active pull request limit reached.
        const openPullRequestsLimit = update['open-pull-requests-limit']!;

        // Parse the Dependabot metadata for the existing pull requests that are related to this update
        // Dependabot will use this to determine if we need to create new pull requests or update/close existing ones
        const existingPullRequestsForPackageManager = parsePullRequestProperties(existingPullRequests, packageManager);
        const existingPullRequestsCount = Object.entries(existingPullRequestsForPackageManager).length;
        const openPullRequestsCount = createdPullRequestIds.length + existingPullRequestsCount;
        const hasReachedOpenPullRequestLimit =
          openPullRequestsLimit > 0 && openPullRequestsCount >= openPullRequestsLimit;

        if (hasReachedOpenPullRequestLimit) {
          logger.warn(
            `Skipping pull request creation of '${title}' as the open pull requests limit (${openPullRequestsLimit}) has been reached`,
          );
          return { success: true };
        }

        const changedFiles = getPullRequestChangedFilesForOutputData(data);
        const dependencies = getPullRequestDependenciesPropertyValueForOutputData(data);
        const targetBranch = update['target-branch'] || (await authorClient.getDefaultBranch(project, repository));
        const sourceBranch = getBranchNameForUpdate(
          update['package-ecosystem'],
          targetBranch,
          update.directory || update.directories?.find((dir) => changedFiles[0]?.path?.startsWith(dir)),
          !Array.isArray(dependencies) ? dependencies['dependency-group-name'] : undefined,
          !Array.isArray(dependencies) ? dependencies.dependencies : dependencies,
          update['pull-request-branch-name']?.separator,
        );

        // Check if the source branch already exists or conflicts with an existing branch
        const existingBranch = existingBranchNames?.find((branch) => sourceBranch == branch) || [];
        if (existingBranch.length) {
          logger.error(
            `Unable to create pull request '${title}' as source branch '${sourceBranch}' already exists; Delete the existing branch and try again.`,
          );
          return { success: false };
        }
        const conflictingBranches = existingBranchNames?.filter((branch) => sourceBranch.startsWith(branch)) || [];
        if (conflictingBranches.length) {
          logger.error(
            `Unable to create pull request '${title}' as source branch '${sourceBranch}' would conflict with existing branch(es) '${conflictingBranches.join(', ')}'; Delete the conflicting branch(es) and try again.`,
          );
          return { success: false };
        }

        // Create a new pull request
        const newPullRequestId = await authorClient.createPullRequest({
          project: project,
          repository: repository,
          source: {
            commit: data['base-commit-sha'] || job.source.commit!,
            branch: sourceBranch,
          },
          target: {
            branch: targetBranch!,
          },
          author,
          title,
          description: getPullRequestDescription(packageManager, data['pr-body'], data.dependencies),
          commitMessage: data['commit-message'],
          autoComplete: setAutoComplete
            ? {
                ignorePolicyConfigIds: autoCompleteIgnoreConfigIds,
                mergeStrategy: (() => {
                  switch (mergeStrategy) {
                    case 'noFastForward':
                      return GitPullRequestMergeStrategy.NoFastForward;
                    case 'squash':
                      return GitPullRequestMergeStrategy.Squash;
                    case 'rebase':
                      return GitPullRequestMergeStrategy.Rebase;
                    case 'rebaseMerge':
                      return GitPullRequestMergeStrategy.RebaseMerge;
                    default:
                      return GitPullRequestMergeStrategy.Squash;
                  }
                })(),
              }
            : undefined,
          assignees: update.assignees,
          labels: update.labels?.map((label) => label?.trim()) || [],
          workItems: update.milestone ? [update.milestone] : [],
          changes: changedFiles,
          properties: buildPullRequestProperties(packageManager, dependencies),
        });

        // Auto-approve the pull request, if required
        if (autoApprove && approverClient && newPullRequestId) {
          await approverClient.approvePullRequest({
            project: project,
            repository: repository,
            pullRequestId: newPullRequestId,
          });
        }

        // Store the new pull request ID, so we can keep track of the total number of open pull requests
        if (newPullRequestId && newPullRequestId > 0) {
          createdPullRequestIds.push(newPullRequestId);
          return { success: true, pr: newPullRequestId };
        } else {
          return { success: false };
        }
      }

      case 'update_pull_request': {
        if (dryRun) {
          logger.warn(`Skipping pull request update as 'dryRun' is set to 'true'`);
          return { success: true };
        }

        // Find the pull request to update
        const pullRequestToUpdate = getPullRequestForDependencyNames(
          existingPullRequests,
          packageManager,
          data['dependency-names'],
        );
        if (!pullRequestToUpdate) {
          logger.error(
            `Could not find pull request to update for package manager '${packageManager}' with dependencies '${data['dependency-names'].join(', ')}'`,
          );
          return { success: false };
        }

        // Update the pull request
        const pullRequestWasUpdated = await authorClient.updatePullRequest({
          project: project,
          repository: repository,
          pullRequestId: pullRequestToUpdate.id,
          commit: data['base-commit-sha'] || job.source.commit!,
          author,
          changes: getPullRequestChangedFilesForOutputData(data),
          skipIfDraft: true,
          skipIfCommitsFromAuthorsOtherThan: author.email,
          skipIfNotBehindTargetBranch: true,
        });

        // Re-approve the pull request, if required
        if (autoApprove && approverClient && pullRequestWasUpdated) {
          await approverClient.approvePullRequest({
            project: project,
            repository: repository,
            pullRequestId: pullRequestToUpdate.id,
          });
        }

        return { success: pullRequestWasUpdated, pr: pullRequestToUpdate.id };
      }

      case 'close_pull_request': {
        if (dryRun) {
          logger.warn(`Skipping pull request closure as 'dryRun' is set to 'true'`);
          return { success: true };
        }

        // Find the pull request to close
        const pullRequestToClose = getPullRequestForDependencyNames(
          existingPullRequests,
          packageManager,
          data['dependency-names'],
        );
        if (!pullRequestToClose) {
          logger.error(
            `Could not find pull request to close for package manager '${packageManager}' with dependencies '${data['dependency-names'].join(', ')}'`,
          );
          return { success: false };
        }

        // TODO: GitHub Dependabot will close with reason "Superseded by ${new_pull_request_id}" when another PR supersedes it.
        //       How do we detect this? Do we need to?

        // Close the pull request
        const success = await authorClient.abandonPullRequest({
          project: project,
          repository: repository,
          pullRequestId: pullRequestToClose.id,
          comment: getPullRequestCloseReasonForOutputData(data),
          deleteSourceBranch: true,
        });
        return { success, pr: pullRequestToClose.id };
      }

      case 'update_dependency_list':
        return { success: true }; // No action required

      case 'mark_as_processed':
        return { success: true };

      case 'record_ecosystem_versions':
        return { success: true };

      case 'record_ecosystem_meta':
        return { success: true };

      case 'record_update_job_error':
        logger.error(`Update job error: ${data['error-type']} ${JSON.stringify(data['error-details'])}`);
        return { success: false };

      case 'record_update_job_unknown_error':
        logger.error(`Update job unknown error: ${data['error-type']}, ${JSON.stringify(data['error-details'])}`);
        return { success: false };

      case 'increment_metric':
        return { success: true };

      case 'record_metrics':
        return { success: true };

      default:
        logger.warn(`Unknown dependabot output type '${type}', ignoring...`);
        return { success: true };
    }
  }
}
