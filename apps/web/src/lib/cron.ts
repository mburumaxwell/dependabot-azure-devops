import type { DependabotSchedule } from '@paklo/core/dependabot';
import { CronExpressionParser } from 'cron-parser';

/**
 * Generates a cron expression and calculates the next run date based on a Dependabot schedule configuration.
 *
 * @param schedule - The Dependabot schedule configuration containing interval, time, day, and optional cronjob
 * @param timezone - The timezone to use for calculating the next run date (e.g., 'America/New_York', 'UTC')
 * @returns An object containing the generated cron expression and the next scheduled run date
 *
 * @example
 * ```typescript
 * const schedule = { interval: 'weekly', time: '09:30', day: 'monday' };
 * const result = generateCron(schedule, 'UTC');
 * console.log(result.cron); // "30 9 * * 1"
 * console.log(result.next); // Next Monday at 9:30 AM UTC
 * ```
 */
export function generateCron(schedule: DependabotSchedule, timezone: string): { cron: string; next: Date } {
  const { interval } = schedule;
  let cron: string;

  // Handle custom cron expressions
  if (interval === 'cron') {
    if (!schedule.cronjob) {
      throw new Error('Cron schedule is required for cron intervals');
    }
    cron = schedule.cronjob;
  } else {
    // Parse time from HH:MM format
    const [hour, minute] = schedule.time!.split(':').map(Number);
    const day = dayToInt(schedule.day!);

    // Cron format: minute hour day-of-month month day-of-week
    // Generate cron expression based on the specified interval
    switch (interval) {
      case 'daily':
        // Run on weekdays only (Monday-Friday)
        cron = `${minute} ${hour} * * 1-5`;
        break;
      case 'weekly':
        // Run on a specific day of the week
        cron = `${minute} ${hour} * * ${day}`;
        break;
      case 'monthly':
        // Run on the first day of each month
        cron = `${minute} ${hour} 1 * *`;
        break;
      case 'quarterly':
        // Run on the first day of each quarter (January, April, July, October)
        cron = `${minute} ${hour} 1 1,4,7,10 *`;
        break;
      case 'semiannually':
        // Run twice a year on the first day of January and July
        cron = `${minute} ${hour} 1 1,7 *`;
        break;
      case 'yearly':
        // Run once a year on the first day of January
        cron = `${minute} ${hour} 1 1 *`;
        break;
      default:
        throw new Error(`Unsupported interval: ${interval}`);
    }
  }

  // Calculate the next run date based on the generated cron expression
  const next = getNextRunDate(cron, timezone);
  return { cron, next };
}

/**
 * Calculates the next run date for a given cron expression in the specified timezone.
 *
 * @param cron - A valid cron expression string
 * @param timezone - The timezone to use for calculation (e.g., 'America/New_York', 'UTC')
 * @returns The next scheduled run date as a Date object
 *
 * @example
 * ```typescript
 * const nextRun = getNextRunDate('0 9 * * 1', 'UTC'); // Every Monday at 9:00 AM UTC
 * console.log(nextRun); // Next Monday at 9:00 AM
 * ```
 */
export function getNextRunDate(cron: string, timezone: string): Date {
  const parser = CronExpressionParser.parse(cron, { tz: timezone });
  return parser.next().toDate();
}

function dayToInt(value: DependabotSchedule['day']): number {
  switch (value) {
    case 'sunday':
      return 0;
    case 'monday':
      return 1;
    case 'tuesday':
      return 2;
    case 'wednesday':
      return 3;
    case 'thursday':
      return 4;
    case 'friday':
      return 5;
    case 'saturday':
      return 6;
    default:
      throw new Error(`Unsupported day: ${value}`);
  }
}
