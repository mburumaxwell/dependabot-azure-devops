import { zValidator } from '@hono/zod-validator';
import { toNextJsHandler } from '@paklo/core/hono';
import { UsageTelemetryRequestDataSchema } from '@paklo/core/usage';
import { geolocation } from '@vercel/functions';
import { Hono } from 'hono';
import { getMongoCollection, type UsageTelemetry } from '@/lib/mongodb';
import { fromExternalRegion } from '@/lib/regions';

const app = new Hono().basePath('/api/usage-telemetry');

app.post('/', zValidator('json', UsageTelemetryRequestDataSchema), async (context) => {
  const geo = geolocation(context.req.raw);
  const { id: _id, ...payload } = context.req.valid('json');

  const values: Omit<UsageTelemetry, '_id'> = {
    country: geo?.country ?? undefined,
    region: fromExternalRegion(geo?.region),
    ...payload,
  };

  const collection = await getMongoCollection('usage_telemetry');
  await collection.updateOne({ _id }, { $set: { _id, ...values } }, { upsert: true });

  return context.body(null, 204);
});

export const { POST } = toNextJsHandler(app);
