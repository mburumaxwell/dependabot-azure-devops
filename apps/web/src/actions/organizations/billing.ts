'use server';

import { storeFeedback } from '@/actions/feedback';
import { getPrices, PRICE_LOOKUP_KEY_MANAGEMENT, PRICE_LOOKUP_KEY_USAGE, stripe } from '@/lib/billing';
import { environment } from '@/lib/environment';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { config } from '@/site-config';

export async function createStripeCheckoutSession({
  organizationId,
}: {
  organizationId: string;
}): Promise<{ url?: string; error?: { message: string } }> {
  const { siteUrl: baseUrl } = config;
  try {
    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    const prices = await getPrices();

    const customerId = organization.customerId || undefined;
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        name_collection: { business: { enabled: true, optional: true } },
        customer: customerId, // in case the customer already exists from previous subscriptions
        customer_update: customerId ? { name: 'auto', address: 'auto' } : undefined,
        billing_address_collection: 'auto',
        tax_id_collection: { enabled: true },
        automatic_tax: { enabled: true },
        line_items: [
          {
            price: prices[PRICE_LOOKUP_KEY_MANAGEMENT]!.id,
            quantity: 1,
            adjustable_quantity: { enabled: false },
          },
          {
            price: prices[PRICE_LOOKUP_KEY_USAGE]!.id,
            // for metered billing, quantity and adjustable_quantity must not be set
          },
        ],
        allow_promotion_codes: true,
        success_url: `${baseUrl}/dashboard/${organization.slug}/settings/billing/success/{CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/dashboard/${organization.slug}/settings/billing`,
        consent_collection: {
          terms_of_service: 'required',
          payment_method_reuse_agreement: { position: 'auto' },
        },
        adaptive_pricing: { enabled: true },
        client_reference_id: organization.id,
      },
      {
        // set idempotency key to avoid duplicate sessions for the same organization in the day
        // this allows retry safely and it also means we get the same session if user retries within the day
        idempotencyKey: environment.production
          ? `checkout-session:${organization.id}:${new Date().getDate()}`
          : undefined,
      },
    );

    return { url: session.url! };
  } catch (error) {
    logger.error(error);
    return { error: { message: (error as Error).message } };
  }
}

export async function createStripeBillingPortalSession({
  organizationId,
}: {
  organizationId: string;
}): Promise<{ url?: string; error?: { message: string } }> {
  const { siteUrl: baseUrl } = config;
  try {
    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    if (!organization.customerId || !organization.subscriptionId) {
      throw new Error('Organization does not have an active subscription');
    }

    const session = await stripe.billingPortal.sessions.create(
      {
        customer: organization.customerId,
        return_url: `${baseUrl}/dashboard/${organization.slug}/settings/billing`,
      },
      {
        // set idempotency key to avoid duplicate sessions for the same organization in the day
        // this allows retry safely and it also means we get the same session if user retries within the day
        idempotencyKey: environment.production
          ? `billing-portal:${organization.id}:${new Date().getDate()}`
          : undefined,
      },
    );

    return { url: session.url! };
  } catch (error) {
    logger.error(error);
    return { error: { message: (error as Error).message } };
  }
}

export async function cancelSubscription({
  organizationId,
  feedback,
}: {
  organizationId: string;
  feedback?: string;
}): Promise<{ success: boolean; error?: { message: string } }> {
  try {
    const organization = await prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    // ensure subscription exists
    if (!organization.subscriptionId) {
      throw new Error('Organization does not have an active subscription');
    }

    // ensure there are no projects connected
    const projectCount = await prisma.project.count({
      where: { organizationId: organization.id },
    });
    if (projectCount > 0) {
      throw new Error('Please disconnect all projects before cancelling the subscription');
    }

    // cancel the subscription immediately
    await stripe.subscriptions.cancel(
      organization.subscriptionId,
      {
        invoice_now: true,
      },
      {
        // set idempotency key to avoid duplicate cancellations for the same organization in the day
        // this allows retry safely and it also means we get the same result if user retries within the day
        idempotencyKey: environment.production
          ? `cancel-subscription:${organization.id}:${new Date().getDate()}`
          : undefined,
      },
    );

    // when the webhook event is received, the organization will be updated

    // collect the feedback, if provided
    if (feedback) {
      await storeFeedback({
        type: 'billing.cancel',
        message: feedback,
        metadata: { organizationId },
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: { message: (error as Error).message } };
  }
}
