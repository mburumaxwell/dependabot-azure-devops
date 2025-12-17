import type { AzdoRepository, AzdoRepositoryItem, AzureDevOpsClient } from '@paklo/core/azure';
import { CONFIG_FILE_PATHS_AZURE } from '@paklo/core/dependabot';
import {
  type ISyncProvider,
  SynchronizerConfigurationItem,
  type SynchronizerProject,
  type SynchronizerRepository,
} from './base';

export class AzureSyncProvider implements ISyncProvider {
  constructor(private readonly client: AzureDevOpsClient) {}

  getProject(id: string): Promise<SynchronizerProject | undefined> {
    return this.client.projects.get(id);
  }

  async getRepositories(projectId: string): Promise<SynchronizerRepository[] | undefined> {
    return (await this.client.repositories.list(projectId))?.map((repo) => this.convertRepo(repo));
  }

  async getRepository(projectId: string, repositoryId: string): Promise<SynchronizerRepository | undefined> {
    const repo = await this.client.repositories.get(projectId, repositoryId);
    if (!repo) return undefined;
    return this.convertRepo(repo);
  }

  async getConfigurationFile(
    project: SynchronizerProject,
    repo: SynchronizerRepository,
  ): Promise<SynchronizerConfigurationItem> {
    // try all known paths
    let item: AzdoRepositoryItem | undefined;
    let path: string | undefined;
    for (const filePath of CONFIG_FILE_PATHS_AZURE) {
      path = filePath;
      item = await this.client.git.getItem(project.id, repo.id, path);
      if (item) break;
    }

    const slug = this.makeSlug(project, repo);
    return SynchronizerConfigurationItem.fromRepo(slug, repo, path, item);
  }

  private convertRepo(repo: AzdoRepository): SynchronizerRepository {
    return {
      id: repo.id,
      name: repo.name,
      url: repo.webUrl || repo.remoteUrl || repo.url,
      permalink: repo.url,
      disabled: repo.isDisabled || false,
      fork: repo.isFork || false,
    };
  }

  private makeSlug(project: SynchronizerProject, repo: SynchronizerRepository) {
    return `${this.client.organizationSlug}/${project.name}/_git/${repo.name}`;
  }
}
