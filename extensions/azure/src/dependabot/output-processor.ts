import { GitPullRequestMergeStrategy } from 'azure-devops-node-api/interfaces/GitInterfaces';
import { debug, error, warning } from 'azure-pipelines-task-lib/task';
import {
  buildPullRequestProperties,
  getPullRequestChangedFilesForOutputData,
  getPullRequestCloseReasonForOutputData,
  getPullRequestDependenciesPropertyValueForOutputData,
  getPullRequestDescription,
  getPullRequestForDependencyNames,
  parsePullRequestProperties,
  type AzureDevOpsWebApiClient,
  type IPullRequestProperties,
} from 'paklo/azure';
import {
  DEPENDABOT_DEFAULT_AUTHOR_EMAIL,
  DEPENDABOT_DEFAULT_AUTHOR_NAME,
  getBranchNameForUpdate,
  type DependabotOperation,
  type DependabotOutput,
} from 'paklo/dependabot';
import { section } from '../azure-devops/formatting';
import { type ISharedVariables } from '../utils/shared-variables';

export type DependabotOutputProcessorResult = {
  success: boolean;
  pr?: number;
};

/**
 * Processes dependabot update outputs using the DevOps API
 */
export class DependabotOutputProcessor {
  private readonly prAuthorClient: AzureDevOpsWebApiClient;
  private readonly prApproverClient: AzureDevOpsWebApiClient | undefined;
  private readonly existingBranchNames: string[] | undefined;
  private readonly existingPullRequests: IPullRequestProperties[];
  private readonly createdPullRequestIds: number[];
  private readonly taskInputs: ISharedVariables;
  private readonly debug: boolean;

  constructor(
    taskInputs: ISharedVariables,
    prAuthorClient: AzureDevOpsWebApiClient,
    prApproverClient: AzureDevOpsWebApiClient | undefined,
    existingBranchNames: string[] | undefined,
    existingPullRequests: IPullRequestProperties[],
    debug: boolean = false,
  ) {
    this.taskInputs = taskInputs;
    this.prAuthorClient = prAuthorClient;
    this.prApproverClient = prApproverClient;
    this.existingBranchNames = existingBranchNames;
    this.existingPullRequests = existingPullRequests;
    this.createdPullRequestIds = [];
    this.debug = debug;
  }

