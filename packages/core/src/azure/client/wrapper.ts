import { logger } from '@/logger';
import type { AzdoEvent, AzdoEventType } from '../events';
import type { AzureDevOpsOrganizationUrl } from '../url-parts';
import { AzureDevOpsClient } from './client';
import { SUBSCRIBER_ID } from './constants';
import type {
  AzdoFileChange,
  AzdoGitUserDate,
  AzdoIdentityRefWithVote,
  AzdoPrExtractedWithProperties,
  AzdoPullRequestMergeStrategy,
} from './types';
import { normalizeBranchName, normalizeFilePath } from './utils';

type AzdoRepositoryOptions = { project: string; repository: string };

type AzdoPullRequestCreateOptions = AzdoRepositoryOptions & {
  source: { branch: string; commit: string };
  target: { branch: string };
  author: AzdoGitUserDate;
  title: string;
  description: string;
  commitMessage: string;
  autoComplete?: {
    ignorePolicyConfigIds?: number[];
    mergeStrategy?: AzdoPullRequestMergeStrategy;
  };
  assignees?: string[];
  labels?: string[];
  workItems?: string[];
  changes: AzdoFileChange[];
  properties?: { name: string; value: string }[];
};

type AzdoPullRequestOptions = AzdoRepositoryOptions & { pullRequestId: number };

type AzdoPullRequestUpdateOptions = AzdoPullRequestOptions & {
  commit: string;
  author: AzdoGitUserDate;
  changes: AzdoFileChange[];
};

type AzdoPullRequestAbandonOptions = AzdoPullRequestOptions & {
  comment?: string;
  deleteSourceBranch?: boolean;
};

type AzdoPullRequestCommentCreateOptions = AzdoPullRequestOptions & {
  content: string;
  userId?: string;
};

export class AzureDevOpsClientWrapper {
  public readonly client: AzureDevOpsClient;

  private authenticatedUserId?: string;
  private resolvedUserIds: Record<string, string> = {};

  constructor(url: AzureDevOpsOrganizationUrl, accessToken: string, debug: boolean = false) {
    this.client = new AzureDevOpsClient(url, accessToken, debug);
  }

  /**
   * Get the identity of the authenticated user.
   */
  public async getUserId(): Promise<string> {
    if (!this.authenticatedUserId) {
      const connectionData = await this.client.connection.get();
      this.authenticatedUserId = connectionData?.authenticatedUser?.id;
      if (!this.authenticatedUserId) {
        throw new Error('Failed to get authenticated user ID');
      }
    }
    return this.authenticatedUserId;
  }

  /**
   * Get the identity id from a user name, email, or group name.
   * Requires scope "Identity (Read)" (vso.identity).
   * @param identifier username, email, or group name
   */
  public async resolveIdentityId(identifier: string): Promise<string | undefined> {
    if (this.resolvedUserIds[identifier]) {
      return this.resolvedUserIds[identifier];
    }
    try {
      const identities = await this.client.identity.get(identifier);
      if (!identities || identities.length === 0) {
        return undefined;
      }
      this.resolvedUserIds[identifier] = identities[0]!.id;
      return this.resolvedUserIds[identifier];
    } catch (e) {
      logger.error(`Failed to resolve user id: ${e}`);
      logger.debug(e); // Dump the error stack trace to help with debugging
      return undefined;
    }
  }

  /**
   * Get the default branch for a repository.
   * Requires scope "Code (Read)" (vso.code).
   */
  public async getDefaultBranch(options: AzdoRepositoryOptions): Promise<string | undefined> {
    return normalizeBranchName(
      (await this.client.repositories.get(options.project, options.repository))?.defaultBranch,
    );
  }

  /**
   * Get the list of branch names for a repository.
   * Requires scope "Code (Read)" (vso.code).
   */
  public async getBranchNames(options: AzdoRepositoryOptions): Promise<string[] | undefined> {
    return (await this.client.repositories.getRefs(options.project, options.repository))?.map((r) =>
      normalizeBranchName(r.name),
    );
  }

