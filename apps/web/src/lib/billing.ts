import { Stripe } from 'stripe';
import type { Money } from '@/lib/money';
import type { Period } from '@/lib/period';
import type { SubscriptionStatus } from '@/lib/prisma';

export const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PRICE_LOOKUP_KEY_MANAGEMENT = 'management';
export const PRICE_LOOKUP_KEY_USAGE = 'usage';
export const PRICE_LOOKUP_KEYS = [PRICE_LOOKUP_KEY_MANAGEMENT, PRICE_LOOKUP_KEY_USAGE];

let fetchedPrices: Record<string, { id: string }> | undefined;
export async function getPrices() {
  if (fetchedPrices) return fetchedPrices;

  const prices = await stripe.prices.list({ active: true, lookup_keys: PRICE_LOOKUP_KEYS });
  fetchedPrices = {};
  for (const price of prices.data) {
    if (price.lookup_key && PRICE_LOOKUP_KEYS.includes(price.lookup_key)) {
      fetchedPrices[price.lookup_key] = price;
    }
  }
  return fetchedPrices;
}

export type StripeSubscription = Stripe.Subscription;
export function getBillingPeriod(subscription: StripeSubscription): Period {
  const item = subscription.items.data.find((item) => item.price.lookup_key === PRICE_LOOKUP_KEY_MANAGEMENT)!;
  if (!item) {
    throw new Error('Management price not found in subscription items');
  }
  const { current_period_start, current_period_end } = item;
  return { start: new Date(current_period_start * 1000), end: new Date(current_period_end * 1000) };
}

export type StripeSubscriptionStatus = Stripe.Subscription.Status;
export function mapSubscriptionStatus(status: StripeSubscriptionStatus): SubscriptionStatus | undefined {
  switch (status) {
    case 'active':
      return 'active';
    case 'canceled':
      return 'canceled';
    case 'past_due':
      return 'past_due';
    // case 'incomplete':
    // case 'incomplete_expired':
    // case 'unpaid':
    default:
      return undefined;
  }
}

export const INCLUDED_USAGE_MINUTES = 1000;
export const METER_EVENT_NAME_USAGE = 'job_execution_minutes';

export const PRICE_AMOUNT_MONTHLY_MANAGEMENT: Money = { amount: 2000, currency: 'USD' }; // $20.00
export const PRICE_AMOUNT_PER_MINUTE_USAGE: Money = { amount: 6, currency: 'USD' }; // $0.06
