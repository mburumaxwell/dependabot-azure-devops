import { type Granularity, type TimeRange, timeRangeOptions } from '@/lib/aggregation';

export type StatsDataInner = {
  count: number;
  succeeded: number;
  successRate: number;
  duration: number;
  running: number;
};
export type StatsData = { previous: StatsDataInner; current: StatsDataInner };
export const selectedTimeRangeOptions = timeRangeOptions.filter((o) => ['7d', '30d', '90d'].includes(o.value));
export const defaultTimeRangeOption = selectedTimeRangeOptions[0]!;

export type ChartData = {
  granularity: Granularity;
  primary: { start: string; end: string };
  compare: { start: string; end: string };
  points: { timestamp: string; current: number; previous: number }[];
};

export function getGranularity(range: TimeRange): Granularity {
  switch (range) {
    case '7d':
      return '1h';
    case '30d':
      return '6h';
    case '90d':
      return '1d';
    default:
      throw new Error('Unsupported time range for granularity');
  }
}

export function getCompareLabels(range: TimeRange) {
  const currentLabel = selectedTimeRangeOptions.find((o) => o.value === range)!.label;

  // "Last 7 Days" -> "Previous 7 Days"
  const previousLabel = `Previous ${currentLabel.slice(5)}`;
  return { currentLabel, previousLabel };
}