  /**
   * Get the properties for all active pull request created by the supplied user.
   * Requires scope "Code (Read)" (vso.code).
   */
  public async getActivePullRequestProperties({
    project,
    repository,
    creatorId,
  }: AzdoRepositoryOptions & { creatorId: string }): Promise<AzdoPrExtractedWithProperties[]> {
    try {
      const pullRequests = await this.client.pullRequests.list(project, repository, creatorId, 'active');
      if (!pullRequests || pullRequests.length === 0) {
        return [];
      }

      return await Promise.all(
        pullRequests.map(async (pr) => {
          const properties = await this.client.pullRequests.getProperties(project, repository, pr.pullRequestId);
          return { pullRequestId: pr.pullRequestId, properties };
        }),
      );
    } catch (e) {
      logger.error(`Failed to list active pull request properties: ${e}`);
      logger.debug(e); // Dump the error stack trace to help with debugging
      return [];
    }
  }

  /**
   * Create a new pull request.
   * Requires scope "Code (Write)" (vso.code_write).
   * Requires scope "Identity (Read)" (vso.identity), if assignees are specified.
   */
  public async createPullRequest(options: AzdoPullRequestCreateOptions): Promise<number | null> {
    logger.info(`Creating pull request '${options.title}'...`);
    try {
      const userId = await this.getUserId();

      // Map the list of the pull request reviewer ids
      // NOTE: Azure DevOps does not have a concept of assignees.
      //       We treat them as optional reviewers. Branch policies should be used for required reviewers.
      const reviewers: AzdoIdentityRefWithVote[] = [];
      if (options.assignees && options.assignees.length > 0) {
        for (const assignee of options.assignees) {
          const identityId = this.isGuid(assignee) ? assignee : await this.resolveIdentityId(assignee);
          if (identityId && !reviewers.some((r) => r.id === identityId)) {
            reviewers.push({ id: identityId });
          } else {
            logger.warn(`Unable to resolve assignee identity '${assignee}'`);
          }
        }
      }

      // Create the source branch and push a commit with the dependency file changes
      logger.info(` - Pushing ${options.changes.length} file change(s) to branch '${options.source.branch}'...`);
      const push = await this.client.git.push(options.project, options.repository, {
        refUpdates: [
          {
            name: `refs/heads/${options.source.branch}`,
            oldObjectId: options.source.commit,
          },
        ],
        commits: [
          {
            comment: options.commitMessage,
            author: options.author,
            changes: options.changes
              .filter((change) => change.changeType !== 'none')
              .map(({ changeType, ...change }) => {
                return {
                  changeType,
                  item: { path: normalizeFilePath(change.path) },
                  newContent:
                    changeType !== 'delete'
                      ? {
                          content: Buffer.from(change.content!, <BufferEncoding>change.encoding).toString('base64'),
                          contentType: 'base64encoded',
                        }
                      : undefined,
                };
              }),
          },
        ],
      });
      if (!push?.commits?.length) {
        throw new Error('Failed to push changes to source branch, no commits were created');
      }
      logger.info(` - Pushed commit: ${push.commits.map((c) => c.commitId).join(', ')}.`);

      // Create the pull request
      logger.info(` - Creating pull request to merge '${options.source.branch}' into '${options.target.branch}'...`);
      const pullRequest = await this.client.pullRequests.create(options.project, options.repository, {
        sourceRefName: `refs/heads/${options.source.branch}`,
        targetRefName: `refs/heads/${options.target.branch}`,
        title: options.title,
        description: options.description,
        reviewers,
        workItemRefs: options.workItems?.map((id) => ({ id: id })),
        labels: options.labels?.map((label) => ({ name: label })),
      });
      if (!pullRequest?.pullRequestId) {
        throw new Error('Failed to create pull request, no pull request id was returned');
      }
      logger.info(` - Created pull request: #${pullRequest.pullRequestId}.`);

      // Add the pull request properties
      if (options.properties && options.properties.length > 0) {
        logger.info(` - Adding dependency metadata to pull request properties...`);
        const newProperties = await this.client.pullRequests.setProperties(
          options.project,
          options.repository,
          pullRequest.pullRequestId,
          options.properties,
        );
        if (!newProperties?.count) {
          throw new Error('Failed to add dependency metadata properties to pull request');
        }
      }

      // TODO: Upload the pull request description as a 'changes.md' file attachment?
      //       This might be a way to work around the 4000 character limit for PR descriptions, but needs more investigation.
      //       https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-request-attachments/create?view=azure-devops-rest-7.1

      // Set the pull request auto-complete status
      if (options.autoComplete) {
        logger.info(` - Updating auto-complete options...`);
        const updatedPullRequest = await this.client.pullRequests.update(
          options.project,
          options.repository,
          pullRequest.pullRequestId,
          {
            autoCompleteSetBy: { id: userId },
            completionOptions: {
              autoCompleteIgnoreConfigIds: options.autoComplete.ignorePolicyConfigIds,
              deleteSourceBranch: true,
              mergeCommitMessage: this.mergeCommitMessage(
                pullRequest.pullRequestId,
                options.title,
                options.description,
              ),
              mergeStrategy: options.autoComplete.mergeStrategy,
              transitionWorkItems: false,
            },
          },
        );
        if (!updatedPullRequest || updatedPullRequest.autoCompleteSetBy?.id !== userId) {
          throw new Error('Failed to set auto-complete on pull request');
        }
      }

      logger.info(` - Pull request was created successfully.`);
      return pullRequest.pullRequestId;
    } catch (e) {
      logger.error(`Failed to create pull request: ${e}`);
      logger.debug(e); // Dump the error stack trace to help with debugging
      return null;
    }
  }

