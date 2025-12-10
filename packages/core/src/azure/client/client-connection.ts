import { BaseAzureDevOpsClient } from './client-base';
import { API_VERSION_PREVIEW } from './constants';
import type { AzdoConnectionData } from './types';

export class ConnectionClient extends BaseAzureDevOpsClient {
  /**
   * Get the connection data for the current user.
   */
  public async get(): Promise<AzdoConnectionData> {
    return await this.client.get<AzdoConnectionData>(this.makeUrl('_apis/connectiondata', API_VERSION_PREVIEW)).json();
  }
}
