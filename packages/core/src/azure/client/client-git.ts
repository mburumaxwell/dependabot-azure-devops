import { isHTTPError } from 'ky';
import { BaseAzureDevOpsClient } from './client-base';
import type {
  AzdoGitCommitDiffs,
  AzdoGitPush,
  AzdoGitPushCreate,
  AzdoGitRefUpdate,
  AzdoGitRefUpdateResult,
  AzdoRepositoryItem,
  AzdoResponse,
} from './types';

export class GitClient extends BaseAzureDevOpsClient {
  public async getItem(
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
            `${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}/items`,
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
      }
      throw e;
    }
  }

  public async getPush(
    projectIdOrName: string,
    repositoryIdOrName: string,
    pushId: number,
    includeCommits?: number,
    includeRefUpdates?: boolean,
  ): Promise<AzdoGitPush> {
    return await this.client
      .get<AzdoGitPush>(
        this.makeUrl(
          `${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}/pushes/${pushId}`,
          {
            includeCommits,
            includeRefUpdates,
          },
        ),
      )
      .json();
  }

  public async createPush(
    projectIdOrName: string,
    repositoryIdOrName: string,
    push: AzdoGitPushCreate,
  ): Promise<AzdoGitPush> {
    return await this.client
      .post<AzdoGitPush>(
        this.makeUrl(
          `${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}/pushes`,
        ),
        { json: push },
      )
      .json();
  }

  public async getDiffCommits(
    projectIdOrName: string,
    repositoryIdOrName: string,
    baseVersion: string,
    targetVersion: string,
  ): Promise<AzdoGitCommitDiffs> {
    return await this.client
      .get<AzdoGitCommitDiffs>(
        this.makeUrl(
          `${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}/diffs/commits`,
          {
            baseVersion,
            baseVersionType: 'commit',
            targetVersion,
            targetVersionType: 'commit',
          },
        ),
      )
      .json();
  }

  public async updateRef(
    projectIdOrName: string,
    repositoryIdOrName: string,
    ref: AzdoGitRefUpdate[],
  ): Promise<AzdoGitRefUpdateResult[] | undefined> {
    const response = await this.client
      .post<AzdoResponse<AzdoGitRefUpdateResult[]>>(
        this.makeUrl(
          `${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}/refs`,
        ),
        { json: ref },
      )
      .json();
    return response.value;
  }
}