  /**
   * Update a pull request.
   * Requires scope "Code (Read & Write)" (vso.code, vso.code_write).
   */
  public async updatePullRequest(options: AzdoPullRequestUpdateOptions): Promise<boolean> {
    logger.info(`Updating pull request #${options.pullRequestId}...`);
    try {
      // Get the pull request details
      const pullRequest = await this.client.pullRequests.get(
        options.project,
        options.repository,
        options.pullRequestId,
      );
      if (!pullRequest) {
        throw new Error(`Pull request #${options.pullRequestId} not found`);
      }

      // Skip if the pull request has been modified by another author
      const commits = await this.client.pullRequests.getCommits(
        options.project,
        options.repository,
        options.pullRequestId,
      );
      if (commits?.some((c) => c.author?.email !== options.author.email)) {
        logger.info(` - Skipping update as pull request has been modified by another user.`);
        return true;
      }

      // Get the branch stats to check if the source branch is behind the target branch
      const stats = await this.client.repositories.getBranchStats(
        options.project,
        options.repository,
        normalizeBranchName(pullRequest.sourceRefName),
      );
      if (stats?.behindCount === undefined) {
        throw new Error(`Failed to get branch stats for '${pullRequest.sourceRefName}'`);
      }

      // Skip if the source branch is not behind the target branch
      if (stats.behindCount === 0) {
        logger.info(` - Skipping update as source branch is not behind target branch.`);
        return true;
      }

      // Rebase the target branch into the source branch to reset the "behind" count
      const sourceBranchName = normalizeBranchName(pullRequest.sourceRefName);
      const targetBranchName = normalizeBranchName(pullRequest.targetRefName);
      if (stats.behindCount > 0) {
        logger.info(
          ` - Rebasing '${targetBranchName}' into '${sourceBranchName}' (${stats.behindCount} commit(s) behind)...`,
        );
        const rebase = await this.client.git.updateRef(options.project, options.repository, [
          {
            name: pullRequest.sourceRefName,
            oldObjectId: pullRequest.lastMergeSourceCommit.commitId,
            newObjectId: options.commit,
          },
        ]);
        if (rebase?.[0]?.success !== true) {
          throw new Error('Failed to rebase the target branch into the source branch');
        }
      }

      // Push all file changes to the source branch
      logger.info(` - Pushing ${options.changes.length} file change(s) to branch '${pullRequest.sourceRefName}'...`);
      const push = await this.client.git.push(options.project, options.repository, {
        refUpdates: [
          {
            name: pullRequest.sourceRefName,
            oldObjectId: options.commit,
          },
        ],
        commits: [
          {
            comment:
              pullRequest.mergeStatus === 'conflicts'
                ? 'Resolve merge conflicts'
                : `Rebase '${sourceBranchName}' onto '${targetBranchName}'`,
            author: options.author,
            changes: options.changes
              .filter((change) => change.changeType !== 'none')
              .map(({ changeType, ...change }) => {
                return {
                  changeType,
                  item: { path: normalizeFilePath(change.path) },
                  newContent:
                    changeType !== 'delete'
                      ? {
                          content: Buffer.from(change.content!, <BufferEncoding>change.encoding).toString('base64'),
                          contentType: 'base64encoded',
                        }
                      : undefined,
                };
              }),
          },
        ],
      });
      if (!push?.commits?.length) {
        throw new Error('Failed to push changes to source branch, no commits were created');
      }
      logger.info(` - Pushed commit: ${push.commits.map((c) => c.commitId).join(', ')}.`);

      logger.info(` - Pull request was updated successfully.`);
      return true;
    } catch (e) {
      logger.error(`Failed to update pull request: ${e}`);
      logger.debug(e); // Dump the error stack trace to help with debugging
      return false;
    }
  }

