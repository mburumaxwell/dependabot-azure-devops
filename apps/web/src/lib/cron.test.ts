import type { DependabotSchedule } from '@paklo/core/dependabot';
import { CronExpressionParser } from 'cron-parser';
import { describe, expect, it } from 'vitest';
import { generateCron } from './cron';

// Helper to create a complete DependabotSchedule with defaults
const createSchedule = (overrides: Partial<DependabotSchedule>): DependabotSchedule => ({
  interval: 'daily',
  day: 'monday',
  timezone: 'Etc/UTC',
  time: '02:00',
  ...overrides,
});

describe('cron', () => {
  describe('generateCron', () => {
    const samples = [
      // Daily interval tests - C# expects "1,2,3,4,5" but TS returns "1-5"
      ['daily', undefined, undefined, undefined, '0 2 * * 1-5'], // default to 02:00
      ['daily', '23:30', 'saturday', undefined, '30 23 * * 1-5'], // ignores day for daily

      // Weekly interval tests
      ['weekly', '10:00', 'saturday', undefined, '0 10 * * 6'],
      ['weekly', '15:00', undefined, undefined, '0 15 * * 1'], // defaults to Monday

      // Monthly interval tests
      ['monthly', '17:30', 'saturday', undefined, '30 17 1 * *'], // ignores day for monthly

      // Other intervals
      ['quarterly', undefined, undefined, undefined, '0 2 1 1,4,7,10 *'],
      ['semiannually', undefined, undefined, undefined, '0 2 1 1,7 *'],
      ['yearly', undefined, undefined, undefined, '0 2 1 1 *'],

      // Cron interval tests - TS returns the cronjob as-is
      ['cron', undefined, undefined, '0 2 * * 1-5', '0 2 * * 1-5'],
    ] as const;

    it.each(samples)(
      'generates correct cron for interval=%s, time=%s, day=%s, cronjob=%s',
      (interval, time, day, cronjob, expected) => {
        const schedule = createSchedule({
          interval,
          ...(time && { time }),
          ...(day && { day }),
          ...(cronjob && { cronjob }),
        });

        const actual = generateCron(schedule);
        expect(actual).toBe(expected);

        // Validate that the generated cron expression is parseable
        expect(() => {
          const cronParser = CronExpressionParser.parse(actual);
          // Verify we can get next execution time
          cronParser.next();
        }).not.toThrow();
      },
    );

    describe('cron validation', () => {
      it('shows sample execution times for different intervals', () => {
        const testCases = [
          { name: 'Daily at 9:30 AM', schedule: { interval: 'daily' as const, time: '09:30' } },
          {
            name: 'Weekly on Friday at 2 PM',
            schedule: { interval: 'weekly' as const, time: '14:00', day: 'friday' as const },
          },
          { name: 'Monthly on 1st at midnight', schedule: { interval: 'monthly' as const, time: '00:00' } },
          { name: 'Custom cron weekdays', schedule: { interval: 'cron' as const, cronjob: '0 8 * * 1-5' } },
        ];

        for (const { name, schedule } of testCases) {
          const cronExpression = generateCron(createSchedule(schedule));
          const parser = CronExpressionParser.parse(cronExpression);
          const nextExecution = parser.next();

          // This is mainly for documentation/debugging purposes
          console.log(`${name}: ${cronExpression} -> Next: ${nextExecution.toISOString()}`);

          expect(nextExecution.getTime()).toBeGreaterThan(Date.now());
        }
      });
    });

    describe('cron interval handling', () => {
      it('throws error when cronjob is missing', () => {
        const schedule = createSchedule({ interval: 'cron' });
        expect(() => generateCron(schedule)).toThrow('Cron schedule is required for cron intervals');
      });

      it('returns cron expressions unchanged', () => {
        const testCases = ['0 2 * * 1-5', '30 14 * * 1,3,5', '0 9-17 * * 1-5'];

        for (const cronjob of testCases) {
          const schedule = createSchedule({ interval: 'cron', cronjob });
          expect(generateCron(schedule)).toBe(cronjob);
        }
      });
    });

    describe('day mappings', () => {
      const cases = [
        ['sunday', 0],
        ['monday', 1],
        ['tuesday', 2],
        ['wednesday', 3],
        ['thursday', 4],
        ['friday', 5],
        ['saturday', 6],
      ] as const;
      it.each(cases)('maps %s to %d correctly', (dayName, expectedNumber) => {
        const schedule = createSchedule({
          interval: 'weekly',
          time: '10:00',
          day: dayName,
        });

        const result = generateCron(schedule);
        expect(result).toBe(`0 10 * * ${expectedNumber}`);
      });
    });

    describe('time parsing', () => {
      it('parses time correctly for different formats', () => {
        const schedule = createSchedule({
          interval: 'daily',
          time: '09:30',
        });

        const result = generateCron(schedule);
        expect(result).toBe('30 9 * * 1-5');
      });

      it('handles midnight time', () => {
        const schedule = createSchedule({
          interval: 'daily',
          time: '00:00',
        });

        const result = generateCron(schedule);
        expect(result).toBe('0 0 * * 1-5');
      });

      it('handles end of day time', () => {
        const schedule = createSchedule({
          interval: 'daily',
          time: '23:59',
        });

        const result = generateCron(schedule);
        expect(result).toBe('59 23 * * 1-5');
      });
    });

    describe('error handling', () => {
      it('throws error for unsupported interval', () => {
        const schedule = createSchedule({
          // @ts-expect-error Testing unsupported interval
          interval: 'unsupported',
        });

        expect(() => generateCron(schedule)).toThrow('Unsupported interval: unsupported');
      });
    });

    describe('interval-specific behavior', () => {
      it('ignores day parameter for daily interval', () => {
        const schedule = createSchedule({
          interval: 'daily',
          time: '23:30',
          day: 'saturday', // should be ignored
        });

        const result = generateCron(schedule);
        expect(result).toBe('30 23 * * 1-5'); // Always weekdays, ignores Saturday
      });

      it('ignores day parameter for monthly interval', () => {
        const schedule = createSchedule({
          interval: 'monthly',
          time: '17:30',
          day: 'saturday', // should be ignored
        });

        const result = generateCron(schedule);
        expect(result).toBe('30 17 1 * *'); // Always 1st day of month, ignores Saturday
      });

      it('respects day parameter for weekly interval', () => {
        const schedule = createSchedule({
          interval: 'weekly',
          time: '10:00',
          day: 'saturday',
        });

        const result = generateCron(schedule);
        expect(result).toBe('0 10 * * 6'); // Uses Saturday (6)
      });
    });
  });
});
