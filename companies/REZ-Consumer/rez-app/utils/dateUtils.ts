/**
 * Date Utility Functions
 * Safe date formatting with null/undefined checks to prevent "Invalid Date" errors
 */

/**
 * Safely format a date value to locale date string
 * @param dateValue - Date string, Date object, number timestamp, or null/undefined
 * @param options - Intl.DateTimeFormatOptions for customization
 * @param fallback - Fallback string if date is invalid (default: 'N/A')
 * @returns Formatted date string or fallback
 */
export function formatDate(
  dateValue: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = 'N/A'
): string {
  if (!dateValue) {
    return fallback;
  }

  try {
    const date = new Date(dateValue);

    // Check for invalid date
    if (isNaN(date.getTime())) {
      return fallback;
    }

    return date.toLocaleDateString(undefined, options);
  } catch {
    return fallback;
  }
}

/**
 * Safely format a date value to locale time string
 * @param dateValue - Date string, Date object, number timestamp, or null/undefined
 * @param options - Intl.DateTimeFormatOptions for customization
 * @param fallback - Fallback string if date is invalid (default: 'N/A')
 * @returns Formatted time string or fallback
 */
export function formatTime(
  dateValue: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = 'N/A'
): string {
  if (!dateValue) {
    return fallback;
  }

  try {
    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return fallback;
    }

    return date.toLocaleTimeString(undefined, options);
  } catch {
    return fallback;
  }
}

/**
 * Safely format a date value to locale date and time string
 * @param dateValue - Date string, Date object, number timestamp, or null/undefined
 * @param options - Intl.DateTimeFormatOptions for customization
 * @param fallback - Fallback string if date is invalid (default: 'N/A')
 * @returns Formatted date and time string or fallback
 */
export function formatDateTime(
  dateValue: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = 'N/A'
): string {
  if (!dateValue) {
    return fallback;
  }

  try {
    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return fallback;
    }

    return date.toLocaleString(undefined, options);
  } catch {
    return fallback;
  }
}

/**
 * Format date with month and year (e.g., "January 2025")
 * @param dateValue - Date string, Date object, number timestamp, or null/undefined
 * @param fallback - Fallback string if date is invalid
 * @returns Formatted month/year string or fallback
 */
export function formatMonthYear(
  dateValue: string | Date | number | null | undefined,
  fallback: string = 'N/A'
): string {
  return formatDate(dateValue, { month: 'long', year: 'numeric' }, fallback);
}

/**
 * Format date in short format (e.g., "Jan 29, 2025")
 * @param dateValue - Date string, Date object, number timestamp, or null/undefined
 * @param fallback - Fallback string if date is invalid
 * @returns Formatted short date string or fallback
 */
export function formatShortDate(
  dateValue: string | Date | number | null | undefined,
  fallback: string = 'N/A'
): string {
  return formatDate(dateValue, { month: 'short', day: 'numeric', year: 'numeric' }, fallback);
}

/**
 * Format date as relative time (e.g., "2 days ago", "in 3 hours")
 * @param dateValue - Date string, Date object, number timestamp, or null/undefined
 * @param fallback - Fallback string if date is invalid
 * @returns Relative time string or fallback
 */
export function formatRelativeTime(
  dateValue: string | Date | number | null | undefined,
  fallback: string = 'N/A'
): string {
  if (!dateValue) {
    return fallback;
  }

  try {
    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return fallback;
    }

    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    const diffWeek = Math.round(diffDay / 7);
    const diffMonth = Math.round(diffDay / 30);
    const diffYear = Math.round(diffDay / 365);

    // Use Intl.RelativeTimeFormat if available
    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

      if (Math.abs(diffSec) < 60) {
        return rtf.format(diffSec, 'second');
      } else if (Math.abs(diffMin) < 60) {
        return rtf.format(diffMin, 'minute');
      } else if (Math.abs(diffHour) < 24) {
        return rtf.format(diffHour, 'hour');
      } else if (Math.abs(diffDay) < 7) {
        return rtf.format(diffDay, 'day');
      } else if (Math.abs(diffWeek) < 4) {
        return rtf.format(diffWeek, 'week');
      } else if (Math.abs(diffMonth) < 12) {
        return rtf.format(diffMonth, 'month');
      } else {
        return rtf.format(diffYear, 'year');
      }
    }

    // Fallback for environments without Intl.RelativeTimeFormat
    const abs = (n: number) => Math.abs(n);
    const isPast = diffMs < 0;
    const suffix = isPast ? 'ago' : 'from now';

    if (abs(diffSec) < 60) {
      return 'just now';
    } else if (abs(diffMin) < 60) {
      return `${abs(diffMin)} minute${abs(diffMin) !== 1 ? 's' : ''} ${suffix}`;
    } else if (abs(diffHour) < 24) {
      return `${abs(diffHour)} hour${abs(diffHour) !== 1 ? 's' : ''} ${suffix}`;
    } else if (abs(diffDay) < 7) {
      return `${abs(diffDay)} day${abs(diffDay) !== 1 ? 's' : ''} ${suffix}`;
    } else if (abs(diffWeek) < 4) {
      return `${abs(diffWeek)} week${abs(diffWeek) !== 1 ? 's' : ''} ${suffix}`;
    } else if (abs(diffMonth) < 12) {
      return `${abs(diffMonth)} month${abs(diffMonth) !== 1 ? 's' : ''} ${suffix}`;
    } else {
      return `${abs(diffYear)} year${abs(diffYear) !== 1 ? 's' : ''} ${suffix}`;
    }
  } catch {
    return fallback;
  }
}

/**
 * Check if a date value is valid
 * @param dateValue - Date string, Date object, number timestamp, or null/undefined
 * @returns true if the date is valid, false otherwise
 */
export function isValidDate(dateValue: string | Date | number | null | undefined): boolean {
  if (!dateValue) {
    return false;
  }

  try {
    const date = new Date(dateValue);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Parse a date value safely
 * @param dateValue - Date string, Date object, number timestamp, or null/undefined
 * @returns Date object or null if invalid
 */
export function parseDate(dateValue: string | Date | number | null | undefined): Date | null {
  if (!dateValue) {
    return null;
  }

  try {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Get days since a given date
 * @param dateValue - Date string, Date object, number timestamp, or null/undefined
 * @returns Number of days since the date, or null if invalid
 */
export function getDaysSince(dateValue: string | Date | number | null | undefined): number | null {
  const date = parseDate(dateValue);
  if (!date) {
    return null;
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format a date for display in "Last updated" contexts
 * Shows relative time for recent dates, absolute for older dates
 * @param dateValue - Date string, Date object, number timestamp, or null/undefined
 * @param fallback - Fallback string if date is invalid
 * @returns Formatted string
 */
export function formatLastUpdated(
  dateValue: string | Date | number | null | undefined,
  fallback: string = 'Never'
): string {
  if (!dateValue) {
    return fallback;
  }

  const daysSince = getDaysSince(dateValue);
  if (daysSince === null) {
    return fallback;
  }

  // For dates within the last 24 hours, show relative time
  if (daysSince === 0) {
    return formatRelativeTime(dateValue, fallback);
  }

  // For dates within the last week, show relative days
  if (daysSince < 7) {
    return formatRelativeTime(dateValue, fallback);
  }

  // For older dates, show the actual date
  return formatShortDate(dateValue, fallback);
}
