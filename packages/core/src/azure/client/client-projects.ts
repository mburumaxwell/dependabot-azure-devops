import { BaseAzureDevOpsClient } from './client-base';
import type { AzdoProject, AzdoResponse } from './types';

export class ProjectsClient extends BaseAzureDevOpsClient {
  public async list(): Promise<AzdoProject[] | undefined> {
    const response = await this.client.get<AzdoResponse<AzdoProject[]>>(this.makeUrl('_apis/projects')).json();
    return response?.value;
  }

  public async get(idOrName: string): Promise<AzdoProject | undefined> {
    return await this.client.get<AzdoProject>(this.makeUrl(`_apis/projects/${encodeURIComponent(idOrName)}`)).json();
  }
}
