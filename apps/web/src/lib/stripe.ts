import { Stripe } from 'stripe';
import type { OrganizationBillingInterval, OrganizationTier } from '@/lib/prisma';
import { ORGANIZATION_TIERS_INFO, type OrganizationTierInfo } from './organizations';

export const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

export type EnrichedOrganizationTierInfo = OrganizationTierInfo & {
  prices: Record<
    OrganizationBillingInterval,
    | {
        priceId: string;
        lookupKey: string;
        amount: number;
        currency: string;
      }
    | undefined
  >;
};

/**
 * Fetch enriched organization tier info with Stripe price details.
 * This should be called infrequently and cached, as it makes API calls to Stripe.
 * @returns Enriched organization tier info with Stripe price details
 */
export async function getEnrichedTiers(): Promise<Map<OrganizationTier, EnrichedOrganizationTierInfo>> {
  // gather lookup keys
  const tiers = Array.from(ORGANIZATION_TIERS_INFO.values());
  const lookupKeys = tiers.flatMap((oti) => Object.values(oti.stripe ?? {})).filter(Boolean) as string[];

  // fetch by lookup_key
  const byLookup = new Map<string, Stripe.Price>();
  if (lookupKeys.length) {
    const all = await stripe.prices.list({ active: true, expand: ['data.product'], limit: 100 });
    for (const price of all.data) {
      if (price.lookup_key && lookupKeys.includes(price.lookup_key)) {
        byLookup.set(price.lookup_key, price);
      }
    }
  }

  // build enriched tiers
  const enriched = tiers.map((tier) => {
    const monthly = tier.stripe?.monthly ? byLookup.get(tier.stripe.monthly) : undefined;
    const yearly = tier.stripe?.yearly ? byLookup.get(tier.stripe.yearly) : undefined;

    function fmt(p?: Stripe.Price) {
      return p
        ? {
            priceId: p.id,
            lookupKey: p.lookup_key!,
            amount: p.unit_amount! / 100,
            currency: p.currency.toUpperCase(),
          }
        : undefined;
    }

    return {
      ...tier,
      prices: {
        monthly: fmt(monthly),
        yearly: fmt(yearly),
      },
    } satisfies EnrichedOrganizationTierInfo;
  });

  return new Map(enriched.map((eti) => [eti.type, eti]));
}
