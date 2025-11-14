'use server';

import { type OrganizationTier, prisma } from '@/lib/prisma';

export async function updateTier({
  organizationId,
  tier,
}: {
  organizationId: string;
  tier: OrganizationTier;
}): Promise<{ success: boolean; error?: { message: string } }> {
  try {
    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    // if tier is the same, do nothing
    if (organization.tier === tier) return { success: true };

    // TODO: update/create/cancel stripe subscription to reflect new tier
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // update database
    // await prisma.organization.update({
    //   where: { id: organizationId },
    //   data: { tier },
    // });

    return { success: true };
  } catch (error) {
    return { success: false, error: { message: (error as Error).message } };
  }
}

export async function updateMaxProjects({
  organizationId,
  maxProjects,
}: {
  organizationId: string;
  maxProjects: number;
}): Promise<{ success: boolean; error?: { message: string } }> {
  try {
    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    // if maxProjects is the same, do nothing
    if (organization.maxProjects === maxProjects) return { success: true };

    // TODO: update stripe subscription to reflect new maxProjects limit
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // update database
    // await prisma.organization.update({
    //   where: { id: organizationId },
    //   data: { maxProjects },
    // });

    return { success: true };
  } catch (error) {
    return { success: false, error: { message: (error as Error).message } };
  }
}

export async function updateBillingEmail({
  organizationId,
  billingEmail,
}: {
  organizationId: string;
  billingEmail: string;
}): Promise<{ success: boolean; error?: { message: string } }> {
  try {
    await prisma.organization.update({
      where: { id: organizationId },
      data: { billingEmail },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: { message: (error as Error).message } };
  }
}