  /**
   * Approve a pull request.
   * Requires scope "Code (Write)" (vso.code_write).
   */
  public async approvePullRequest(options: AzdoPullRequestOptions): Promise<boolean> {
    logger.info(`Approving pull request #${options.pullRequestId}...`);
    try {
      // Approve the pull request
      logger.info(` - Updating reviewer vote on pull request...`);
      const userId = await this.getUserId();
      const userVote = await this.client.pullRequests.approve(
        options.project,
        options.repository,
        options.pullRequestId,
        userId,
      );
      if (userVote?.vote !== 10) {
        throw new Error('Failed to approve pull request, vote was not recorded');
      }

      logger.info(` - Pull request was approved successfully.`);
      return true;
    } catch (e) {
      logger.error(`Failed to approve pull request: ${e}`);
      logger.debug(e); // Dump the error stack trace to help with debugging
      return false;
    }
  }

  /**
   * Abandon a pull request.
   * Requires scope "Code (Write)" (vso.code_write).
   */
  public async abandonPullRequest(options: AzdoPullRequestAbandonOptions): Promise<boolean> {
    logger.info(`Abandoning pull request #${options.pullRequestId}...`);
    try {
      const userId = await this.getUserId();

      // Add a comment to the pull request, if supplied
      if (options.comment) {
        logger.info(` - Adding abandonment reason comment to pull request...`);
        const threadId = await this.addCommentThread({
          ...options,
          content: options.comment,
          userId,
        });
        if (!threadId) {
          throw new Error('Failed to add comment to pull request, thread was not created');
        }
      }

      // Abandon the pull request
      logger.info(` - Abandoning pull request...`);
      const abandonedPullRequest = await this.client.pullRequests.abandon(
        options.project,
        options.repository,
        options.pullRequestId,
        userId,
      );
      if (abandonedPullRequest?.status !== 'abandoned') {
        throw new Error('Failed to abandon pull request, status was not updated');
      }

      // Delete the source branch if required
      if (options.deleteSourceBranch) {
        logger.info(` - Deleting source branch...`);
        const deletedBranch = await this.client.git.updateRef(options.project, options.repository, [
          {
            name: abandonedPullRequest.sourceRefName,
            oldObjectId: abandonedPullRequest.lastMergeSourceCommit.commitId,
            newObjectId: '0000000000000000000000000000000000000000',
            isLocked: false,
          },
        ]);
        if (deletedBranch?.[0]?.success !== true) {
          throw new Error('Failed to delete the source branch');
        }
      }

      logger.info(` - Pull request was abandoned successfully.`);
      return true;
    } catch (e) {
      logger.error(`Failed to abandon pull request: ${e}`);
      logger.debug(e); // Dump the error stack trace to help with debugging
      return false;
    }
  }

  /**
   * Add a comment thread on a pull request.
   * Requires scope "Code (Write)" (vso.code_write).
   */
  public async addCommentThread(options: AzdoPullRequestCommentCreateOptions): Promise<number | undefined> {
    const userId = options.userId ?? (await this.getUserId());
    const thread = await this.client.pullRequests.createCommentThread(
      options.project,
      options.repository,
      options.pullRequestId,
      {
        status: 'closed',
        comments: [
          {
            author: { id: userId },
            content: options.content,
            commentType: 'system',
          },
        ],
      },
    );
    return thread?.id;
  }

