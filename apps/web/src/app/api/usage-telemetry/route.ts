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

  // prepare values to store
  const values: Omit<UsageTelemetry, '_id'> = {
    country: geo.country,
    region: fromExternalRegion(geo.region),
    ...payload,
  };

  // if region is missing, add geo info to metadata
  if (!values.region) {
    values.metadata ??= {};
    values.metadata['geo-region-missing'] = 'true';
    values.metadata['geo-city'] = geo.city;
    values.metadata['geo-region'] = geo.region;
    values.metadata['geo-country-region'] = geo.countryRegion;
  }

  // upsert into db
  const collection = await getMongoCollection('usage_telemetry');
  await collection.updateOne({ _id }, { $set: { _id, ...values } }, { upsert: true });

  return context.body(null, 204);
});

export const { POST } = toNextJsHandler(app);
