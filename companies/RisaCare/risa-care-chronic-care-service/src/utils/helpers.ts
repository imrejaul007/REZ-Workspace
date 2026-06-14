import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return uuidv4();
};

/**
 * Get start and end dates for a time period
 */
export const getDateRange = (
  period: 'today' | 'week' | 'month' | 'quarter' | 'year',
  customDate?: Date
): { start: Date; end: Date } => {
  const now = customDate ? new Date(customDate) : new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
  }

  return { start, end };
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Get start of day
 */
export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get end of day
 */
export const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Check if a value is within range
 */
export const isInRange = (
  value: number,
  min: number,
  max: number
): boolean => {
  return value >= min && value <= max;
};

/**
 * Calculate percentage within range
 */
export const percentageInRange = (
  value: number,
  min: number,
  max: number
): number => {
  if (max === min) return 100;
  const percentage = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, percentage));
};

/**
 * Calculate moving average
 */
export const movingAverage = (
  values: number[],
  window: number
): number[] => {
  if (values.length < window) {
    return [values.reduce((a, b) => a + b, 0) / values.length];
  }

  const result: number[] = [];
  for (let i = 0; i <= values.length - window; i++) {
    const windowValues = values.slice(i, i + window);
    result.push(windowValues.reduce((a, b) => a + b, 0) / window);
  }
  return result;
};

/**
 * Determine trend from array of values
 */
export const determineTrend = (
  values: number[]
): 'improving' | 'stable' | 'declining' => {
  if (values.length < 2) return 'stable';

  const recent = values.slice(-3);
  const older = values.slice(0, -3).slice(-3);

  if (recent.length === 0 || older.length === 0) return 'stable';

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  const change = ((recentAvg - olderAvg) / olderAvg) * 100;

  if (change > 5) return 'improving';
  if (change < -5) return 'declining';
  return 'stable';
};

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
