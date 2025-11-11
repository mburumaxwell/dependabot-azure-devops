'use server';

import { prisma, type UsageTelemetry } from '@/lib/prisma';

export async function fetchTelemetryData({
  start,
  end,
  owner,
  packageManager: selectedPackageManager,
  success: successFilter,
}: {
  start: Date;
  end: Date;
  owner?: string;
  packageManager?: string;
  success?: string;
}): Promise<UsageTelemetry[]> {
  const success = successFilter === 'success' ? true : successFilter === 'failure' ? false : undefined;
  const packageManager =
    selectedPackageManager && selectedPackageManager !== 'all' ? selectedPackageManager : undefined;

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
