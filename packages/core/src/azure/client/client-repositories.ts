import { isHTTPError } from 'ky';
import { BaseAzureDevOpsClient } from './client-base';
import type { AzdoGitBranchStats, AzdoGitRef, AzdoRepository, AzdoResponse } from './types';

export class RepositoriesClient extends BaseAzureDevOpsClient {
  public async list(projectIdOrName: string): Promise<AzdoRepository[] | undefined> {
    const repos = await this.client
      .get<AzdoResponse<AzdoRepository[]>>(
        this.makeUrl(`${encodeURIComponent(projectIdOrName)}/_apis/git/repositories`),
      )
      .json();
    return repos?.value;
  }

  public async get(projectIdOrName: string, repositoryIdOrName: string): Promise<AzdoRepository | undefined> {
    try {
      const repo = await this.client
        .get<AzdoRepository>(
          this.makeUrl(
            `${encodeURIComponent(projectIdOrName)}/_apis/git/repositories/${encodeURIComponent(repositoryIdOrName)}`,
          ),
        )
        .json();
      return repo;
    } catch (e) {
      if (isHTTPError(e) && e.response.status === 404) {
        // repository no longer exists
        return undefined;
      }
      throw e;
    }
  }

  /**
   * Get the list of refs (a.k.a branch names) for a repository.
   * Requires scope "Code (Read)" (vso.code).
   * @param projectIdOrName
   * @param repositoryIdOrName
   * @returns
   */
  public async getRefs(projectIdOrName: string, repositoryIdOrName: string): Promise<AzdoGitRef[] | undefined> {
    const refs = await this.client
      .get<AzdoResponse<AzdoGitRef[]>>(
        this.makeUrl(`${projectIdOrName}/_apis/git/repositories/${repositoryIdOrName}/refs`),
      )
      .json();

    return refs?.value;
  }

  public async getBranchStats(
    projectIdOrName: string,
    repositoryIdOrName: string,
    branchName: string,
  ): Promise<AzdoGitBranchStats | undefined> {
    return await this.client
      .get<AzdoGitBranchStats>(
        this.makeUrl(`${projectIdOrName}/_apis/git/repositories/${repositoryIdOrName}/stats/branches`, {
          name: branchName,
        }),
      )
      .json();
  }
}
