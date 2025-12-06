import ky, { isHTTPError, type KyInstance } from 'ky';
import { logger } from '@/logger';
import type {
  IAbandonPullRequest,
  IApprovePullRequest,
  ICreatePullRequest,
  IPullRequestComment,
  IPullRequestProperties,
  IUpdatePullRequest,
} from './models';
import type {
  AdoProperties,
  AzdoConnectionData,
  AzdoGitBranchStats,
  AzdoGitCommitRef,
  AzdoGitPush,
  AzdoGitPushCreate,
  AzdoGitRef,
  AzdoGitRefUpdateResult,
  AzdoIdentity,
  AzdoIdentityRefWithVote,
  AzdoListResponse,
  AzdoProject,
  AzdoPullRequest,
  AzdoPullRequestCommentThread,
  AzdoRepository,
  AzdoRepositoryItem,
} from './types';
import type { AzureDevOpsOrganizationUrl } from './url-parts';
import { normalizeBranchName, normalizeFilePath } from './utils';

/** Returned from AzureDevOpsWebApiClient.getUserId() when no user is authenticated */
export const ANONYMOUS_USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

/** Azure DevOps REST API client. */
export class AzureDevOpsWebApiClient {
  private readonly organisationApiUrl: string;
  private readonly identityApiUrl: string;
  private readonly accessToken: string;
  private readonly debug: boolean;
  private readonly client: KyInstance;

  private authenticatedUserId?: string;
  private resolvedUserIds: Record<string, string>;

  public static API_VERSION = '5.0'; // this is the same version used by dependabot-core
  public static API_VERSION_PREVIEW = '5.0-preview';

  constructor(url: AzureDevOpsOrganizationUrl, accessToken: string, debug: boolean = false) {
    this.organisationApiUrl = url.value.toString().replace(/\/$/, ''); // trim trailing slash
    this.identityApiUrl = url['identity-api-url'].toString().replace(/\/$/, ''); // trim trailing slash
    this.accessToken = accessToken;
    this.debug = debug;
    this.resolvedUserIds = {};

    this.client = this.createClient();
  }

