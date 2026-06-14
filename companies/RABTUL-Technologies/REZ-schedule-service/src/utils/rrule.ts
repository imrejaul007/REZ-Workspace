// ReZ Schedule - RRULE Utilities
// RFC 5545 RRULE implementation for complex recurring availability
import { dayjs } from './datetime';

interface RRuleOptions {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  count?: number;
  until?: Date;
  byDay?: string[];  // ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  byMonthDay?: number[];
  byMonth?: number[];
  byHour?: number[];
  byMinute?: number[];
  bySetPos?: number[];
  wkst?: string; // Week start ['MO', 'TU', ...]
}

const DAY_MAP: Record<string, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
};

const DAY_MAP_REVERSE: Record<number, string> = {
  0: 'SU', 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA',
};

/**
 * Parse RRULE string to options object
 */
export function parseRRule(rruleString: string): RRuleOptions {
  const options: RRuleOptions = {
    frequency: 'WEEKLY',
  };

  const parts = rruleString.split(';');
  for (const part of parts) {
    const [key, value] = part.split('=');
    switch (key) {
      case 'FREQ':
        options.frequency = value as RRuleOptions['frequency'];
        break;
      case 'INTERVAL':
        options.interval = parseInt(value, 10);
        break;
      case 'COUNT':
        options.count = parseInt(value, 10);
        break;
      case 'UNTIL':
        options.until = dayjs(value, 'YYYYMMDDTHHmmssZ').toDate();
        break;
      case 'BYDAY':
        options.byDay = value.split(',');
        break;
      case 'BYMONTHDAY':
        options.byMonthDay = value.split(',').map(v => parseInt(v, 10));
        break;
      case 'BYMONTH':
        options.byMonth = value.split(',').map(v => parseInt(v, 10));
        break;
      case 'BYHOUR':
        options.byHour = value.split(',').map(v => parseInt(v, 10));
        break;
      case 'BYMINUTE':
        options.byMinute = value.split(',').map(v => parseInt(v, 10));
        break;
      case 'BYSETPOS':
        options.bySetPos = value.split(',').map(v => parseInt(v, 10));
        break;
      case 'WKST':
        options.wkst = value;
        break;
    }
  }

  return options;
}

/**
 * Generate RRULE string from options
 */
export function generateRRule(options: RRuleOptions): string {
  const parts: string[] = [`FREQ=${options.frequency}`];

  if (options.interval && options.interval > 1) {
    parts.push(`INTERVAL=${options.interval}`);
  }

  if (options.count) {
    parts.push(`COUNT=${options.count}`);
  }

  if (options.until) {
    const until = dayjs(options.until).format('YYYYMMDDTHHmmss') + 'Z';
    parts.push(`UNTIL=${until}`);
  }

  if (options.byDay?.length) {
    parts.push(`BYDAY=${options.byDay.join(',')}`);
  }

  if (options.byMonthDay?.length) {
    parts.push(`BYMONTHDAY=${options.byMonthDay.join(',')}`);
  }

  if (options.byMonth?.length) {
    parts.push(`BYMONTH=${options.byMonth.join(',')}`);
  }

  if (options.byHour?.length) {
    parts.push(`BYHOUR=${options.byHour.join(',')}`);
  }

  if (options.byMinute?.length) {
    parts.push(`BYMINUTE=${options.byMinute.join(',')}`);
  }

  if (options.bySetPos?.length) {
    parts.push(`BYSETPOS=${options.bySetPos.join(',')}`);
  }

  if (options.wkst) {
    parts.push(`WKST=${options.wkst}`);
  }

  return parts.join(';');
}

/**
 * Get occurrences from RRULE
 */
