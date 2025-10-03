import { zValidator } from '@hono/zod-validator';
import { UsageTelemetryRequestDataSchema } from '@paklo/cli/dependabot';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';

import { prisma } from '@/lib/prisma';
import type { UsageTelemetry } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

const app = new Hono().basePath('/api/usage-telemetry');

app.post('/', zValidator('json', UsageTelemetryRequestDataSchema), async (context) => {
  const payload = context.req.valid('json');

  const { id } = payload;

  const values: Omit<UsageTelemetry, 'id'> = {
    hostPlatform: payload.host.platform,
    hostRelease: payload.host.release,
    hostArch: payload.host.arch,
    hostMachineHash: payload.host['machine-hash'],
    trigger: payload.trigger,
    version: payload.version,
    provider: payload.provider,
    owner: payload.owner,
    packageManager: payload['package-manager'],
    started: payload.started,
    duration: payload.duration,
    success: payload.success,
  };

  await prisma.usageTelemetry.upsert({
    where: { id },
    create: { id: payload.id, ...values },
    update: { ...values },
  });

  return context.body(null, 204);
});

export const POST = handle(app);
