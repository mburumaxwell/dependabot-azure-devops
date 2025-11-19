'use server';

import { type Filter, getCollection, type UsageTelemetry } from '@/lib/mongodb';

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

  const collection = await getCollection('usage_telemetry');
  const query: Filter<UsageTelemetry> = {
    started: { $gte: start, $lte: end },
    ...(owner ? { owner } : {}),
    ...(packageManager ? { packageManager } : {}),
    ...(success !== undefined ? { success: success } : {}),
  };
  const data = await collection.find(query).toArray();

  return data;
}
