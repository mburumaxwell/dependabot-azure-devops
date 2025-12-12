'use server';

import { prisma } from '@/lib/prisma';
import { REGIONS, type RegionCode } from '@/lib/regions';

/**
 * Update an organization's region.
 * @param options The options for updating the organization's region.
 */
export async function updateOrganizationRegion(options: {
  organizationId: string;
  region: RegionCode;
}): Promise<{ success: boolean; error?: { message: string } }> {
  const targetRegion = REGIONS.find((r) => r.code === options.region);
  if (!targetRegion || !targetRegion.available) {
    return { success: false, error: { message: 'Selected region is not available' } };
  }

  await prisma.organization.updateMany({
    where: { id: options.organizationId },
    data: { region: options.region },
  });

  return { success: true };
}
