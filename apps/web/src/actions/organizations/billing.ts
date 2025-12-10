'use server';

import { prisma } from '@/lib/prisma';

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