  /**
   * Process the appropriate DevOps API actions for the supplied dependabot update output
   * @param output A scenario output
   */
  public async process(
    operation: DependabotOperation,
    output: DependabotOutput,
  ): Promise<DependabotOutputProcessorResult> {
    const { project, repository } = this.taskInputs.url;
    const packageManager = operation.job?.['package-manager'];

    const type = output.type;
    section(`Processing '${type}'`);
    if (this.debug) {
      debug(JSON.stringify(output.expect.data));
    }
    switch (type) {
      // Documentation on the 'data' model for each output type can be found here:
      // See: https://github.com/dependabot/cli/blob/main/internal/model/update.go

      case 'create_pull_request': {
        const title = output.expect.data['pr-title'];
        if (this.taskInputs.dryRun) {
          warning(`Skipping pull request creation of '${title}' as 'dryRun' is set to 'true'`);
          return { success: true };
        }

        // Skip if active pull request limit reached.
        const openPullRequestsLimit = operation.update['open-pull-requests-limit']!;

        // Parse the Dependabot metadata for the existing pull requests that are related to this update
        // Dependabot will use this to determine if we need to create new pull requests or update/close existing ones
        const existingPullRequestsForPackageManager = parsePullRequestProperties(
          this.existingPullRequests,
          packageManager,
        );
        const existingPullRequestsCount = Object.entries(existingPullRequestsForPackageManager).length;
        const openPullRequestsCount = this.createdPullRequestIds.length + existingPullRequestsCount;
        const hasReachedOpenPullRequestLimit =
          openPullRequestsLimit > 0 && openPullRequestsCount >= openPullRequestsLimit;

        if (hasReachedOpenPullRequestLimit) {
          warning(
            `Skipping pull request creation of '${title}' as the open pull requests limit (${openPullRequestsLimit}) has been reached`,
          );
          return { success: true };
        }

        const changedFiles = getPullRequestChangedFilesForOutputData(output.expect.data);
        const dependencies = getPullRequestDependenciesPropertyValueForOutputData(output.expect.data);
        const targetBranch =
          operation.update['target-branch'] || (await this.prAuthorClient.getDefaultBranch(project, repository));
        const sourceBranch = getBranchNameForUpdate(
          operation.update['package-ecosystem'],
          targetBranch,
          operation.update.directory ||
            operation.update.directories?.find((dir) => changedFiles[0]?.path?.startsWith(dir)),
          !Array.isArray(dependencies) ? dependencies['dependency-group-name'] : undefined,
          !Array.isArray(dependencies) ? dependencies.dependencies : dependencies,
          operation.update['pull-request-branch-name']?.separator,
        );

        // Check if the source branch already exists or conflicts with an existing branch
        const existingBranch = this.existingBranchNames?.find((branch) => sourceBranch == branch) || [];
        if (existingBranch.length) {
          error(
            `Unable to create pull request '${title}' as source branch '${sourceBranch}' already exists; Delete the existing branch and try again.`,
          );
          return { success: false };
        }
        const conflictingBranches = this.existingBranchNames?.filter((branch) => sourceBranch.startsWith(branch)) || [];
        if (conflictingBranches.length) {
          error(
            `Unable to create pull request '${title}' as source branch '${sourceBranch}' would conflict with existing branch(es) '${conflictingBranches.join(', ')}'; Delete the conflicting branch(es) and try again.`,
          );
          return { success: false };
        }

        // Create a new pull request
        const newPullRequestId = await this.prAuthorClient.createPullRequest({
          project: project,
          repository: repository,
          source: {
            commit: output.expect.data['base-commit-sha'] || operation.job.source.commit!,
            branch: sourceBranch,
          },
          target: {
            branch: targetBranch!,
          },
          author: {
            email: this.taskInputs.authorEmail || DEPENDABOT_DEFAULT_AUTHOR_EMAIL,
            name: this.taskInputs.authorName || DEPENDABOT_DEFAULT_AUTHOR_NAME,
          },
          title: title,
          description: getPullRequestDescription(
            packageManager,
            output.expect.data['pr-body'],
            output.expect.data.dependencies,
          ),
          commitMessage: output.expect.data['commit-message'],
          autoComplete: this.taskInputs.setAutoComplete
            ? {
                ignorePolicyConfigIds: this.taskInputs.autoCompleteIgnoreConfigIds,
                mergeStrategy: (() => {
                  switch (this.taskInputs.mergeStrategy) {
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
          assignees: operation.update.assignees,
          labels: operation.update.labels?.map((label) => label?.trim()) || [],
          workItems: operation.update.milestone ? [operation.update.milestone] : [],
          changes: changedFiles,
          properties: buildPullRequestProperties(packageManager, dependencies),
        });

        // Auto-approve the pull request, if required
        if (this.taskInputs.autoApprove && this.prApproverClient && newPullRequestId) {
          await this.prApproverClient.approvePullRequest({
            project: project,
            repository: repository,
            pullRequestId: newPullRequestId,
          });
        }

        // Store the new pull request ID, so we can keep track of the total number of open pull requests
        if (newPullRequestId && newPullRequestId > 0) {
          this.createdPullRequestIds.push(newPullRequestId);
          return { success: true, pr: newPullRequestId };
        } else {
          return { success: false };
        }
      }

      case 'update_pull_request': {
        if (this.taskInputs.dryRun) {
          warning(`Skipping pull request update as 'dryRun' is set to 'true'`);
          return { success: true };
        }

        // Find the pull request to update
        const pullRequestToUpdate = getPullRequestForDependencyNames(
          this.existingPullRequests,
          packageManager,
          output.expect.data['dependency-names'],
        );
        if (!pullRequestToUpdate) {
          error(
            `Could not find pull request to update for package manager '${packageManager}' with dependencies '${output.expect.data['dependency-names'].join(', ')}'`,
          );
          return { success: false };
        }

        // Update the pull request
        const pullRequestWasUpdated = await this.prAuthorClient.updatePullRequest({
          project: project,
          repository: repository,
          pullRequestId: pullRequestToUpdate.id,
          commit: output.expect.data['base-commit-sha'] || operation.job.source.commit!,
          author: {
            email: this.taskInputs.authorEmail || DEPENDABOT_DEFAULT_AUTHOR_EMAIL,
            name: this.taskInputs.authorName || DEPENDABOT_DEFAULT_AUTHOR_NAME,
          },
          changes: getPullRequestChangedFilesForOutputData(output.expect.data),
          skipIfDraft: true,
          skipIfCommitsFromAuthorsOtherThan: this.taskInputs.authorEmail || DEPENDABOT_DEFAULT_AUTHOR_EMAIL,
          skipIfNotBehindTargetBranch: true,
        });

        // Re-approve the pull request, if required
        if (this.taskInputs.autoApprove && this.prApproverClient && pullRequestWasUpdated) {
          await this.prApproverClient.approvePullRequest({
            project: project,
            repository: repository,
            pullRequestId: pullRequestToUpdate.id,
          });
        }

        return { success: pullRequestWasUpdated, pr: pullRequestToUpdate.id };
      }

      case 'close_pull_request': {
        if (this.taskInputs.dryRun) {
          warning(`Skipping pull request closure as 'dryRun' is set to 'true'`);
          return { success: true };
        }

        // Find the pull request to close
        const pullRequestToClose = getPullRequestForDependencyNames(
          this.existingPullRequests,
          packageManager,
          output.expect.data['dependency-names'],
        );
        if (!pullRequestToClose) {
          error(
            `Could not find pull request to close for package manager '${packageManager}' with dependencies '${output.expect.data['dependency-names'].join(', ')}'`,
          );
          return { success: false };
        }

        // TODO: GitHub Dependabot will close with reason "Superseded by ${new_pull_request_id}" when another PR supersedes it.
        //       How do we detect this? Do we need to?

        // Close the pull request
        const success = await this.prAuthorClient.abandonPullRequest({
          project: project,
          repository: repository,
          pullRequestId: pullRequestToClose.id,
          comment: getPullRequestCloseReasonForOutputData(output.expect.data),
          deleteSourceBranch: true,
        });
        return { success, pr: pullRequestToClose.id };
      }

      case 'update_dependency_list':
        // No action required
        return { success: true };

      case 'mark_as_processed':
        // No action required
        return { success: true };

      case 'record_ecosystem_versions':
        // No action required
        return { success: true };

      case 'record_ecosystem_meta':
        // No action required
        return { success: true };

      case 'record_update_job_error':
        error(
          `Update job error: ${output.expect.data['error-type']} ${JSON.stringify(output.expect.data['error-details'])}`,
        );
        return { success: false };

      case 'record_update_job_unknown_error':
        error(
          `Update job unknown error: ${output.expect.data['error-type']}, ${JSON.stringify(output.expect.data['error-details'])}`,
        );
        return { success: false };

      case 'increment_metric':
        // No action required
        return { success: true };

      case 'record_metrics':
        // No action required
        return { success: true };

      default:
        warning(`Unknown dependabot output type '${type}', ignoring...`);
        return { success: true };
    }
  }
}
