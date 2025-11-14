import type { OrganizationType } from '@/lib/organization-types';
import type { Organization, OrganizationCredential } from '@/lib/prisma';
import { AzureSyncProvider } from './azure';
import type { ISyncProvider } from './base';

export * from './azure';
export * from './base';

export function createSyncProvider(organization: Organization, credential: OrganizationCredential): ISyncProvider {
  switch (organization.type as OrganizationType) {
    case 'azure':
      return new AzureSyncProvider(organization.url, credential.token);
    default:
      throw new Error(`Unsupported organization type: ${organization.type}`);
  }
}
