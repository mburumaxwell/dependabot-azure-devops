export type TimeRange = '1h' | '4h' | '6h' | '24h' | '7d' | '30d' | '3M' | '12M';
export type Granularity = '5m' | '15m' | '30m' | '1h' | '6h' | '12h' | '1d' | '1w' | '1M';

export const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: '1h', label: 'Last 1 Hour' },
  { value: '4h', label: 'Last 4 Hours' },
  { value: '6h', label: 'Last 6 Hours' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '3M', label: 'Last 3 Months' },
  { value: '12M', label: 'Last 12 Months' },
];

export const granularityOptions: { value: Granularity; label: string }[] = [
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

export function getDateTimeRange(value: TimeRange): { start: Date; end: Date } {
  const end = new Date();
  const map: Record<TimeRange, number> = {
    '1h': 1 * 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '3M': 3 * 30 * 24 * 60 * 60 * 1000,
    '12M': 12 * 30 * 24 * 60 * 60 * 1000,
  };
  const duration = map[value];
  if (!duration) throw new Error(`Unsupported time range: ${value}`);
  return { start: new Date(end.getTime() - duration), end };
}

export function granularityToMilliseconds(value: Granularity): number {
  const map: Record<Granularity, number> = {
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
  const ms = map[value];
  if (!ms) throw new Error(`Unsupported granularity: ${value}`);
  return ms;
}
