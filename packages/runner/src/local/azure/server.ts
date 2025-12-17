import type {
  AzdoPrExtractedWithProperties,
  AzureDevOpsClientWrapper,
  AzureDevOpsRepositoryUrl,
} from '@paklo/core/azure';
import {
  type AzdoPullRequestMergeStrategy,
  buildPullRequestProperties,
  getPullRequestChangedFiles,
  getPullRequestForDependencyNames,
  PR_DESCRIPTION_MAX_LENGTH,
  parsePullRequestProperties,
} from '@paklo/core/azure';
import {
  type DependabotRequest,
  getBranchNameForUpdate,
  getPullRequestCloseReason,
  getPullRequestDependencies,
  getPullRequestDescription,
} from '@paklo/core/dependabot';
import { logger } from '@paklo/core/logger';
import { LocalDependabotServer, type LocalDependabotServerOptions } from '../server';

export type AzureLocalDependabotServerOptions = LocalDependabotServerOptions & {
  url: AzureDevOpsRepositoryUrl;
  authorClient: AzureDevOpsClientWrapper;
  autoApprove: boolean;
  approverClient?: AzureDevOpsClientWrapper;
  setAutoComplete: boolean;
  mergeStrategy?: AzdoPullRequestMergeStrategy;
  autoCompleteIgnoreConfigIds: number[];
  existingBranchNames: string[] | undefined;
  existingPullRequests: AzdoPrExtractedWithProperties[];
};

export class AzureLocalDependabotServer extends LocalDependabotServer {
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: options is used
  private readonly options: AzureLocalDependabotServerOptions;

  constructor(options: AzureLocalDependabotServerOptions) {
    super(options);
    this.options = options;
  }

