import { Stripe } from 'stripe';

export const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // TODO: lock this version once we are using it stably
  // apiVersion: '2025-10-29.clover',
});
