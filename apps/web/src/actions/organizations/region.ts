'use server';

import { deleteKeyVaultSecret, getKeyVaultSecret, setKeyVaultSecret } from '@/lib/azure';
import { prisma } from '@/lib/prisma';
import { getRegionInfo, type RegionCode } from '@/lib/regions';

/**
 * Update an organization's region.
 * @param options The options for updating the organization's region.
 */
export async function updateOrganizationRegion(options: {
  organizationId: string;
  region: RegionCode;
}): Promise<{ success: boolean; error?: { message: string } }> {
  const { organizationId } = options;

  // validate region
  const targetRegion = getRegionInfo(options.region);
  if (!targetRegion || !targetRegion.available) {
    return { success: false, error: { message: 'Selected region is not available' } };
  }

  const region = targetRegion.code;

  // update all secrets in the organization to the new region
  // create secret in new region, update db, delete secret in old region
  const secrets = await prisma.organizationSecret.findMany({
    where: { organizationId, secretUrl: { not: null } },
  });
  for (const secret of secrets) {
    // get existing secret value
    const value = (await getKeyVaultSecret({ region: secret.region, url: secret.secretUrl! })) ?? 'unknown';

    // create secret in new region
    const url = await setKeyVaultSecret({ region, name: secret.name, value });

    // update secret record to point to new secret
    await prisma.organizationSecret.updateMany({
      where: { id: secret.id, organizationId },
      data: { region, secretUrl: url },
    });

    // delete secret in old region
    await deleteKeyVaultSecret({ region: secret.region, url: secret.secretUrl! });
  }

  // update organization region
  await prisma.organization.updateMany({
    where: { id: organizationId },
    data: { region },
  });

  return { success: true };
}
