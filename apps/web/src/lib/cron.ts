import type { DependabotSchedule } from '@paklo/core/dependabot';

export function generateCron(schedule: DependabotSchedule): string {
  const { interval } = schedule;
  if (interval === 'cron') {
    if (!schedule.cronjob) {
      throw new Error('Cron schedule is required for cron intervals');
    }
    return schedule.cronjob;
  }

  const [hour, minute] = schedule.time!.split(':').map(Number);
  const day = dayToInt(schedule.day!);

  // format to use:
  // minute, hour, day of month, month, day of week
  switch (interval) {
    case 'daily':
      return `${minute} ${hour} * * 1-5`; // any day of the month, any month, but on weekdays
    case 'weekly':
      return `${minute} ${hour} * * ${day}`; // any day of the month, any month, but on a given day of the week
    case 'monthly':
      return `${minute} ${hour} 1 * *`; // first day of the month, any month, any day of the week
    case 'quarterly':
      return `${minute} ${hour} 1 1,4,7,10 *`; // first day of each quarter (January, April, July, and October)
    case 'semiannually':
      return `${minute} ${hour} 1 1,7 *`; // every six months, on the first day of January and July
    case 'yearly':
      return `${minute} ${hour} 1 1 *`; // first day of January
    default:
      throw new Error(`Unsupported interval: ${interval}`);
  }
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
