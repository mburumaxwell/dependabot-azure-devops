'use server';

import { cacheLife } from 'next/cache';
import { getDateFromTimeRange, type TimeRange } from '@/lib/aggregation';
import { logger } from '@/lib/logger';
import { getMongoCollection } from '@/lib/mongodb';

/**
 * Statistics about runs in the selected time range.
 * Undefined if data is not available (e.g., on platforms without a database)
 */
type HomePageStats = {
  /**
   * Total duration of all runs in the selected time range (in seconds)
   */
  duration: number; // in seconds
  count: number;
};

/**
 * Get statistics for the website home page
 * @param timeRange - The time range for usage statistics
 * @returns The home page statistics
 */
export async function getHomePageStats(timeRange: TimeRange): Promise<HomePageStats> {
  'use cache';
  // 4 hours to revalidate, 1 day expire
  cacheLife({ stale: 4 * 3600, revalidate: 4 * 3600, expire: 86400 });

  logger.info(`Fetching home page stats for time range: ${timeRange}`);
  type AggResult = { totalDuration: number; totalJobs: number };
  const { start, end } = getDateFromTimeRange(timeRange);
  const collection = await getMongoCollection('usage_telemetry');
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
  const usage = usages[0];
  logger.info('Home page stats fetched');

  return {
    duration: (usage?.totalDuration ?? 0) / 1000, // convert to seconds
    count: usage?.totalJobs ?? 0,
  };
}

/**
 * Get the installation count of a public Azure DevOps extension from the Marketplace
 * @param id - The extension ID (e.g., 'publisher.extensionName')
 * @returns The total installation count (including on-premises downloads)
 */
export async function getInstallations(id: string): Promise<number> {
  'use cache';
  // 1 day to revalidate and/or expire
  cacheLife({ stale: 86400, revalidate: 86400, expire: 86400 });

  logger.info(`Fetching installation count for extension ID: ${id}`);
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
  logger.info(`Installation count fetched for extension ID: ${id}`);
  const stats = data.results[0]!.extensions[0]!.statistics as { statisticName: string; value: number }[];
  return stats
    .filter((stat) => ['install', 'onpremDownloads'].includes(stat.statisticName))
    .map((stat) => stat.value)
    .reduce((a, b) => a + b, 0);
}
