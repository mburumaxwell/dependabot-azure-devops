import { getBillingPeriod, stripe, stripeSubscriptionStatusToSubscriptionStatus } from '@/lib/billing';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { config } from '@/site-config';

// in this route (not a page), we will pull the details about the checkout, update the organization accordingly, and then redirect to the main billing page with a success message

export async function GET(_req: Request, params: RouteContext<'/dashboard/[org]/settings/billing/success/[id]'>) {
  const { org: organizationSlug, id } = await params.params;

  logger.info(`Handling successful checkout for session ID: ${id}`);

  // retrieve the checkout session from Stripe
  const session = await stripe.checkout.sessions.retrieve(id, {
    expand: ['customer', 'subscription'],
  });

  if (!session || !session.customer || !session.subscription || !session.client_reference_id) {
    return new Response('Invalid checkout session', { status: 400 });
  }

  // the organization ID is stored in the client_reference_id field
  const organizationId = session.client_reference_id;
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId, slug: organizationSlug },
  });

  // extract customer and subscription details
  const customer = session.customer;
  const customerId = typeof customer === 'string' ? customer : customer.id;
  const subscription = session.subscription;
  if (typeof subscription === 'string') {
    throw new Error('Subscription should not be a string here');
  }
  const subscriptionId = subscription.id;
  if (!customerId || !subscriptionId) {
    return new Response('Invalid customer or subscription in checkout session', { status: 400 });
  }

  // ensure the status is valid
  const subscriptionStatus = stripeSubscriptionStatusToSubscriptionStatus(subscription.status);
  if (!subscriptionStatus) {
    return new Response('Invalid subscription status', { status: 400 });
  }

  const billingPeriod = getBillingPeriod(subscription);

  // update organization with customer and subscription details
  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      customerId,
      subscriptionId,
      subscriptionStatus,
      billingPeriod,
    },
  });

  // redirect to billing page
  return Response.redirect(`${config.siteUrl}/dashboard/${organizationSlug}/settings/billing`, 302);
}
