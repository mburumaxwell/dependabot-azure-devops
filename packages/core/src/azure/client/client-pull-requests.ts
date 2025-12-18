import { BaseAzureDevOpsClient } from './client-base';
import type {
  AzdoGitCommitRef,
  AzdoIdentityRefWithVote,
  AzdoProperties,
  AzdoPullRequest,
  AzdoPullRequestCommentThread,
  AzdoPullRequestStatus,
  AzdoResponse,
} from './types';

export class PullRequestsClient extends BaseAzureDevOpsClient {
  /**
   * List pull requests
   * Requires scope "Code (Read)" (vso.code).
   * @param projectIdOrName
   * @param repositoryIdOrName
   * @param creatorId ID of the user who created the pull requests
   * @param status The status of the pull requests to filter by
   */
  public async list(
    projectIdOrName: string,
    repositoryIdOrName: string,
    creatorId: string,
    status: AzdoPullRequestStatus,
  ): Promise<AzdoPullRequest[] | undefined> {
    const response = await this.client
      .get<AzdoResponse<AzdoPullRequest[]>>(
        this.makeUrl(
          `${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}/pullrequests`,
          {
            'searchCriteria.creatorId': creatorId,
            'searchCriteria.status': status,
          },
        ),
      )
      .json();
    return response?.value;
  }

  public async get(
    projectIdOrName: string,
    repositoryIdOrName: string,
    pullRequestId: number,
  ): Promise<AzdoPullRequest | undefined> {
    return await this.client
      .get<AzdoPullRequest>(
        this.makeUrl(
          `${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}/pullrequests/${pullRequestId}`,
        ),
      )
      .json();
  }

  public async create(
    projectIdOrName: string,
    repositoryIdOrName: string,
    pr: Partial<AzdoPullRequest>,
  ): Promise<AzdoPullRequest> {
    return await this.client
      .post<AzdoPullRequest>(
        this.makeUrl(
          `${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}/pullrequests`,
        ),
        { json: pr },
      )
      .json();
  }

  public async update(
    projectIdOrName: string,
    repositoryIdOrName: string,
    pullRequestId: number,
    pr: Partial<AzdoPullRequest>,
  ): Promise<AzdoPullRequest> {
    return await this.client
      .patch<AzdoPullRequest>(
        this.makeUrl(
          `${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}/pullrequests/${pullRequestId}`,
        ),
        { json: pr },
      )
      .json();
  }

  public async getProperties(
    projectIdOrName: string,
    repositoryIdOrName: string,
    pullRequestId: number,
  ): Promise<{ name: string; value: string }[]> {
    const response = await this.client
      .get<AzdoResponse<AzdoProperties>>(
        this.makeUrl(
          `${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}/pullrequests/${pullRequestId}/properties`,
        ),
      )
      .json();

    return Object.entries(response?.value || {})
      .filter(([, val]) => val?.$value)
      .map(([key, val]) => ({
        name: key,
        value: val.$value,
      }));
  }

  public async setProperties(
    projectIdOrName: string,
    repositoryIdOrName: string,
    pullRequestId: number,
    properties: { name: string; value: string }[],
  ): Promise<AzdoResponse<AzdoProperties>> {
    return await this.client
      .patch<AzdoResponse<AzdoProperties>>(
        this.makeUrl(
          `${projectIdOrName}/_apis/git/repositories/${repositoryIdOrName}/pullrequests/${pullRequestId}/properties`,
        ),
        {
          headers: { 'Content-Type': 'application/json-patch+json' },
          json: properties.map((property) => {
            return {
              op: 'add',
              path: `/${property.name}`,
              value: property.value,
            };
          }),
        },
      )
      .json();
  }

  /**
   * Approve a pull request.
   * Requires scope "Code (Write)" (vso.code_write).
   */
  public async approve(
    projectIdOrName: string,
    repositoryIdOrName: string,
    pullRequestId: number,
    userId: string,
  ): Promise<AzdoIdentityRefWithVote> {
    return await this.client
      .put<AzdoIdentityRefWithVote>(
        this.makeUrl(
          `${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}/pullrequests/${pullRequestId}/reviewers/${userId}`,
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
  }

  /**
   * Abandon a pull request.
   * Requires scope "Code (Write)" (vso.code_write).
   */
  public async abandon(
    projectIdOrName: string,
    repositoryIdOrName: string,
    pullRequestId: number,
    userId: string,
  ): Promise<AzdoPullRequest> {
    return await this.client
      .patch<AzdoPullRequest>(
        this.makeUrl(
          `${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}/pullrequests/${pullRequestId}`,
        ),
        {
          json: {
            status: 'abandoned',
            closedBy: { id: userId },
          } satisfies Pick<AzdoPullRequest, 'status' | 'closedBy'>,
        },
      )
      .json();
  }

  /**
   * Get commits of a pull request.
   * Requires scope "Code (Read)" (vso.code_read).
   */
  public async getCommits(
    projectIdOrName: string,
    repositoryIdOrName: string,
    pullRequestId: number,
  ): Promise<AzdoGitCommitRef[] | undefined> {
    const response = await this.client
      .get<AzdoResponse<AzdoGitCommitRef[]>>(
        this.makeUrl(
          `${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}/pullrequests/${pullRequestId}/commits`,
        ),
      )
      .json();
    return response?.value;
  }

  /**
   * Create a comment thread on a pull request.
   * Requires scope "Code (Write)" (vso.code_write).
   */
  public async createCommentThread(
    projectIdOrName: string,
    repositoryIdOrName: string,
    pullRequestId: number,
    thread: Partial<AzdoPullRequestCommentThread>,
  ): Promise<AzdoPullRequestCommentThread> {
    return await this.client
      .post<AzdoPullRequestCommentThread>(
        this.makeUrl(
          `${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}/pullrequests/${pullRequestId}/threads`,
        ),
        { json: thread },
      )
      .json();
  }
}
