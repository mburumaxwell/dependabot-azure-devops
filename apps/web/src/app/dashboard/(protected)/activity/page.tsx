import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { redirect, unauthorized } from 'next/navigation';
import {
  type DateTimeRangePair,
  getDateFromTimeRange,
  granularityToMilliseconds,
  type TimeRange,
} from '@/lib/aggregation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateSearchParams } from '@/lib/utils';
import { ChartsSection, StatsSection } from './page.client';
import {
  type ChartData,
  defaultTimeRangeOption,
  getGranularity,
  type StatsData,
  type StatsDataInner,
  selectedTimeRangeOptions,
} from './shared';

export const metadata: Metadata = {
  title: 'Activity',
  description: 'View your activity',
  openGraph: { url: `/dashboard/activity` },
};

export default async function ActivityPage(props: PageProps<'/dashboard/activity'>) {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    unauthorized();
  }

  const searchParams = (await props.searchParams) as {
    timeRange?: TimeRange;
  };
  const { timeRange = '7d' } = searchParams;

  // if some options are invalid, redirect to default
  const searchParamsUpdates: Record<string, string> = {};
  if (!selectedTimeRangeOptions.find((option) => option.value === timeRange)) {
    searchParamsUpdates.timeRange = defaultTimeRangeOption.value;
  }
  if (Object.keys(searchParamsUpdates).length > 0) {
    redirect(`/dashboard/activity?${updateSearchParams(searchParams, searchParamsUpdates).toString()}`);
  }

  // fetch data in parallel
  const [statsData, chartData] = await Promise.all([
    fetchStats(organizationId, timeRange),
    fetchChartData(organizationId, timeRange),
  ]);

  return (
    <div className='p-6 space-y-6'>
      <StatsSection data={statsData} />
      <ChartsSection data={chartData} />
    </div>
  );
}

async function fetchStats(organizationId: string, timeRange: TimeRange): Promise<StatsData> {
  async function getData(organizationId: string, { start, end }: DateTimeRangePair): Promise<StatsDataInner> {
    const where = { organizationId, createdAt: { gte: start, lt: end } };
    const [count, succeeded, durationAgg, running] = await Promise.all([
      prisma.updateJob.count({ where }),
      prisma.updateJob.count({ where: { ...where, status: 'succeeded' } }),
      prisma.updateJob.aggregate({
        where: { ...where, duration: { not: null } },
        _sum: { duration: true },
      }),
      prisma.updateJob.count({ where: { ...where, status: { in: ['running', 'scheduled'] } } }),
    ]);

    const duration = (durationAgg._sum.duration ?? 0) / 60_000; // convert from ms to minutes

    return {
      count,
      succeeded,
      successRate: count === 0 ? 0 : (succeeded / count) * 100,
      duration,
      running,
    };
  }

  // compute the date ranges
  const end = new Date();
  const primary: DateTimeRangePair = getDateFromTimeRange(timeRange, { end });
  const compare: DateTimeRangePair = getDateFromTimeRange(timeRange, { end: primary.start });

  // fetch stats for both ranges in parallel
  const [current, previous] = await Promise.all([getData(organizationId, primary), getData(organizationId, compare)]);
  return { current, previous };
}

async function fetchChartData(organizationId: string, timeRange: TimeRange): Promise<ChartData> {
  const floorToBucket = (d: Date, bucketMs: number) => new Date(Math.floor(d.getTime() / bucketMs) * bucketMs);
  const bucketStart = (d: Date, bucketMs: number) => new Date(Math.floor(d.getTime() / bucketMs) * bucketMs);

  type Row = { createdAt: Date; duration: number | null };

  function bucketizeMinutes(rows: Row[], range: DateTimeRangePair, bucketMs: number): Map<string, number> {
    const map = new Map<string, number>();

    // initialise all buckets to 0 so the chart is stable
    for (let t = range.start.getTime(); t < range.end.getTime(); t += bucketMs) {
      map.set(new Date(t).toISOString(), 0);
    }

    for (const r of rows) {
      if (r.duration == null) continue;
      const b = bucketStart(r.createdAt, bucketMs).toISOString();
      if (!map.has(b)) continue; // can happen if row is on boundary and you change semantics
      map.set(b, (map.get(b) ?? 0) + r.duration / 60_000);
    }

    return map;
  }

  function shiftBucketKeys(bucketMap: Map<string, number>, offsetMs: number): Map<string, number> {
    const shifted = new Map<string, number>();
    for (const [iso, v] of bucketMap.entries()) {
      const shiftedIso = new Date(new Date(iso).getTime() + offsetMs).toISOString();
      shifted.set(shiftedIso, v);
    }
    return shifted;
  }

  async function getData(organizationId: string, { start, end }: DateTimeRangePair) {
    return await prisma.updateJob.findMany({
      where: {
        organizationId,
        createdAt: { gte: start, lt: end },
        duration: { not: null },
      },
      select: { createdAt: true, duration: true },
    });
  }

  const granularity = getGranularity(timeRange);
  const bucketMs = granularityToMilliseconds(granularity);

  // freeze and align "now" once for consistent buckets
  const end = floorToBucket(new Date(), bucketMs);
  const primary: DateTimeRangePair = getDateFromTimeRange(timeRange, { end });
  const compare: DateTimeRangePair = getDateFromTimeRange(timeRange, { end: primary.start });

  const [currentRows, compareRows] = await Promise.all([
    getData(organizationId, primary),
    getData(organizationId, compare),
  ]);

  const currentBuckets = bucketizeMinutes(currentRows, primary, bucketMs);
  const compareBucketsRaw = bucketizeMinutes(compareRows, compare, bucketMs);

  // shift compare series so it overlays the primary x-axis
  const offsetMs = primary.start.getTime() - compare.start.getTime();
  const compareBuckets = shiftBucketKeys(compareBucketsRaw, offsetMs);

  // merge into recharts-friendly data
  const points: { timestamp: string; current: number; previous: number }[] = [];
  for (let t = primary.start.getTime(); t < primary.end.getTime(); t += bucketMs) {
    const timestamp = new Date(t).toISOString();
    points.push({
      timestamp,
      current: currentBuckets.get(timestamp) ?? 0,
      previous: compareBuckets.get(timestamp) ?? 0,
    });
  }

  return {
    granularity,
    primary: { start: primary.start.toISOString(), end: primary.end.toISOString() },
    compare: { start: compare.start.toISOString(), end: compare.end.toISOString() },
    points,
  };
}