export function getOccurrences(
  options: RRuleOptions,
  startDate: Date,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const occurrences: Date[] = [];
  const {
    frequency,
    interval = 1,
    count,
    until,
    byDay,
    byMonthDay,
    byMonth,
  } = options;

  let current = dayjs(startDate);
  const end = until || rangeEnd;
  const maxCount = count || 1000; // Safety limit

  let iteration = 0;
  const maxIterations = 1000;

  while (occurrences.length < maxCount && current.isBefore(end) && iteration < maxIterations) {
    iteration++;

    // Check if current date is in range
    if (current.isSameOrAfter(rangeStart) && current.isSameOrBefore(rangeEnd)) {
      let include = true;

      // Check BYDAY
      if (byDay?.length) {
        const dayNames = byDay.map(d => DAY_MAP[d]);
        include = dayNames.includes(current.day());
      }

      // Check BYMONTH
      if (include && byMonth?.length) {
        include = byMonth.includes(current.month() + 1);
      }

      // Check BYMONTHDAY
      if (include && byMonthDay?.length) {
        include = byMonthDay.includes(current.date());
      }

      if (include) {
        occurrences.push(current.toDate());
      }
    }

    // Move to next occurrence
    switch (frequency) {
      case 'DAILY':
        current = current.add(interval, 'day');
        break;
      case 'WEEKLY':
        current = current.add(interval, 'week');
        break;
      case 'MONTHLY':
        current = current.add(interval, 'month');
        break;
      case 'YEARLY':
        current = current.add(interval, 'year');
        break;
    }
  }

  return occurrences;
}

/**
 * Check if a date matches an RRULE
 */
export function matchesRRule(date: Date, rruleString: string, startDate: Date): boolean {
  const options = parseRRule(rruleString);
  const occurrences = getOccurrences(options, startDate, date, date);
  return occurrences.length > 0;
}

/**
 * Get next occurrence from RRULE
 */
export function getNextOccurrence(
  rruleString: string,
  startDate: Date,
  after: Date
): Date | null {
  const options = parseRRule(rruleString);
  const occurrences = getOccurrences(
    options,
    startDate,
    after,
    dayjs(after).add(1, 'year').toDate()
  );
  return occurrences[0] || null;
}

/**
 * Expand RRULE to time slots
 */
export function expandToSlots(
  rruleString: string,
  startDate: Date,
  rangeStart: Date,
  rangeEnd: Date,
  startTime: string,  // "HH:mm"
  endTime: string,   // "HH:mm"
  duration: number   // minutes
): { start: Date; end: Date }[] {
  const occurrences = getOccurrences(parseRRule(rruleString), startDate, rangeStart, rangeEnd);
  const slots: { start: Date; end: Date }[] = [];

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  for (const day of occurrences) {
    const dayStart = dayjs(day).hour(startHour).minute(startMinute).second(0);
    const dayEnd = dayjs(day).hour(endHour).minute(endMinute).second(0);

    // Generate slots within the day
    let current = dayStart;
    while (current.add(duration, 'minute').isSameOrBefore(dayEnd)) {
      slots.push({
        start: current.toDate(),
        end: current.add(duration, 'minute').toDate(),
      });
      current = current.add(duration, 'minute');
    }
  }

  return slots;
}

/**
 * Common RRULE patterns
 */
export const RRulePatterns = {
  // Weekly on weekdays
  weeklyWeekdays: (startTime = '09:00', endTime = '17:00') =>
    generateRRule({
      frequency: 'WEEKLY',
      interval: 1,
      byDay: ['MO', 'TU', 'WE', 'TH', 'FR'],
    }),

  // Weekly on specific days
  weekly: (days: string[], interval = 1) =>
    generateRRule({
      frequency: 'WEEKLY',
      interval,
      byDay: days,
    }),

  // Every N weeks
  biweekly: (days: string[] = ['MO', 'WE', 'FR']) =>
    generateRRule({
      frequency: 'WEEKLY',
      interval: 2,
      byDay: days,
    }),

  // Monthly on specific day
  monthlyOnDay: (day: number) =>
    generateRRule({
      frequency: 'MONTHLY',
      interval: 1,
      byMonthDay: [day],
    }),

  // Monthly on first weekday
  monthlyFirstWeekday: () =>
    generateRRule({
      frequency: 'MONTHLY',
      interval: 1,
      byDay: ['MO', 'TU', 'WE', 'TH', 'FR'],
      bySetPos: [1],
    }),

  // Daily
  daily: (interval = 1) =>
    generateRRule({
      frequency: 'DAILY',
      interval,
    }),
};

export default {
  parseRRule,
  generateRRule,
  getOccurrences,
  matchesRRule,
  getNextOccurrence,
  expandToSlots,
  RRulePatterns,
};
