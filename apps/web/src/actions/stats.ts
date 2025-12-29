'use server';

import { getDateFromTimeRange, type TimeRange } from '@/lib/aggregation';
import { environment } from '@/lib/environment';
import { getMongoCollection } from '@/lib/mongodb';
import { extensions } from '@/site-config';

type HomePageStats = {
  installations: number;
  /**
   * Statistics about runs in the selected time range.
   * Undefined if data is not available (e.g., on platforms without a database)
   */
  runs?: {
    /**
     * Total duration of all runs in the selected time range (in seconds)
     */
    duration: number; // in seconds
    count: number;
  };
};

/** Get statistics for the website home page */
export async function getHomePageStats(timeRange: TimeRange): Promise<HomePageStats> {
  const installations = await getAzureExtensionInstallations(extensions.azure.id);

  // // this flag does not because this function is called inside unstable_cache
  // const queryDb = await enableHomePageStats();
  const queryDb = environment.platform === 'vercel' || environment.development;
  type AggResult = { totalDuration: number; totalJobs: number };
  let usage: AggResult | undefined;
  if (queryDb) {
    const { start, end } = getDateFromTimeRange(timeRange);
    const collection = await getMongoCollection('usage_telemetry', process.env.MONGO_DB_NAME_LOCAL);
    const usages = await collection
      .aggregate<AggResult>([
        { $match: { started: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: null,
            totalDuration: { $sum: '$duration' },
            totalJobs: { $sum: 1 },
          },
        },
      ])
      .toArray();
    usage = usages[0];
  }

  return {
    installations,
    runs: queryDb
      ? {
          duration: (usage?.totalDuration ?? 0) / 1000, // convert to seconds
          count: usage?.totalJobs ?? 0,
        }
      : undefined,
  };
}

/**
 * Get the installation count of a public Azure DevOps extension from the Marketplace
 * @param id - The extension ID (e.g., 'publisher.extensionName')
 * @returns The total installation count (including on-premises downloads)
 */
async function getAzureExtensionInstallations(id: string): Promise<number> {
  const response = await fetch('https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery', {
    method: 'POST',
    headers: {
      Accept: 'application/json;api-version=6.0-preview.1',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filters: [
        {
          // 7 means name-based filter
          criteria: [{ filterType: 7, value: id }],
          pageNumber: 1,
          pageSize: 1,
        },
      ],
      flags: 256, // includes statistics
    }),
  });
  const data = await response.json();
  const stats = data.results[0]!.extensions[0]!.statistics as { statisticName: string; value: number }[];
  return stats
    .filter((stat) => ['install', 'onpremDownloads'].includes(stat.statisticName))
    .map((stat) => stat.value)
    .reduce((a, b) => a + b, 0);
}
