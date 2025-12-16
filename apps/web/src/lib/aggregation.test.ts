// biome-ignore-all lint/suspicious/noExplicitAny: test file

import { describe, expect, it } from 'vitest';
import { getDateFromTimeRange } from './aggregation';

describe('getDateFromTimeRange', () => {
  it('calculates start from end for 1h', () => {
    const end = new Date('2025-12-15T12:00:00Z');
    const result = getDateFromTimeRange('1h', { end });

    expect(result.start).toEqual(new Date('2025-12-15T11:00:00Z'));
    expect(result.end).toEqual(end);
  });

  it('calculates start from end for 24h', () => {
    const end = new Date('2025-12-15T12:00:00Z');
    const result = getDateFromTimeRange('24h', { end });

    expect(result.start).toEqual(new Date('2025-12-14T12:00:00Z'));
    expect(result.end).toEqual(end);
  });

  it('calculates start from end for 7d', () => {
    const end = new Date('2025-12-15T12:00:00Z');
    const result = getDateFromTimeRange('7d', { end });

    expect(result.start).toEqual(new Date('2025-12-08T12:00:00Z'));
    expect(result.end).toEqual(end);
  });

  it('calculates end from start for 1h', () => {
    const start = new Date('2025-12-15T12:00:00Z');
    const result = getDateFromTimeRange('1h', { start });

    expect(result.start).toEqual(start);
    expect(result.end).toEqual(new Date('2025-12-15T13:00:00Z'));
  });

  it('calculates end from start for 24h', () => {
    const start = new Date('2025-12-15T12:00:00Z');
    const result = getDateFromTimeRange('24h', { start });

    expect(result.start).toEqual(start);
    expect(result.end).toEqual(new Date('2025-12-16T12:00:00Z'));
  });

  it('uses current date as end by default', () => {
    const before = Date.now();
    const result = getDateFromTimeRange('1h');
    const after = Date.now();

    expect(result.end.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.end.getTime()).toBeLessThanOrEqual(after);
  });

  it('throws error for unsupported time range', () => {
    const end = new Date('2025-12-15T12:00:00Z');
    expect(() => getDateFromTimeRange('invalid' as any, { end })).toThrow('Unsupported time range');
  });

  it('throws error if both start and end are provided', () => {
    const start = new Date('2025-12-15T12:00:00Z');
    const end = new Date('2025-12-16T12:00:00Z');
    expect(() => getDateFromTimeRange('1h', { start, end } as any)).toThrow('Cannot specify both start and end dates');
  });
});
