'use client';

import { Activity, CheckCircle2, CircleDotDashed, Clock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { getMetricDirection, MetricCard } from '@/components/metric-card';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useIsMobile } from '@/hooks/use-mobile';
import type { TimeRange } from '@/lib/aggregation';
import { updateFiltersInSearchParams } from '@/lib/utils';
import {
  type ChartData,
  defaultTimeRangeOption,
  getCompareLabels,
  type StatsData,
  selectedTimeRangeOptions,
} from './shared';

export function StatsSection({ data }: { data: StatsData }) {
  function getDiff(current: number, previous: number) {
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  }

  const { current, previous } = data;
  const countDiff = getDiff(current.count, previous.count);
  const successRateDiff = getDiff(current.successRate, previous.successRate);
  const durationDiff = getDiff(current.duration, previous.duration);

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <MetricCard
        title='Total Jobs'
        value={Math.round(current.count).toLocaleString()}
        trend={Math.abs(countDiff).toLocaleString()}
        direction={getMetricDirection(countDiff)}
        unit='%'
        icon={Activity}
      />

      <MetricCard
        title='Success Rate'
        value={Math.round(current.successRate).toLocaleString()}
        trend={Math.abs(successRateDiff).toLocaleString()}
        direction={getMetricDirection(successRateDiff)}
        unit='%'
        icon={CheckCircle2}
      />

      <MetricCard
        title='Minutes Used'
        value={Math.round(current.duration).toLocaleString()}
        trend={Math.abs(durationDiff).toLocaleString()}
        // direction={getMetricDirection(durationDiff)}
        icon={Clock}
      />

      <MetricCard title='Running' value={current.running.toLocaleString()} icon={CircleDotDashed} />
    </div>
  );
}

export function ChartsSection({ data }: { data: ChartData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const timeRange = (searchParams.get('timeRange') as TimeRange) ?? defaultTimeRangeOption.value;
  const { currentLabel, previousLabel } = getCompareLabels(timeRange);

  const updateFilters = (updates: Record<string, string>, clear: boolean = false) =>
    updateFiltersInSearchParams(router, searchParams, updates, clear);

  const chartConfig = {
    minutes: { label: 'Minutes Used' },
    current: { label: 'Current', color: 'var(--chart-1)' },
    previous: { label: 'Previous', color: 'var(--chart-2)' },
  } satisfies ChartConfig;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Minutes Used</CardTitle>
        <CardDescription>
          <span>{defaultTimeRangeOption.label}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type='single'
            value={timeRange}
            variant='outline'
            size='sm'
            onValueChange={(value) => updateFilters({ timeRange: value })}
            className='invisible lg:visible'
          >
            {selectedTimeRangeOptions.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select value={timeRange} onValueChange={(value) => updateFilters({ timeRange: value })}>
            <SelectTrigger className='flex w-40 lg:invisible' size='sm' aria-label='Select a value'>
              <SelectValue placeholder={defaultTimeRangeOption.label} />
            </SelectTrigger>
            <SelectContent className='rounded-xl'>
              {selectedTimeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className='rounded-lg'>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer config={chartConfig} className='aspect-auto h-62.5 w-full'>
          <AreaChart data={data.points}>
            <defs>
              <linearGradient id='fillPrevious' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--color-previous)' stopOpacity={1.0} />
                <stop offset='95%' stopColor='var(--color-previous)' stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id='fillCurrent' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--color-current)' stopOpacity={0.8} />
                <stop offset='95%' stopColor='var(--color-current)' stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='timestamp'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              }
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }
                  formatter={(value, name) => {
                    const label =
                      name === 'current' ? currentLabel : name === 'previous' ? previousLabel : String(name);

                    return [`${Math.round(Number(value)).toLocaleString()} min `, label];
                  }}
                  indicator='dot'
                />
              }
            />
            <Area
              dataKey='current'
              type='natural'
              fill='url(#fillCurrent)'
              stroke='var(--color-current)'
              baseValue={0}
            />
            <Area
              dataKey='previous'
              type='natural'
              fill='url(#fillPrevious)'
              stroke='var(--color-previous)'
              baseValue={0}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
