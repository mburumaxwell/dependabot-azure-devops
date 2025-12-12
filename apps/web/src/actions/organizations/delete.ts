'use server';

import { headers as requestHeaders } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function deleteOrganization({
  organizationId,
}: {
  organizationId: string;
}): Promise<{ success: boolean; error?: { message: string } }> {
  // fetch organization so that we can delete billing first
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });

  // the organization should not have any projects
  const projectCount = await prisma.project.count({ where: { organizationId: organization.id } });
  if (projectCount > 0) {
    return { success: false, error: { message: 'Organization still has projects. Please delete them first.' } };
  }

  // the organization should not have an active subscription
  if (organization.subscriptionId) {
    return { success: false, error: { message: 'Organization has an active subscription. Please cancel it first.' } };
  }

  // if organization has a customerId, delete the customer
  if (organization.customerId) {
    try {
      await stripe.customers.del(organization.customerId);
    } catch (error) {
      // it was already deleted
      if (!(error instanceof stripe.errors.StripeInvalidRequestError)) {
        return { success: false, error: { message: 'Failed to delete organization billing.' } };
      }
    }
    // update org to remove customer
    await prisma.organization.update({ where: { id: organizationId }, data: { customerId: null } });
  }

  const headers = await requestHeaders();
  await auth.api.deleteOrganization({ headers, body: { organizationId: organizationId } });
  return { success: true };
}
