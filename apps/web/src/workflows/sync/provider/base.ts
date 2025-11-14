import type { AzdoRepositoryItem } from '@paklo/core/azure';
import type { Project } from '@/lib/prisma';

export type SynchronizerProject = {
  id: string;
  name: string;
  description?: string;
};

export type SynchronizerRepository = {
  id: string;
  name: string;
  url: string;
  permalink: string;
  disabled: boolean;
  fork: boolean;
};

export class SynchronizerConfigurationItem {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly url: string,
    readonly permalink: string,
    readonly slug: string,
    readonly path: string | undefined,
    readonly commitId: string | null,
    readonly content: string | null,
  ) {}

  static fromRepo(slug: string, repo: SynchronizerRepository, path?: string, item?: AzdoRepositoryItem | null) {
    return new SynchronizerConfigurationItem(
      repo.id,
      repo.name,
      repo.url,
      repo.permalink,
      slug,
      path,
      item?.latestProcessedChange?.commitId ?? null,
      item?.content ?? null,
    );
  }

  get hasConfiguration() {
    return !!this.commitId && !!this.content;
  }
}

export interface ISyncProvider {
  getProject(id: string): Promise<SynchronizerProject | undefined>;
  getRepositories(projectId: string): Promise<SynchronizerRepository[] | undefined>;
  getRepository(projectId: string, repositoryId: string): Promise<SynchronizerRepository | undefined>;
  getConfigurationFile(
    project: SynchronizerProject,
    repo: SynchronizerRepository,
  ): Promise<SynchronizerConfigurationItem>;
}

export function toSynchronizerProject(project: Project): SynchronizerProject {
  return {
    id: project.providerId,
    name: project.name,
  };
}
