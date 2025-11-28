import { toNextJsHandler } from '@paklo/core/hono';
import { Hono } from 'hono';
import { logger } from '@/lib/logger';
import { stripe, webhookSecret } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

const app = new Hono().basePath('/api/stripe');

app.post('/webhook', async (context) => {
  const signature = context.req.header('stripe-signature');
  if (!signature) return context.text('', 400);

  try {
    const body = await context.req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    switch (event.type) {
      // TODO: handle relevant stripe events
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

export const { POST } = toNextJsHandler(app);
