import { createAzdoClient } from '@/actions/organizations';
import type { Organization, OrganizationCredential } from '@/lib/prisma';
import { AzureSyncProvider } from './azure';
import type { ISyncProvider } from './base';

export * from './azure';
export * from './base';

export async function createSyncProvider(
  organization: Organization,
  credential: OrganizationCredential,
): Promise<ISyncProvider> {
  switch (organization.type) {
    case 'azure': {
      const client = await createAzdoClient({ organization, credential });
      return new AzureSyncProvider(client);
    }
    default:
      throw new Error(`Unsupported organization type: ${organization.type}`);
  }
}