  protected override async handle(id: string, request: DependabotRequest): Promise<boolean> {
    await super.handle(id, request); // common logic

    const { options, affectedPullRequestIds } = this;
    const {
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
      dryRun,
    } = options;

    const { type, data } = request;
    const job = await this.job(id);
    if (!job) {
      logger.error(`No job found for ID '${id}', cannot process request of type '${type}'`);
      return false;
    }
    const { 'package-manager': packageManager } = job;
    logger.info(`Processing '${type}' for job ID '${id}'`);

    const update = this.update(id)!; // exists because job exists
    const { project, repository } = url;

    switch (type) {
      // Documentation on the 'data' model for each output type can be found here:
      // See: https://github.com/dependabot/cli/blob/main/internal/model/update.go

      case 'create_pull_request': {
        const title = data['pr-title'];
        if (dryRun) {
          logger.warn(`Skipping pull request creation of '${title}' as 'dryRun' is set to 'true'`);
          return true;
        }

        // Skip if active pull request limit reached.
        const openPullRequestsLimit = update['open-pull-requests-limit']!;

        // Parse the Dependabot metadata for the existing pull requests that are related to this update
        // Dependabot will use this to determine if we need to create new pull requests or update/close existing ones
        const existingPullRequestsForPackageManager = parsePullRequestProperties(existingPullRequests, packageManager);
        const existingPullRequestsCount = Object.entries(existingPullRequestsForPackageManager).length;
        const openPullRequestsCount = affectedPullRequestIds.get(id)!.created.length + existingPullRequestsCount;
        const hasReachedOpenPullRequestLimit =
          openPullRequestsLimit > 0 && openPullRequestsCount >= openPullRequestsLimit;

        if (hasReachedOpenPullRequestLimit) {
          logger.warn(
            `Skipping pull request creation of '${title}' as the open pull requests limit (${openPullRequestsLimit}) has been reached`,
          );
          return true;
        }

        const changedFiles = getPullRequestChangedFiles(data);
        const dependencies = getPullRequestDependencies(data);
        const targetBranch = update['target-branch'] || (await authorClient.getDefaultBranch({ project, repository }));
        const sourceBranch = getBranchNameForUpdate({
          packageEcosystem: update['package-ecosystem'],
          targetBranchName: targetBranch,
          directory: update.directory || update.directories?.find((dir) => changedFiles[0]?.path?.startsWith(dir)),
          dependencyGroupName: !Array.isArray(dependencies) ? dependencies['dependency-group-name'] : undefined,
          dependencies: !Array.isArray(dependencies) ? dependencies.dependencies : dependencies,
          separator: update['pull-request-branch-name']?.separator,
        });

        // Check if the source branch already exists or conflicts with an existing branch
        const existingBranch = existingBranchNames?.find((branch) => sourceBranch === branch) || [];
        if (existingBranch.length) {
          logger.error(
            `Unable to create pull request '${title}' as source branch '${sourceBranch}' already exists; Delete the existing branch and try again.`,
          );
          return false;
        }
        const conflictingBranches = existingBranchNames?.filter((branch) => sourceBranch.startsWith(branch)) || [];
        if (conflictingBranches.length) {
          logger.error(
            `Unable to create pull request '${title}' as source branch '${sourceBranch}' would conflict with existing branch(es) '${conflictingBranches.join(', ')}'; Delete the conflicting branch(es) and try again.`,
          );
          return false;
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
          description: getPullRequestDescription({
            packageManager,
            body: data['pr-body'],
            dependencies: data.dependencies,
            maxDescriptionLength: PR_DESCRIPTION_MAX_LENGTH,
          }),
          commitMessage: data['commit-message'],
          autoComplete: setAutoComplete
            ? {
                ignorePolicyConfigIds: autoCompleteIgnoreConfigIds,
                mergeStrategy: mergeStrategy ?? 'squash',
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
        if (newPullRequestId) {
          affectedPullRequestIds.get(id)!.created.push(newPullRequestId);
          return true;
        }
        return false;
      }

      case 'update_pull_request': {
        if (dryRun) {
          logger.warn(`Skipping pull request update as 'dryRun' is set to 'true'`);
          return true;
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
          return false;
        }

        // Update the pull request
        const pullRequestWasUpdated = await authorClient.updatePullRequest({
          project: project,
          repository: repository,
          pullRequestId: pullRequestToUpdate.pullRequestId,
          commit: data['base-commit-sha'] || job.source.commit!,
          author,
          changes: getPullRequestChangedFiles(data),
        });

        // Re-approve the pull request, if required
        if (autoApprove && approverClient && pullRequestWasUpdated) {
          await approverClient.approvePullRequest({
            project: project,
            repository: repository,
            pullRequestId: pullRequestToUpdate.pullRequestId,
          });
        }

        if (pullRequestWasUpdated) {
          affectedPullRequestIds.get(id)!.updated.push(pullRequestToUpdate.pullRequestId);
          return true;
        }
        return false;
      }

      case 'close_pull_request': {
        if (dryRun) {
          logger.warn(`Skipping pull request closure as 'dryRun' is set to 'true'`);
          return true;
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
          return false;
        }

        // TODO: GitHub Dependabot will close with reason "Superseded by ${new_pull_request_id}" when another PR supersedes it.
        //       How do we detect this? Do we need to?

        // Close the pull request
        const success = await authorClient.abandonPullRequest({
          project: project,
          repository: repository,
          pullRequestId: pullRequestToClose.pullRequestId,
          comment: getPullRequestCloseReason(data),
          deleteSourceBranch: true,
        });
        if (success) {
          affectedPullRequestIds.get(id)!.closed.push(pullRequestToClose.pullRequestId);
          return true;
        }
        return false;
      }

      case 'record_update_job_warning': {
        if (dryRun) {
          logger.warn(`Skipping warning as 'dryRun' is set to 'true'`);
          return true;
        }

        // add comment to each create/updated pull request
        const ids = affectedPullRequestIds.get(id)!.created.concat(affectedPullRequestIds.get(id)!.updated);
        for (const pullRequestId of ids) {
          await authorClient.addCommentThread({
            project: project,
            repository: repository,
            content: `### Dependabot Warning: ${data['warn-title']}\n\n${data['warn-description']}`,
            pullRequestId,
          });
        }

        return true;
      }

      // No action required
      case 'update_dependency_list':
      case 'create_dependency_submission':
      case 'mark_as_processed':
      case 'record_ecosystem_versions':
      case 'increment_metric':
      case 'record_ecosystem_meta':
      case 'record_cooldown_meta':
      case 'record_metrics': // from the runner
        return true;

      case 'record_update_job_error':
      case 'record_update_job_unknown_error':
        const unknown = type === 'record_update_job_unknown_error';
        logger.error(
          `Update${unknown ? ' unknown ' : ''})job error: ${data['error-type']} ${JSON.stringify(data['error-details'])}`,
        );
        return true;

      default:
        logger.warn(`Unknown dependabot request type '${type}', ignoring...`);
        return true;
    }
  }
}
