'use server';

import { storeFeedback } from '@/actions/feedback';
import { environment } from '@/lib/environment';
import { prisma } from '@/lib/prisma';
import { getPrices, PRICE_LOOKUP_KEY_MANAGEMENT, PRICE_LOOKUP_KEY_USAGE, stripe } from '@/lib/stripe';
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

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        customer: organization.customerId || undefined, // in case the customer already exists from previous subscriptions
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
        success_url: `${baseUrl}/dashboard/settings/billing/success/{CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/dashboard/settings/billing`,
        allow_promotion_codes: false,
        automatic_tax: { enabled: true },
        consent_collection: {
          terms_of_service: 'required',
          payment_method_reuse_agreement: { position: 'auto' },
        },
        client_reference_id: organization.id,
        billing_address_collection: 'auto',
        name_collection: { business: { enabled: true, optional: true } },
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
        return_url: `${baseUrl}/dashboard/settings/billing`,
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

    if (!organization.subscriptionId) {
      throw new Error('Organization does not have an active subscription');
    }

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
        action: 'billing_cancel',
        message: feedback,
        metadata: { organizationId },
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: { message: (error as Error).message } };
  }
}
