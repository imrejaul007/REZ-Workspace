// ReZ Schedule - Date/Time Utilities
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

export { dayjs };

// ============================================
// TIME HELPERS
// ============================================

/**
 * Parse time string "HH:mm" to minutes from midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight to "HH:mm" string
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if a time is within a range
 */
export function isTimeInRange(time: string, start: string, end: string): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  return timeMinutes >= startMinutes && timeMinutes < endMinutes;
}

/**
 * Get start and end of day in a timezone
 */
export function getDayBounds(date: Date, timezone: string): { start: dayjs.Dayjs; end: dayjs.Dayjs } {
  const d = dayjs(date).tz(timezone);
  return {
    start: d.startOf('day'),
    end: d.endOf('day'),
  };
}

/**
 * Get all dates between start and end
 */
export function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let current = dayjs(start).startOf('day');
  const endDate = dayjs(end).startOf('day');

  while (current.isSameOrBefore(endDate)) {
    dates.push(current.toDate());
    current = current.add(1, 'day');
  }

  return dates;
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(date: Date): number {
  return dayjs(date).day();
}

/**
 * Check if a date is today in a timezone
 */
export function isToday(date: Date, timezone: string): boolean {
  return dayjs(date).tz(timezone).isSame(dayjs().tz(timezone), 'day');
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return dayjs(date).add(minutes, 'minute').toDate();
}

/**
 * Get current time in a timezone
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  return dayjs().tz(timezone).toDate();
}

/**
 * Convert time between timezones
 */
export function convertTimezone(date: Date, fromTz: string, toTz: string): Date {
  return dayjs(date).tz(toTz).toDate();
}

/**
 * Format date for display
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD', timezone?: string): string {
  const d = timezone ? dayjs(date).tz(timezone) : dayjs(date);
  return d.format(format);
}

/**
 * Format time for display
 */
export function formatTime(date: Date, timezone?: string): string {
  const d = timezone ? dayjs(date).tz(timezone) : dayjs(date);
  return d.format('h:mm A');
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date, timezone?: string): boolean {
  const d = timezone ? dayjs(date).tz(timezone) : dayjs(date);
  return d.isBefore(dayjs());
}

/**
 * Get minimum booking time (now + notice period)
 */
export function getMinBookingTime(noticeMinutes: number, timezone: string): Date {
  return dayjs().tz(timezone).add(noticeMinutes, 'minute').toDate();
}

/**
 * Check if slot overlaps with existing bookings
 */
export function doSlotsOverlap(
  slot1Start: Date,
  slot1End: Date,
  slot2Start: Date,
  slot2End: Date
): boolean {
  return dayjs(slot1Start).isBefore(dayjs(slot2End)) && dayjs(slot2Start).isBefore(dayjs(slot1End));
}

// ============================================
// VALIDATORS
// ============================================

/**
 * Check if timezone is valid
 */
export function isValidTimezone(tz: string): boolean {
  try {
    dayjs().tz(tz);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get default timezone
 */
export function getDefaultTimezone(): string {
  return 'Asia/Kolkata';
}
