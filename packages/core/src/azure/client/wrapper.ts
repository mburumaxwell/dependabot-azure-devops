import { normalizeBranchName, normalizeFilePath } from '@/dependabot';
import { logger } from '@/logger';
import type { AzdoEvent, AzdoEventType } from '../events';
import type { AzureDevOpsOrganizationUrl } from '../url-parts';
import { AzureDevOpsClient } from './client';
import type {
  AzdoFileChange,
  AzdoGitUserDate,
  AzdoIdentityRefWithVote,
  AzdoPrExtractedWithProperties,
  AzdoPullRequestMergeStrategy,
  AzdoSubscriptionsQuery,
} from './types';

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
  public readonly inner: AzureDevOpsClient;

  private authenticatedUserId?: string;
  private resolvedUserIds: Record<string, string> = {};

  /**
   * Create a new Azure DevOps client wrapper.
   * @param url The Azure DevOps organization URL
   * @param accessToken The personal access token for authentication
   * @param debug Enable debug logging for API requests (default: false)
   */
  constructor(url: AzureDevOpsOrganizationUrl, accessToken: string, debug: boolean = false) {
    this.inner = new AzureDevOpsClient(url, accessToken, debug);
  }

  /**
   * Get the identity of the authenticated user.
   * The result is cached after the first call to avoid repeated API requests.
   */
  public async getUserId(): Promise<string> {
    if (!this.authenticatedUserId) {
      const connectionData = await this.inner.connection.get();
      this.authenticatedUserId = connectionData?.authenticatedUser?.id;
      if (!this.authenticatedUserId) {
        throw new Error('Failed to get authenticated user ID');
      }
    }
    return this.authenticatedUserId;
  }

  /**
   * Get the identity id from a user name, email, or group name.
   * Results are cached to avoid repeated API requests for the same identifier.
   *
   * Requires scope "Identity (Read)" (vso.identity).
   * @param identifier Username, email, or group name to resolve
   * @returns The resolved identity ID, or undefined if not found or on error
   */
  public async resolveIdentityId(identifier: string): Promise<string | undefined> {
    if (this.resolvedUserIds[identifier]) {
      return this.resolvedUserIds[identifier];
    }
    try {
      const identities = await this.inner.identity.get(identifier);
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
   *
   * Requires scope "Code (Read)" (vso.code).
   * @param options Repository identification options (project and repository)
   * @returns The normalized default branch name (e.g., "main"), or undefined if not found
   */
  public async getDefaultBranch(options: AzdoRepositoryOptions): Promise<string | undefined> {
    return normalizeBranchName((await this.inner.repositories.get(options.project, options.repository))?.defaultBranch);
  }

  /**
   * Get the list of branch names for a repository.
   *
   * Requires scope "Code (Read)" (vso.code).
   * @param options Repository identification options (project and repository)
   * @returns Array of normalized branch names, or undefined if not found
   */
  public async getBranchNames(options: AzdoRepositoryOptions): Promise<string[] | undefined> {
    return (await this.inner.repositories.getRefs(options.project, options.repository))?.map((r) =>
      normalizeBranchName(r.name),
    );
  }

  /**
   * Get the properties for all active pull requests created by the specified user.
   * This retrieves both the pull request IDs and their associated properties.
   *
   * Requires scope "Code (Read)" (vso.code).
   * @param options Repository identification options including the creator user ID
   * @returns Array of pull request IDs with their properties, empty array on error
   */
  public async getActivePullRequestProperties({
    project,
    repository,
    creatorId,
  }: AzdoRepositoryOptions & { creatorId: string }): Promise<AzdoPrExtractedWithProperties[]> {
    try {
      const pullRequests = await this.inner.pullRequests.list(project, repository, creatorId, 'active');
      if (!pullRequests || pullRequests.length === 0) {
        return [];
      }

      return await Promise.all(
        pullRequests.map(async (pr) => {
          const properties = await this.inner.pullRequests.getProperties(project, repository, pr.pullRequestId);
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
   * Create a new pull request with the specified changes.
   * This method performs the following operations:
   * 1. Resolves assignee identities for assignees (if specified)
   * 2. Creates a new branch and pushes changes
   * 3. Creates the pull request with assignees (optional reviewers), labels, and work items
   * 4. Sets pull request properties for dependency metadata
   * 5. Configures auto-complete options (if specified)
   *
   * Requires scope "Code (Write)" (vso.code_write).
   * Requires scope "Identity (Read)" (vso.identity), if assignees are specified.
   * @param options Pull request creation options including changes, assignees, and auto-complete settings
   * @returns The created pull request ID, or null on error
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
      const push = await this.inner.git.createPush(options.project, options.repository, {
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
      const pullRequest = await this.inner.pullRequests.create(options.project, options.repository, {
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
        const newProperties = await this.inner.pullRequests.setProperties(
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
        const updatedPullRequest = await this.inner.pullRequests.update(
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
   * Update an existing pull request with new changes.
   * This method performs the following operations:
   * 1. Validates the pull request hasn't been modified by another author
   * 2. Checks if the source branch is behind the target branch
   * 3. Rebases the target branch into the source branch if needed
   * 4. Pushes the new changes to the source branch
   *
   * Requires scope "Code (Read & Write)" (vso.code, vso.code_write).
   * @param options Pull request update options including the commit and changes
   * @returns True if successful, false on error
   */
  public async updatePullRequest(options: AzdoPullRequestUpdateOptions): Promise<boolean> {
    logger.info(`Updating pull request #${options.pullRequestId}...`);
    try {
      // Get the pull request details
      const pullRequest = await this.inner.pullRequests.get(options.project, options.repository, options.pullRequestId);
      if (!pullRequest) {
        throw new Error(`Pull request #${options.pullRequestId} not found`);
      }

      // Skip if the pull request has been modified by another author
      const commits = await this.inner.pullRequests.getCommits(
        options.project,
        options.repository,
        options.pullRequestId,
      );
      if (commits?.some((c) => c.author?.email !== options.author.email)) {
        logger.info(` - Skipping update as pull request has been modified by another user.`);
        return true;
      }

      // Get the branch stats to check if the source branch is behind the target branch
      const stats = await this.inner.repositories.getBranchStats(
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
        const rebase = await this.inner.git.updateRef(options.project, options.repository, [
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
      const push = await this.inner.git.createPush(options.project, options.repository, {
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
   * Approve a pull request as the authenticated user.
   * Sets the reviewer vote to 10 (approved).
   *
   * Requires scope "Code (Write)" (vso.code_write).
   * @param options Pull request identification options
   * @returns True if successful, false on error
   */
  public async approvePullRequest(options: AzdoPullRequestOptions): Promise<boolean> {
    logger.info(`Approving pull request #${options.pullRequestId}...`);
    try {
      // Approve the pull request
      logger.info(` - Updating reviewer vote on pull request...`);
      const userId = await this.getUserId();
      const userVote = await this.inner.pullRequests.approve(
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
   * Abandon a pull request and optionally delete its source branch.
   * This method performs the following operations:
   * 1. Adds an optional comment explaining the abandonment reason
   * 2. Sets the pull request status to abandoned
   * 3. Deletes the source branch if requested
   *
   * Requires scope "Code (Write)" (vso.code_write).
   * @param options Pull request abandonment options including optional comment and branch deletion flag
   * @returns True if successful, false on error
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
      const abandonedPullRequest = await this.inner.pullRequests.abandon(
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
        const deletedBranch = await this.inner.git.updateRef(options.project, options.repository, [
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
   * The comment thread is created with a closed status and system comment type.
   *
   * Requires scope "Code (Write)" (vso.code_write).
   * @param options Comment creation options including content and optional user ID
   * @returns The created thread ID, or undefined on error
   */
  public async addCommentThread(options: AzdoPullRequestCommentCreateOptions): Promise<number | undefined> {
    const userId = options.userId ?? (await this.getUserId());
    const thread = await this.inner.pullRequests.createCommentThread(
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

  /**
   * Create or update webhook subscriptions for Azure DevOps events.
   * This sets up subscriptions for various git events (push, pull request updates, repository changes, etc.)
   * and ensures they are configured to send webhooks to the specified URL.
   * Existing subscriptions matching the URL will be updated, otherwise new subscriptions are created.
   *
   * Requires scope "Service Hooks (Read & Write)" (vso.hooks_write).
   * @returns Array of subscription IDs that were created or updated
   */
  public async createOrUpdateHookSubscriptions({
    url,
    headers,
    project,
  }: {
    url: string;
    headers: Record<string, string>;
    project: string;
  }) {
    // events are registered per project because, the git.repo.* events do not support global subscriptions
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

    const query = this.buildSubscriptionsQuery({ url, project });
    const subscriptions = await this.inner.subscriptions.query(query);

    // iterate each subscription checking if creation or update is required
    const ids: string[] = [];
    for (const [eventType, resourceVersion] of subscriptionTypes) {
      // find existing one
      const existing = subscriptions.find((sub) => {
        return sub.eventType === eventType && sub.resourceVersion === resourceVersion;
      });

      let subscription: typeof existing;

      // if we have an existing one, update it, otherwise create a new one
      if (existing) {
        // publisherId, consumerId, and consumerActionId cannot be updated
        existing.status = 'enabled';
        existing.eventType = eventType;
        existing.resourceVersion = resourceVersion;
        existing.publisherInputs = this.makeTfsPublisherInputs({ eventType, project });
        existing.consumerInputs = this.makeWebhookConsumerInputs({ url, headers });
        subscription = await this.inner.subscriptions.replace(existing.id, existing);
      } else {
        subscription = await this.inner.subscriptions.create({
          status: 'enabled',
          eventType,
          resourceVersion,

          publisherId: 'tfs',
          publisherInputs: this.makeTfsPublisherInputs({ eventType, project }),
          consumerId: 'webHooks',
          consumerActionId: 'httpRequest',
          consumerInputs: this.makeWebhookConsumerInputs({ url, headers }),
        });
      }

      ids.push(subscription.id);
    }

    // delete any other existing subscriptions that are not in our desired list
    for (const sub of subscriptions) {
      if (!ids.includes(sub.id)) {
        await this.inner.subscriptions.delete(sub.id);
      }
    }
  }

  /**
   * Remove all webhook subscriptions for a specific URL.
   * This finds all subscriptions matching the provided URL and deletes them.
   *
   * Requires scope "Service Hooks (Read & Write)" (vso.hooks_write).
   */
  public async deleteHookSubscriptions({ url, project }: { url: string; project: string }) {
    const query = this.buildSubscriptionsQuery({ url, project });
    const subscriptions = await this.inner.subscriptions.query(query);

    // iterate each subscription and delete it
    for (const sub of subscriptions) {
      await this.inner.subscriptions.delete(sub.id);
    }
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

  private buildSubscriptionsQuery({ url, project }: { url: string; project: string }): AzdoSubscriptionsQuery {
    return {
      publisherId: 'tfs',
      publisherInputFilters: [
        {
          conditions: [{ operator: 'equals', inputId: 'projectId', caseSensitive: false, inputValue: project }],
        },
      ],
      consumerId: 'webHooks',
      consumerActionId: 'httpRequest',
      consumerInputFilters: [
        {
          conditions: [{ operator: 'equals', inputId: 'url', caseSensitive: false, inputValue: url }],
        },
      ],
    };
  }

  private makeTfsPublisherInputs({
    eventType,
    project,
  }: {
    eventType: AzdoEventType;
    project: string;
  }): Record<string, string> {
    // possible inputs are available via an authenticated request to
    // https://dev.azure.com/{organization}/_apis/hooks/publishers/tfs

    return {
      projectId: project, // project to restrict events to

      ...(eventType === 'git.pullrequest.updated' && {
        // only trigger on updates to the pull request status (e.g. active, abandoned, completed)
        notificationType: 'StatusUpdateNotification',
      }),
      ...(eventType === 'git.pullrequest.merged' && {
        // only trigger on conflicts
        mergeResult: 'Conflicts',
      }),
    };
  }

  private makeWebhookConsumerInputs({
    url,
    headers,
  }: {
    url: string;
    headers: Record<string, string>;
  }): Record<string, string> {
    return {
      // possible inputs are available via an authenticated request to
      // https://dev.azure.com/{organization}/_apis/hooks/consumers/webHooks

      url,
      acceptUntrustedCerts: 'false',
      httpHeaders: Object.entries(headers)
        .map(([key, value]) => `${key}:${value}`)
        .join('\n'),
      messagesToSend: 'none',
      detailedMessagesToSend: 'none',
    };
  }
}
