import { zValidator } from '@hono/zod-validator';
import { toNextJsHandler } from '@paklo/core/hono';
import { UsageTelemetryRequestDataSchema } from '@paklo/core/usage';
import { geolocation } from '@vercel/functions';
import { Hono } from 'hono';
import { z } from 'zod';
import { getMongoCollection, type UsageTelemetry } from '@/lib/mongodb';
import { fromExternalRegion } from '@/lib/regions';

const app = new Hono().basePath('/api/usage-telemetry');

const RequestDataSchema = UsageTelemetryRequestDataSchema.omit({ id: true }).extend({
  // this supports older versions that send numeric ids
  // changed from number to string on 2025-11-16
  id: z.string().or(z.number()),
});
app.post('/', zValidator('json', RequestDataSchema), async (context) => {
  const geo = geolocation(context.req.raw);
  const payload = context.req.valid('json');
  const _id = String(payload.id);

  const values: Omit<UsageTelemetry, '_id'> = {
    country: geo?.country ?? null,
    region: fromExternalRegion(geo?.region) ?? geo.region ?? null, // may be undefined for non-Vercel providers
    hostPlatform: payload.host.platform,
    hostRelease: payload.host.release,
    hostArch: payload.host.arch,
    hostMachineHash: payload.host['machine-hash'],
    hostDockerContainer: payload.host['docker-container'] ?? false,
    trigger: payload.trigger,
    version: payload.version,
    provider: payload.provider,
    owner: payload.owner,
    project: payload.project ?? null,
    packageManager: payload['package-manager'],
    started: payload.started,
    duration: payload.duration,
    success: payload.success,
    error: payload.error,
  };

  const collection = await getMongoCollection('usage_telemetry');
  await collection.updateOne({ _id }, { $set: { _id, ...values } }, { upsert: true });

  return context.body(null, 204);
});

export const { POST } = toNextJsHandler(app);
