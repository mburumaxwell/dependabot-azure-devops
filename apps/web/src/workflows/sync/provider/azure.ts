import {
  type AzdoRepository,
  type AzdoRepositoryItem,
  AzureDevOpsWebApiClient,
  extractOrganizationUrl,
} from '@paklo/core/azure';
import { POSSIBLE_CONFIG_FILE_PATHS } from '@paklo/core/dependabot';
import {
  type ISyncProvider,
  SynchronizerConfigurationItem,
  type SynchronizerProject,
  type SynchronizerRepository,
} from './base';

export class AzureSyncProvider implements ISyncProvider {
  private readonly organizationSlug: string;
  private readonly client: AzureDevOpsWebApiClient;

  constructor(organisationUrl: string, token: string) {
    const url = extractOrganizationUrl({ organisationUrl });
    this.organizationSlug = url.organisation;
    this.client = new AzureDevOpsWebApiClient(url, token);
  }

  getProject(id: string): Promise<SynchronizerProject | undefined> {
    return this.client.getProject(id);
  }

  async getRepositories(projectId: string): Promise<SynchronizerRepository[] | undefined> {
    return (await this.client.getRepositories(projectId))?.value?.map((repo) => this.convertRepo(repo));
  }

  async getRepository(projectId: string, repositoryId: string): Promise<SynchronizerRepository | undefined> {
    const repo = await this.client.getRepository(projectId, repositoryId);
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
    for (const filePath of POSSIBLE_CONFIG_FILE_PATHS) {
      path = filePath;
      item = await this.client.getRepositoryItem(project.id, repo.id, path);
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
    return `${this.organizationSlug}/${project.name}/_git/${repo.name}`;
  }
}
