import { BaseAzureDevOpsClient } from './client-base';
import type { AzdoIdentity, AzdoResponse } from './types';

export class IdentityClient extends BaseAzureDevOpsClient {
  /**
   * Get the identities that match the given user name, email, or group name.
   * Requires scope "Identity (Read)" (vso.identity).
   * @param filterValue username, email, or group name
   * @returns
   */
  public async get(filterValue: string): Promise<AzdoIdentity[] | undefined> {
    const response = await this.client
      .get<AzdoResponse<AzdoIdentity[]>>(
        this.makeUrl('_apis/identities', {
          searchFilter: 'General',
          filterValue,
          queryMembership: 'None',
        }),
      )
      .json();
    return response?.value;
  }
}