  public async createOrUpdateHookSubscriptions({
    url,
    token,
    project,
  }: {
    url: string;
    token: string;
    project: string;
  }) {
    const subscriptionTypes = new Map<AzdoEventType, AzdoEvent['resourceVersion']>([
      ['git.push', '1.0'],
      ['git.pullrequest.updated', '1.0'],
      ['git.pullrequest.merged', '1.0'],
      ['git.repo.created', '1.0-preview.1'],
      ['git.repo.deleted', '1.0-preview.1'],
      ['git.repo.renamed', '1.0-preview.1'],
      ['git.repo.statuschanged', '1.0-preview.1'],
      ['ms.vss-code.git-pullrequest-comment-event', '2.0'],
    ]);

    const subscriptions = await this.client.subscriptions.query({
      publisherId: 'tfs',
      publisherInputFilters: [
        {
          conditions: [{ operator: 'equals', inputId: 'projectId', inputValue: project }],
        },
      ],
      subscriberId: SUBSCRIBER_ID,

      consumerId: 'webHooks',
      consumerActionId: 'httpRequest',
    });

    // iterate each subscription checking if creation or update is required
    const ids: string[] = [];
    for (const [eventType, resourceVersion] of subscriptionTypes) {
      // find existing one
      const existing = subscriptions.find((sub) => {
        return (
          sub.eventType === eventType &&
          sub.resourceVersion === resourceVersion &&
          sub.consumerInputs.url?.toLowerCase() === url.toLowerCase()
        );
      });

      let subscription: typeof existing;

      // if we have an existing one, update it, otherwise create a new one
      if (existing) {
        // publisherId, consumerId, and consumerActionId cannot be updated
        existing.status = 'enabled';
        existing.eventType = eventType;
        existing.resourceVersion = resourceVersion;
        existing.publisherInputs = this.makeTfsPublisherInputs(eventType, project);
        existing.consumerInputs = this.makeWebhookConsumerInputs({ token, url, project });
        subscription = await this.client.subscriptions.replace(existing.id, existing);
      } else {
        subscription = await this.client.subscriptions.create({
          status: 'enabled',
          eventType,
          resourceVersion,

          publisherId: 'tfs',
          publisherInputs: this.makeTfsPublisherInputs(eventType, project),
          consumerId: 'webHooks',
          consumerActionId: 'httpRequest',
          consumerInputs: this.makeWebhookConsumerInputs({ token, url, project }),
        });
      }

      ids.push(subscription.id);
    }

    return ids;
  }

  private mergeCommitMessage(id: number, title: string, description: string): string {
    //
    // The merge commit message should contain the PR number and title for tracking.
    // This is the default behaviour in Azure DevOps.
    // Example:
    //   Merged PR 24093: Bump Tingle.Extensions.Logging.LogAnalytics from 3.4.2-ci0005 to 3.4.2-ci0006
    //
    //   Bumps [Tingle.Extensions.Logging.LogAnalytics](...) from 3.4.2-ci0005 to 3.4.2-ci0006
    //   - [Release notes](....)
    //   - [Changelog](....)
    //   - [Commits](....)
    //
    // There appears to be a DevOps bug when setting "completeOptions" with a "mergeCommitMessage" even when truncated to 4000 characters.
    // The error message is:
    //   Invalid argument value.
    //   Parameter name: Completion options have exceeded the maximum encoded length (4184/4000)
    //
    // The effective limit seems to be about 3500 characters:
    //   https://developercommunity.visualstudio.com/t/raise-the-character-limit-for-pull-request-descrip/365708#T-N424531
    //
    return `Merged PR ${id}: ${title}\n\n${description}`.slice(0, 3500);
  }

  private isGuid(guid: string): boolean {
    const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return regex.test(guid);
  }

  private makeTfsPublisherInputs(eventType: AzdoEventType, project: string): Record<string, string> {
    // possible inputs are available via an authenticated request to
    // https://dev.azure.com/{organization}/_apis/hooks/publishers/tfs

    return {
      // always include the project identifier, to restrict events from that project
      projectId: project, // Team Project to restrict events to
      subscriberId: SUBSCRIBER_ID, // Subscriber id of the group the subscription is associated with

      ...(eventType === 'git.pullrequest.updated' && {
        // only trigger on updates to the pull request status (e.g. active, abandoned, completed)
        notificationType: 'StatusUpdateNotification',
      }),
      ...(eventType === 'git.pullrequest.merged' && {
        // only trigger on conflicts
        notificationType: 'Conflicts',
      }),
    };
  }

  private makeWebhookConsumerInputs({
    token,
    url,
    project,
  }: {
    token: string;
    url: string;
    project: string;
  }): Record<string, string> {
    return {
      // possible inputs are available via an authenticated request to
      // https://dev.azure.com/{organization}/_apis/hooks/consumers/webHooks

      url,
      acceptUntrustedCerts: 'false',
      // TODO: find out if we can pass without basic auth username and password
      basicAuthUsername: project,
      basicAuthPassword: token,
      httpHeaders: `Authorization: ${token}`,
      messagesToSend: 'none',
      detailedMessagesToSend: 'none',
    };
  }
}
