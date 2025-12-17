import { toNextJsHandler } from '@paklo/core/hono';
import { Hono } from 'hono';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import {
  type StripeSubscriptionStatus,
  stripe,
  stripeSubscriptionStatusToSubscriptionStatus,
  webhookSecret,
} from '@/lib/stripe';

export const dynamic = 'force-dynamic';

const app = new Hono().basePath('/api/webhooks/stripe');

app.post('/', async (context) => {
  const signature = context.req.header('stripe-signature');
  if (!signature) return context.text('', 400);

  try {
    const body = await context.req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    switch (event.type) {
      case 'customer.subscription.deleted': {
        const subscriptionId = event.data.object.id;
        const customer = event.data.object.customer;
        const customerId = typeof customer === 'string' ? customer : customer?.id;
        await handleSubscriptionCancelled({ customerId, subscriptionId });
        break;
      }
      case 'customer.subscription.updated': {
        const subscriptionId = event.data.object.id;
        const customer = event.data.object.customer;
        const customerId = typeof customer === 'string' ? customer : customer?.id;
        const status = event.data.object.status;
        await handleSubscriptionUpdated({ customerId, subscriptionId, status });
        break;
      }
      default:
        logger.warn(`Unhandled stripe webhook of event type: ${event.type}`);
        break;
    }
    return context.text('', 200);
  } catch (err) {
    const message = `Webhook signature verification failed. ${(err as Error).message}`;
    logger.error(message);
    return context.text(message, 400);
  }
});

export const { POST, OPTIONS } = toNextJsHandler(app);

async function handleSubscriptionCancelled({
  customerId,
  subscriptionId,
}: {
  customerId: string;
  subscriptionId: string;
}) {
  // find organization with this customerId and subscriptionId
  const organization = await prisma.organization.findFirst({
    where: { customerId, subscriptionId },
  });
  if (!organization) {
    logger.warn(
      `Could not find organization with customerId: ${customerId} and subscriptionId: ${subscriptionId} to cancel subscription`,
    );
    return;
  }

  // update organization to remove subscription info
  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      // customerId is not removed to allow reusing the same customer in future subscriptions
      subscriptionId: null,
      subscriptionStatus: null,
    },
  });

  logger.info(`Cancelled subscription for organizationId: ${organization.id}`);
}

async function handleSubscriptionUpdated({
  customerId,
  subscriptionId,
  status,
}: {
  customerId: string;
  subscriptionId: string;
  status: StripeSubscriptionStatus;
}) {
  const subscriptionStatus = stripeSubscriptionStatusToSubscriptionStatus(status);
  if (!subscriptionStatus) {
    logger.warn(`Could not map stripe subscription status from ${status} to internal subscription status`);
    return;
  }

  // find organization with this customerId and subscriptionId
  const organization = await prisma.organization.findFirst({
    where: { customerId, subscriptionId },
  });
  if (!organization) {
    logger.warn(
      `Could not find organization with customerId: ${customerId} and subscriptionId: ${subscriptionId} to update subscription`,
    );
    return;
  }

  // update organization with new subscription status
  await prisma.organization.update({
    where: { id: organization.id },
    data: { subscriptionStatus },
  });

  logger.info(`Updated subscription status to ${status} for organizationId: ${organization.id}`);
}
