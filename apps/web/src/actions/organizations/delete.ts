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

  // if organization has a subscriptionId, cancel the subscription first
  if (organization.subscriptionId) {
    try {
      await stripe.subscriptions.cancel(organization.subscriptionId);
    } catch (error) {
      // it was already canceled
      if (!(error instanceof stripe.errors.StripeInvalidRequestError)) {
        return { success: false, error: { message: 'Failed to cancel organization billing.' } };
      }
    }
    // update org to remove subscription
    await prisma.organization.update({
      where: { id: organizationId },
      data: { subscriptionId: null, subscriptionStatus: null },
    });
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
