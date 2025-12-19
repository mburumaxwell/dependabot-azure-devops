import { z } from 'zod';

export const TimeRangeSchema = z.enum(['1h', '4h', '6h', '12h', '24h', '7d', '30d', '90d', '12M']);
export const GranularitySchema = z.enum(['5m', '15m', '30m', '1h', '6h', '12h', '1d', '1w', '1M']);
export type TimeRange = z.infer<typeof TimeRangeSchema>;
export type Granularity = z.infer<typeof GranularitySchema>;

export type TimeRangeOption = { value: TimeRange; label: string };
export const timeRangeOptions: TimeRangeOption[] = [
  { value: '1h', label: 'Last 1 Hour' },
  { value: '4h', label: 'Last 4 Hours' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '12h', label: 'Last 12 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 3 Months' },
  { value: '12M', label: 'Last 12 Months' },
];

export type GranularityOption = { value: Granularity; label: string };
export const granularityOptions: GranularityOption[] = [
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '12h', label: '12 Hours' },
  { value: '1d', label: '1 Day' },
  { value: '1w', label: '1 Week' },
  { value: '1M', label: '1 Month' },
];

const TIME_RANGES_MAP: Record<TimeRange, number> = {
  '1h': 1 * 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
  '12M': 12 * 30 * 24 * 60 * 60 * 1000,
};
export type DateTimeRangePair = { start: Date; end: Date };
export function getDateFromTimeRange(
  value: TimeRange,
  options: { start: Date } | { end: Date } = { end: new Date() },
): DateTimeRangePair {
  const duration = TIME_RANGES_MAP[value];
  if (!duration) throw new Error(`Unsupported time range: ${value}`);

  // if both start and end are specified, throw error
  if ('start' in options && 'end' in options) {
    throw new Error('Cannot specify both start and end dates');
  }

  // if end is provided, calculate start
  if ('end' in options) {
    const { end } = options;
    return { start: new Date(end.getTime() - duration), end };
  }
  const { start } = options;
  return { start, end: new Date(start.getTime() + duration) };
}

const GRANULARITIES_MAP: Record<Granularity, number> = {
  '5m': 5 * 60 * 1_000,
  '15m': 15 * 60 * 1_000,
  '30m': 30 * 60 * 1_000,
  '1h': 1 * 60 * 60 * 1_000,
  '6h': 6 * 60 * 60 * 1_000,
  '12h': 12 * 60 * 60 * 1_000,
  '1d': 24 * 60 * 60 * 1_000,
  '1w': 7 * 24 * 60 * 60 * 1_000,
  '1M': 30 * 24 * 60 * 60 * 1_000,
};
export function granularityToMilliseconds(value: Granularity): number {
  const ms = GRANULARITIES_MAP[value];
  if (!ms) throw new Error(`Unsupported granularity: ${value}`);
  return ms;
}

export function isHourlyRange(timeRange: TimeRange) {
  return ['1h', '4h', '6h', '12h', '24h'].includes(timeRange);
}

export function getCompareLabels(range: TimeRange) {
  const currentLabel = timeRangeOptions.find((o) => o.value === range)!.label;
  // "Last 7 Days" -> "Previous 7 Days"
  const previousLabel = `Previous ${currentLabel.slice(5)}`;
  return { currentLabel, previousLabel };
}

export const statsTimeRangeOptions = timeRangeOptions.filter((o) => ['7d', '30d', '90d'].includes(o.value));
export const defaultStatsTimeRangeOption = statsTimeRangeOptions[0]!;

export function getStatsGranularity(range: TimeRange): Granularity {
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
