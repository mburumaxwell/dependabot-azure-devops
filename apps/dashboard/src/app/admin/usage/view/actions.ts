'use server';

import { prisma } from '@/lib/prisma';
import type { UsageTelemetry } from '@/lib/prisma/client';

export async function fetchTelemetryData({
  start,
  end,
  owner,
  packageManager,
  success,
}: {
  start: Date;
  end: Date;
  owner?: string;
  packageManager?: string;
  success?: string;
}): Promise<UsageTelemetry[]> {
  const data = await prisma.usageTelemetry.findMany({
    where: {
      started: { gte: start, lte: end },
      ...(owner ? { owner } : {}),
      ...(packageManager ? { packageManager } : {}),
      ...(success ? { success: Boolean(success) } : {}),
    },
  });

  return data;
}
