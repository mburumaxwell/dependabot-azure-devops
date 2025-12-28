'use client';

import type { DependabotPackageManager } from '@paklo/core/dependabot';
import { Calendar, Funnel, FunnelX } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, XAxis } from 'recharts';
import { MetricCard } from '@/components/metric-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Item, ItemActions, ItemContent, ItemMedia } from '@/components/ui/item';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isHourlyRange, type TimeRange, timeRangeOptions } from '@/lib/aggregation';
import { packageManagerOptions, type WithAll } from '@/lib/enums';
import type { UsageTelemetry } from '@/lib/mongodb';
import { formatDuration, updateFiltersInSearchParams } from '@/lib/utils';

export type SlimTelemetry = Pick<
  UsageTelemetry,
  '_id' | 'packageManager' | 'started' | 'success' | 'duration' | 'version'
>;
type TelemetryDashboardProps = {
  telemetries: SlimTelemetry[];
};

export function TelemetryDashboard({ telemetries }: TelemetryDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const timeRange = (searchParams.get('timeRange') as TimeRange) ?? '24h';
  const selectedPackageManager = (searchParams.get('packageManager') as WithAll<DependabotPackageManager>) ?? 'all';
  const successFilter = (searchParams.get('success') as WithAll<'false' | 'true'>) ?? 'all';

  const updateFilters = (updates: Record<string, string>, clear: boolean = false) =>
    updateFiltersInSearchParams(router, searchParams, updates, clear);

  const metrics = (() => {
    const totalRuns = telemetries.length;
    const successfulRuns = telemetries.filter((d) => d.success).length;
    const failedRuns = totalRuns - successfulRuns;
    const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;

    // Calculate median duration
    let medianDuration = 0;
    if (totalRuns > 0) {
      const sortedDurations = [...telemetries].map((d) => d.duration).sort((a, b) => a - b);
      const mid = Math.floor(sortedDurations.length / 2);
      medianDuration =
        sortedDurations.length % 2 === 0
          ? (sortedDurations[mid - 1]! + sortedDurations[mid]!) / 2
          : sortedDurations[mid]!;
    }

    const totalDuration = telemetries.reduce((sum, d) => sum + d.duration, 0);

    return {
      totalRuns,
      successfulRuns,
      failedRuns,
      successRate,
      medianDuration,
      totalDuration,
      formattedTotalDuration: formatDuration(totalDuration),
    };
  })();

  return (
    <div className='flex flex-col gap-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-semibold text-foreground'>Usage Telemetry</h1>
          <p className='text-sm text-muted-foreground mt-1'>Monitor and analyze pipeline execution metrics</p>
        </div>
      </div>

      {/* Filters */}
      <Item variant='outline'>
        <ItemMedia variant='icon'>
          <Funnel />
        </ItemMedia>
        <ItemContent>
          <div className='flex flex-wrap gap-3'>
            <Select value={timeRange} onValueChange={(value) => updateFilters({ timeRange: value })}>
              <SelectTrigger className='w-45'>
                <Calendar className='size-4 mr-2' />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPackageManager} onValueChange={(value) => updateFilters({ packageManager: value })}>
              <SelectTrigger className='w-50'>
                <SelectValue placeholder='All Package Managers' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Package Managers</SelectItem>
                {packageManagerOptions.map((pm) => (
                  <SelectItem key={pm.value} value={pm.value}>
                    {pm.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={successFilter} onValueChange={(value) => updateFilters({ success: value })}>
              <SelectTrigger className='w-35'>
                <SelectValue placeholder='All Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='true'>Success Only</SelectItem>
                <SelectItem value='false'>Failure Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ItemContent>
        <ItemActions>
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={() => updateFilters({}, true)}
            disabled={!(selectedPackageManager !== 'all' || successFilter !== 'all')}
          >
            <FunnelX />
          </Button>
        </ItemActions>
      </Item>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
        <MetricCard
          title='Total Runs'
          value={metrics.totalRuns.toLocaleString()}
          trend={metrics.totalRuns > 0 ? '+12%' : undefined}
          direction='up'
        />
        <MetricCard
          title='Success Rate'
          value={`${metrics.successRate.toFixed(1)}%`}
          trend={metrics.successRate > 90 ? '+23%' : undefined}
          direction={metrics.successRate > 90 ? 'up' : 'down'}
        />
        <MetricCard
          title='Total Duration'
          value={metrics.formattedTotalDuration}
          subtitle={`${Math.round(metrics.totalDuration / 1000).toLocaleString()} seconds`}
        />
        <MetricCard title='Median Duration' value={`${(metrics.medianDuration / 1000).toFixed(2)}s`} />
        <MetricCard
          title='Failed Runs'
          value={metrics.failedRuns.toLocaleString()}
          trend={metrics.failedRuns > 0 ? `${((metrics.failedRuns / metrics.totalRuns) * 100).toFixed(1)}%` : '0%'}
          direction='down'
        />
      </div>

      <div className='grid grid-rows-1 gap-4'>
        <RunsChart telemetries={telemetries} timeRange={timeRange} />
        <PackageManagerChart telemetries={telemetries} />
      </div>
    </div>
  );
}

interface RunsChartProps {
  telemetries: Pick<UsageTelemetry, 'started' | 'success'>[];
  timeRange: TimeRange;
}

function RunsChart({ telemetries, timeRange }: RunsChartProps) {
  const chartConfig = {
    total: { label: 'Total Runs', color: 'var(--chart-1)' },
    success: { label: 'Successful', color: 'var(--chart-2)' },
    failure: { label: 'Failed', color: 'var(--chart-3)' },
  } satisfies ChartConfig;

  const chartData = Object.values(
    telemetries.reduce(
      (acc, item) => {
        let key: string;
        if (isHourlyRange(timeRange)) {
          // Group by hour for short time ranges
          const date = new Date(item.started);
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
        } else {
          // Group by day for longer time ranges
          key = item.started.toISOString().split('T')[0]!;
        }

        if (!acc[key]) {
          acc[key] = { date: key, total: 0, success: 0, failure: 0 };
        }
        acc[key]!.total++;
        if (item.success) {
          acc[key]!.success++;
        } else {
          acc[key]!.failure++;
        }
        return acc;
      },
      {} as Record<string, { date: string; total: number; success: number; failure: number }>,
    ),
  ).sort((a, b) => a.date.localeCompare(b.date));

  const xAxisFormatter = (value: string) => {
    if (isHourlyRange(timeRange)) {
      // Show time for hourly ranges
      return new Intl.DateTimeFormat(undefined, { hour: 'numeric', hour12: true })
        .format(new Date(value))
        .toLowerCase();
    } else {
      // Show date for daily ranges
      return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  const tooltipLabelFormatter = (value: string) => {
    if (isHourlyRange(timeRange)) {
      return new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } else {
      return new Date(value).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <Card className='p-6'>
      <div className='flex flex-col gap-4'>
        <div>
          <h3 className='text-lg font-semibold text-foreground'>Pipeline Runs</h3>
          <p className='text-sm text-muted-foreground'>Total executions over time</p>
        </div>
        <ChartContainer config={chartConfig} className='h-75 w-full'>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={xAxisFormatter}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent labelFormatter={tooltipLabelFormatter} indicator='line' />}
            />
            <Line type='monotone' dataKey='total' stroke='var(--color-total)' strokeWidth={2} dot={false} />
            <Line type='monotone' dataKey='success' stroke='var(--color-success)' strokeWidth={2} dot={false} />
            <Line type='monotone' dataKey='failure' stroke='var(--color-failure)' strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </div>
    </Card>
  );
}

interface PackageManagerChartProps {
  telemetries: Pick<UsageTelemetry, 'packageManager' | 'success'>[];
}

function PackageManagerChart({ telemetries }: PackageManagerChartProps) {
  const chartConfig = {
    success: { label: 'Success', color: 'var(--chart-2)' },
    failure: { label: 'Failure', color: 'var(--chart-3)' },
  } satisfies ChartConfig;

  const chartData = Object.values(
    telemetries.reduce(
      (acc, item) => {
        if (!acc[item.packageManager]) {
          acc[item.packageManager] = { name: item.packageManager, success: 0, failure: 0 };
        }
        if (item.success) {
          acc[item.packageManager]!.success++;
        } else {
          acc[item.packageManager]!.failure++;
        }
        return acc;
      },
      {} as Record<string, { name: string; success: number; failure: number }>,
    ),
  )
    .sort((a, b) => b.success + b.failure - (a.success + a.failure))
    .slice(0, 10);

  return (
    <Card className='p-6'>
      <div className='flex flex-col gap-4'>
        <div>
          <h3 className='text-lg font-semibold text-foreground'>Package Manager Usage</h3>
          <p className='text-sm text-muted-foreground'>Distribution by package manager</p>
        </div>
        <ChartContainer config={chartConfig} className='h-75 w-full'>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
            <XAxis
              dataKey='name'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => packageManagerOptions.find((pm) => pm.value === value)?.label || value}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='dashed' />} />
            <Legend />
            <Bar dataKey='success' fill='var(--color-success)' radius={[4, 4, 0, 0]} />
            <Bar dataKey='failure' fill='var(--color-failure)' radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
    </Card>
  );
}