  /**
   * Get the identity of the authenticated user.
   * @returns
   */
  public async getUserId(): Promise<string> {
    if (!this.authenticatedUserId) {
      const connectionData = await this.client
        .get<AzdoConnectionData>(
          this.makeUrl(`${this.organisationApiUrl}/_apis/connectiondata`, AzureDevOpsWebApiClient.API_VERSION_PREVIEW),
        )
        .json();
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
   * @param userNameEmailOrGroupName
   * @returns
   */
  public async resolveIdentityId(userNameEmailOrGroupName: string): Promise<string | undefined> {
    if (this.resolvedUserIds[userNameEmailOrGroupName]) {
      return this.resolvedUserIds[userNameEmailOrGroupName];
    }
    try {
      const identities = await this.client
        .get<AzdoListResponse<AzdoIdentity[]>>(
          this.makeUrl(`${this.identityApiUrl}/_apis/identities`, {
            searchFilter: 'General',
            filterValue: userNameEmailOrGroupName,
            queryMembership: 'None',
          }),
        )
        .json();
      if (!identities?.value || identities.value.length === 0) {
        return undefined;
      }
      this.resolvedUserIds[userNameEmailOrGroupName] = identities.value[0]!.id;
      return this.resolvedUserIds[userNameEmailOrGroupName];
    } catch (e) {
      logger.error(`Failed to resolve user id: ${e}`);
      logger.debug(e); // Dump the error stack trace to help with debugging
      return undefined;
    }
  }

  public async getProjects(): Promise<AzdoListResponse<AzdoProject[]> | undefined> {
    try {
      const projects = await this.client
        .get<AzdoListResponse<AzdoProject[]>>(this.makeUrl(`${this.organisationApiUrl}/_apis/projects`))
        .json();
      return projects;
    } catch (e) {
      logger.error(`Failed to get projects: ${e}`);
      logger.debug(e); // Dump the error stack trace to help with debugging
      return undefined;
    }
  }

  public async getProject(idOrName: string): Promise<AzdoProject | undefined> {
    try {
      const project = await this.client
        .get<AzdoProject>(this.makeUrl(`${this.organisationApiUrl}/_apis/projects/${encodeURIComponent(idOrName)}`))
        .json();
      return project;
    } catch (e) {
      logger.error(`Failed to get project: ${e}`);
      logger.debug(e); // Dump the error stack trace to help with debugging
      return undefined;
    }
  }

  public async getRepositories(projectIdOrName: string): Promise<AzdoListResponse<AzdoRepository[]> | undefined> {
    try {
      const repos = await this.client
        .get<AzdoListResponse<AzdoRepository[]>>(
          this.makeUrl(`${this.organisationApiUrl}/${encodeURIComponent(projectIdOrName)}/_apis/git/repositories`),
        )
        .json();
      return repos;
    } catch (e) {
      logger.error(`Failed to get repositories: ${e}`);
      logger.debug(e); // Dump the error stack trace to help with debugging
      return undefined;
    }
  }

  public async getRepository(projectIdOrName: string, repositoryIdOrName: string): Promise<AzdoRepository | undefined> {
    try {
      const repo = await this.client
        .get<AzdoRepository>(
          this.makeUrl(
            `${this.organisationApiUrl}/${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}`,
          ),
        )
        .json();
      return repo;
    } catch (e) {
      if (isHTTPError(e) && e.response.status === 404) {
        // repository no longer exists
        return undefined;
      } else {
        logger.error(`Failed to get repository: ${e}`);
        logger.debug(e); // Dump the error stack trace to help with debugging
      }
      return undefined;
    }
  }

  public async getRepositoryItem(
    projectIdOrName: string,
    repositoryIdOrName: string,
    path: string,
    includeContent: boolean = true,
    latestProcessedChange: boolean = true,
  ): Promise<AzdoRepositoryItem | undefined> {
    try {
      const item = await this.client
        .get<AzdoRepositoryItem>(
          this.makeUrl(
            `${this.organisationApiUrl}/${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}/items`,
            {
              path,
              includeContent,
              latestProcessedChange,
            },
          ),
        )
        .json();
      return item;
    } catch (e) {
      if (isHTTPError(e) && e.response.status === 404) {
        // item does not exist
        return undefined;
      } else {
        logger.error(`Failed to get repository item: ${e}`);
        logger.debug(e); // Dump the error stack trace to help with debugging
      }
      return undefined;
    }
  }

  /**
   * Get the default branch for a repository.
   * Requires scope "Code (Read)" (vso.code).
   * @param project
   * @param repository
   * @returns
   */
  public async getDefaultBranch(project: string, repository: string): Promise<string | undefined> {
    try {
      const repo = await this.client
        .get<AzdoRepository>(this.makeUrl(`${this.organisationApiUrl}/${project}/_apis/git/repositories/${repository}`))
        .json();
      if (!repo) {
        throw new Error(`Repository '${project}/${repository}' not found`);
      }

      return normalizeBranchName(repo.defaultBranch);
    } catch (e) {
      logger.error(`Failed to get default branch for '${project}/${repository}': ${e}`);
      logger.debug(e); // Dump the error stack trace to help with debugging
      return undefined;
    }
  }

  /**
   * Get the list of branch names for a repository.
   * Requires scope "Code (Read)" (vso.code).
   * @param project
   * @param repository
   * @returns
   */
  public async getBranchNames(project: string, repository: string): Promise<string[] | undefined> {
    try {
      const refs = await this.client
        .get<AzdoListResponse<AzdoGitRef[]>>(
          this.makeUrl(`${this.organisationApiUrl}/${project}/_apis/git/repositories/${repository}/refs`),
        )
        .json();
      if (!refs) {
        throw new Error(`Repository '${project}/${repository}' not found`);
      }

      return refs.value?.map((r) => normalizeBranchName(r.name)) || [];
    } catch (e) {
      logger.error(`Failed to list branch names for '${project}/${repository}': ${e}`);
      logger.debug(e); // Dump the error stack trace to help with debugging
      return undefined;
    }
  }

  /**
   * Get the properties for all active pull request created by the supplied user.
   * Requires scope "Code (Read)" (vso.code).
   * @param project
   * @param repository
   * @param creator
   * @returns
   */
  public async getActivePullRequestProperties(
    project: string,
    repository: string,
    creator: string,
  ): Promise<IPullRequestProperties[]> {
    try {
      const pullRequests = await this.client
        .get<AzdoListResponse<AzdoPullRequest[]>>(
          this.makeUrl(`${this.organisationApiUrl}/${project}/_apis/git/repositories/${repository}/pullrequests`, {
            'searchCriteria.creatorId': isGuid(creator) ? creator : await this.getUserId(),
            'searchCriteria.status': 'Active',
          }),
        )
        .json();
      if (!pullRequests?.value || pullRequests.value.length === 0) {
        return [];
      }

      return await Promise.all(
        pullRequests.value.map(async (pr) => {
          const properties = await this.client
            .get<AzdoListResponse<AdoProperties>>(
              this.makeUrl(
                `${this.organisationApiUrl}/${project}/_apis/git/repositories/${repository}/pullrequests/${pr.pullRequestId}/properties`,
              ),
            )
            .json();
          return {
            id: pr.pullRequestId,
            properties: Object.entries(properties?.value || {}).map(([key, val]) => ({
              name: key,
              value: val?.$value,
            })),
          };
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
   * @param pr
   * @returns
   */
  public async createPullRequest(pr: ICreatePullRequest): Promise<number | null> {
    logger.info(`Creating pull request '${pr.title}'...`);
    try {
      const userId = await this.getUserId();

      // Map the list of the pull request reviewer ids
      // NOTE: Azure DevOps does not have a concept of assignees.
      //       We treat them as optional reviewers. Branch policies should be used for required reviewers.
      const reviewers: AzdoIdentityRefWithVote[] = [];
      if (pr.assignees && pr.assignees.length > 0) {
        for (const assignee of pr.assignees) {
          const identityId = isGuid(assignee) ? assignee : await this.resolveIdentityId(assignee);
          if (identityId && !reviewers.some((r) => r.id === identityId)) {
            reviewers.push({
              id: identityId,
            });
          } else {
            logger.warn(`Unable to resolve assignee identity '${assignee}'`);
          }
        }
      }

      // Create the source branch and push a commit with the dependency file changes
      logger.info(` - Pushing ${pr.changes.length} file change(s) to branch '${pr.source.branch}'...`);
      const push = await this.client
        .post<AzdoGitPush>(
          this.makeUrl(`${this.organisationApiUrl}/${pr.project}/_apis/git/repositories/${pr.repository}/pushes`),
          {
            json: {
              refUpdates: [
                {
                  name: `refs/heads/${pr.source.branch}`,
                  oldObjectId: pr.source.commit,
                },
              ],
              commits: [
                {
                  comment: pr.commitMessage,
                  author: pr.author,
                  changes: pr.changes
                    .filter((change) => change.changeType !== 'none')
                    .map(({ changeType, ...change }) => {
                      return {
                        changeType,
                        item: { path: normalizeFilePath(change.path) },
                        newContent:
                          changeType !== 'delete'
                            ? {
                                content: Buffer.from(change.content!, <BufferEncoding>change.encoding).toString(
                                  'base64',
                                ),
                                contentType: 'base64encoded',
                              }
                            : undefined,
                      } satisfies AzdoGitPushCreate['commits'][0]['changes'][0];
                    }),
                },
              ],
            } satisfies AzdoGitPushCreate,
          },
        )
        .json();
      if (!push?.commits?.length) {
        throw new Error('Failed to push changes to source branch, no commits were created');
      }
      logger.info(` - Pushed commit: ${push.commits.map((c) => c.commitId).join(', ')}.`);

      // Create the pull request
      logger.info(` - Creating pull request to merge '${pr.source.branch}' into '${pr.target.branch}'...`);
      const pullRequest = await this.client
        .post<AzdoPullRequest>(
          this.makeUrl(`${this.organisationApiUrl}/${pr.project}/_apis/git/repositories/${pr.repository}/pullrequests`),
          {
            json: {
              sourceRefName: `refs/heads/${pr.source.branch}`,
              targetRefName: `refs/heads/${pr.target.branch}`,
              title: pr.title,
              description: pr.description,
              reviewers: reviewers,
              workItemRefs: pr.workItems?.map((id) => ({ id: id })),
              labels: pr.labels?.map((label) => ({ name: label })),
            },
          },
        )
        .json();
      if (!pullRequest?.pullRequestId) {
        throw new Error('Failed to create pull request, no pull request id was returned');
      }
      logger.info(` - Created pull request: #${pullRequest.pullRequestId}.`);

      // Add the pull request properties
      if (pr.properties && pr.properties.length > 0) {
        logger.info(` - Adding dependency metadata to pull request properties...`);
        const newProperties = await this.client
          .patch<AzdoListResponse<AdoProperties>>(
            this.makeUrl(
              `${this.organisationApiUrl}/${pr.project}/_apis/git/repositories/${pr.repository}/pullrequests/${pullRequest.pullRequestId}/properties`,
            ),
            {
              json: pr.properties.map((property) => {
                return {
                  op: 'add',
                  path: `/${property.name}`,
                  value: property.value,
                };
              }),
              headers: { 'Content-Type': 'application/json-patch+json' },
            },
          )
          .json();
        if (!newProperties?.count) {
          throw new Error('Failed to add dependency metadata properties to pull request');
        }
      }

      // TODO: Upload the pull request description as a 'changes.md' file attachment?
      //       This might be a way to work around the 4000 character limit for PR descriptions, but needs more investigation.
      //       https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-request-attachments/create?view=azure-devops-rest-7.1

      // Set the pull request auto-complete status
      if (pr.autoComplete) {
        logger.info(` - Updating auto-complete options...`);
        const updatedPullRequest = await this.client
          .patch<AzdoPullRequest>(
            this.makeUrl(
              `${this.organisationApiUrl}/${pr.project}/_apis/git/repositories/${pr.repository}/pullrequests/${pullRequest.pullRequestId}`,
            ),
            {
              json: {
                autoCompleteSetBy: { id: userId },
                completionOptions: {
                  autoCompleteIgnoreConfigIds: pr.autoComplete.ignorePolicyConfigIds,
                  deleteSourceBranch: true,
                  mergeCommitMessage: mergeCommitMessage(pullRequest.pullRequestId, pr.title, pr.description),
                  mergeStrategy: pr.autoComplete.mergeStrategy,
                  transitionWorkItems: false,
                },
              },
            },
          )
          .json();
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
   * @param pr
   * @returns
   */
  public async updatePullRequest(pr: IUpdatePullRequest): Promise<boolean> {
    logger.info(`Updating pull request #${pr.pullRequestId}...`);
    try {
      // Get the pull request details
      const pullRequest = await this.client
        .get<AzdoPullRequest>(
          this.makeUrl(
            `${this.organisationApiUrl}/${pr.project}/_apis/git/repositories/${pr.repository}/pullrequests/${pr.pullRequestId}`,
          ),
        )
        .json();
      if (!pullRequest) {
        throw new Error(`Pull request #${pr.pullRequestId} not found`);
      }

      // Skip if the pull request is a draft
      if (pr.skipIfDraft && pullRequest.isDraft) {
        logger.info(` - Skipping update as pull request is currently marked as a draft.`);
        return true;
      }

      // Skip if the pull request has been modified by another author
      if (pr.skipIfCommitsFromAuthorsOtherThan) {
        const commits = await this.client
          .get<AzdoListResponse<AzdoGitCommitRef[]>>(
            this.makeUrl(
              `${this.organisationApiUrl}/${pr.project}/_apis/git/repositories/${pr.repository}/pullrequests/${pr.pullRequestId}/commits`,
            ),
          )
          .json();
        if (commits?.value?.some((c) => c.author?.email !== pr.skipIfCommitsFromAuthorsOtherThan)) {
          logger.info(` - Skipping update as pull request has been modified by another user.`);
          return true;
        }
      }

      // Get the branch stats to check if the source branch is behind the target branch
      const stats = await this.client
        .get<AzdoGitBranchStats>(
          this.makeUrl(
            `${this.organisationApiUrl}/${pr.project}/_apis/git/repositories/${pr.repository}/stats/branches`,
            {
              name: normalizeBranchName(pullRequest.sourceRefName),
            },
          ),
        )
        .json();
      if (stats?.behindCount === undefined) {
        throw new Error(`Failed to get branch stats for '${pullRequest.sourceRefName}'`);
      }

      // Skip if the source branch is not behind the target branch
      if (pr.skipIfNotBehindTargetBranch && stats.behindCount === 0) {
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
        const rebase = await this.client
          .post<AzdoListResponse<AzdoGitRefUpdateResult[]>>(
            this.makeUrl(`${this.organisationApiUrl}/${pr.project}/_apis/git/repositories/${pr.repository}/refs`),
            {
              json: [
                {
                  name: pullRequest.sourceRefName,
                  oldObjectId: pullRequest.lastMergeSourceCommit.commitId,
                  newObjectId: pr.commit,
                },
              ],
            },
          )
          .json();
        if (rebase?.value?.[0]?.success !== true) {
          throw new Error('Failed to rebase the target branch into the source branch');
        }
      }

      // Push all file changes to the source branch
      logger.info(` - Pushing ${pr.changes.length} file change(s) to branch '${pullRequest.sourceRefName}'...`);
      const push = await this.client
        .post<AzdoGitPush>(
          this.makeUrl(`${this.organisationApiUrl}/${pr.project}/_apis/git/repositories/${pr.repository}/pushes`),
          {
            json: {
              refUpdates: [
                {
                  name: pullRequest.sourceRefName,
                  oldObjectId: pr.commit,
                },
              ],
              commits: [
                {
                  comment:
                    pullRequest.mergeStatus === 'conflicts'
                      ? 'Resolve merge conflicts'
                      : `Rebase '${sourceBranchName}' onto '${targetBranchName}'`,
                  author: pr.author,
                  changes: pr.changes
                    .filter((change) => change.changeType !== 'none')
                    .map(({ changeType, ...change }) => {
                      return {
                        changeType,
                        item: { path: normalizeFilePath(change.path) },
                        newContent:
                          changeType !== 'delete'
                            ? {
                                content: Buffer.from(change.content!, <BufferEncoding>change.encoding).toString(
                                  'base64',
                                ),
                                contentType: 'base64encoded',
                              }
                            : undefined,
                      } satisfies AzdoGitPushCreate['commits'][0]['changes'][0];
                    }),
                },
              ],
            } satisfies AzdoGitPushCreate,
          },
        )
        .json();
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
   * @param pr
   * @returns
   */
  public async approvePullRequest(pr: IApprovePullRequest): Promise<boolean> {
    logger.info(`Approving pull request #${pr.pullRequestId}...`);
    try {
      // Approve the pull request
      logger.info(` - Updating reviewer vote on pull request...`);
      const userId = await this.getUserId();
      const userVote = await this.client
        .put<AzdoIdentityRefWithVote>(
          this.makeUrl(
            `${this.organisationApiUrl}/${pr.project}/_apis/git/repositories/${pr.repository}/pullrequests/${pr.pullRequestId}/reviewers/${userId}`,
            // API version 7.1 is required to use the 'isReapprove' parameter
            // See: https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-request-reviewers/create-pull-request-reviewer?view=azure-devops-rest-7.1&tabs=HTTP#request-body
            //      https://learn.microsoft.com/en-us/azure/devops/integrate/concepts/rest-api-versioning?view=azure-devops#supported-versions
            '7.1',
          ),
          {
            json: {
              // Vote 10 = "approved"; 5 = "approved with suggestions"; 0 = "no vote"; -5 = "waiting for author"; -10 = "rejected"
              vote: 10,
              // Reapprove must be set to true after the 2023 August 23 update;
              // Approval of a previous PR iteration does not count in later iterations, which means we must (re)approve every after push to the source branch
              // See: https://learn.microsoft.com/en-us/azure/devops/release-notes/2023/sprint-226-update#new-branch-policy-preventing-users-to-approve-their-own-changes
              //      https://github.com/mburumaxwell/dependabot-azure-devops/issues/1069
              isReapprove: true,
            },
          },
        )
        .json();
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
   * @param pr
   * @returns
   */
  public async abandonPullRequest(pr: IAbandonPullRequest): Promise<boolean> {
    logger.info(`Abandoning pull request #${pr.pullRequestId}...`);
    try {
      const userId = await this.getUserId();

      // Add a comment to the pull request, if supplied
      if (pr.comment) {
        logger.info(` - Adding abandonment reason comment to pull request...`);
        const threadId = await this.addCommentThread({
          ...pr,
          content: pr.comment,
          userId,
        });
        if (!threadId) {
          throw new Error('Failed to add comment to pull request, thread was not created');
        }
      }

      // Abandon the pull request
      logger.info(` - Abandoning pull request...`);
      const abandonedPullRequest = await this.client
        .patch<AzdoPullRequest>(
          this.makeUrl(
            `${this.organisationApiUrl}/${pr.project}/_apis/git/repositories/${pr.repository}/pullrequests/${pr.pullRequestId}`,
          ),
          {
            json: {
              status: 'abandoned',
              closedBy: { id: userId },
            } satisfies Pick<AzdoPullRequest, 'status' | 'closedBy'>,
          },
        )
        .json();
      if (abandonedPullRequest?.status !== 'abandoned') {
        throw new Error('Failed to abandon pull request, status was not updated');
      }

      // Delete the source branch if required
      if (pr.deleteSourceBranch) {
        logger.info(` - Deleting source branch...`);
        const deletedBranch = await this.client
          .post<AzdoListResponse<AzdoGitRefUpdateResult[]>>(
            this.makeUrl(`${this.organisationApiUrl}/${pr.project}/_apis/git/repositories/${pr.repository}/refs`),
            {
              json: [
                {
                  name: abandonedPullRequest.sourceRefName,
                  oldObjectId: abandonedPullRequest.lastMergeSourceCommit.commitId,
                  newObjectId: '0000000000000000000000000000000000000000',
                  isLocked: false,
                },
              ],
            },
          )
          .json();
        if (deletedBranch?.value?.[0]?.success !== true) {
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
  public async addCommentThread(comment: IPullRequestComment): Promise<number | undefined> {
    const userId = comment.userId ?? (await this.getUserId());
    type CreationType = {
      status: AzdoPullRequestCommentThread['status'];
      comments: Partial<AzdoPullRequestCommentThread['comments'][number]>[];
    };
    const thread = await this.client
      .post<AzdoPullRequestCommentThread>(
        this.makeUrl(
          `${this.organisationApiUrl}/${comment.project}/_apis/git/repositories/${comment.repository}/pullrequests/${comment.pullRequestId}/threads`,
        ),
        {
          json: {
            status: 'closed',
            comments: [
              {
                author: { id: userId },
                content: comment.content,
                commentType: 'system',
              },
            ],
          } satisfies CreationType,
        },
      )
      .json();
    return thread?.id;
  }

  private makeUrl(url: string): string;
  private makeUrl(url: string, apiVersion: string): string;
  private makeUrl(url: string, params: Record<string, unknown>): string;
  private makeUrl(url: string, params: Record<string, unknown>, apiVersion: string): string;
  private makeUrl(
    url: string,
    params?: Record<string, unknown> | string,
    apiVersion: string = AzureDevOpsWebApiClient.API_VERSION,
  ): string {
    if (typeof params === 'string') {
      apiVersion = params;
      params = {};
    }

    const queryString = Object.entries({ 'api-version': apiVersion, ...params })
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    return `${url}?${queryString}`;
  }

  private createClient() {
    return ky.create({
      headers: {
        Authorization: `Basic ${Buffer.from(`:${this.accessToken}`).toString('base64')}`,
        Accept: 'application/json',
      },
      hooks: {
        beforeRequest: [
          async (request, options) => {
            if (this.debug) logger.debug(`🌎 🠊 [${request.method}] ${request.url}`);
          },
        ],
        afterResponse: [
          async (request, options, response) => {
            if (this.debug) {
              logger.debug(`🌎 🠈 [${response.status}] ${response.statusText}`);

              // log the request and response for debugging
              if (request.body) {
                logger.debug(`REQUEST: ${JSON.stringify(request.body)}`);
              }
              // const body = await response.text();
              // if (body) {
              //   logger.debug(`RESPONSE: ${body}`);
              // }
            }
          },
        ],
        beforeRetry: [
          async ({ request, options, error, retryCount }) => {
            if (this.debug && isHTTPError(error)) {
              logger.debug(`⏳ Retrying failed request with status code: ${error.response.status}`);
            }
          },
        ],
      },
      retry: {
        limit: 3,
        delay: (attempt) => 3000, // all attempts after 3 seconds
      },
    });
  }
}

function mergeCommitMessage(id: number, title: string, description: string): string {
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

function isGuid(guid: string): boolean {
  const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return regex.test(guid);
}
