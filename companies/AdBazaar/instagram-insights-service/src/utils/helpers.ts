// Utility functions for the Instagram Insights Service

/**
 * Calculate engagement rate
 */
export const calculateEngagementRate = (
  totalEngagement: number,
  totalReach: number
): number => {
  if (totalReach === 0) return 0;
  return parseFloat(((totalEngagement / totalReach) * 100).toFixed(2));
};

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (
  current: number,
  previous: number
): number => {
  if (previous === 0) return 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
};

/**
 * Format number with K/M suffix
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Parse date range from query params
 */
export const parseDateRange = (days?: number): {
  startDate: Date;
  endDate: Date;
} => {
  const endDate = new Date();
  const startDate = new Date();

  if (days) {
    startDate.setDate(startDate.getDate() - days);
  } else {
    // Default to last 30 days
    startDate.setDate(startDate.getDate() - 30);
  }

  return { startDate, endDate };
};

/**
 * Get ISO week number
 */
export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

/**
 * Get day name from date
 */
export const getDayName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

/**
 * Get hour label
 */
export const getHourLabel = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

/**
 * Sort object by values descending
 */
export const sortByValue = <T>(
  obj: Record<string, T>,
  limit?: number
): { key: string; value: T }[] => {
  const entries = Object.entries(obj);
  entries.sort((a, b) => {
    const aVal = typeof a[1] === 'number' ? (a[1] as number) : 0;
    const bVal = typeof b[1] === 'number' ? (b[1] as number) : 0;
    return bVal - aVal;
  });

  if (limit) {
    return entries.slice(0, limit).map(([key, value]) => ({ key, value }));
  }

  return entries.map(([key, value]) => ({ key, value }));
};

/**
 * Normalize percentage to ensure total is 100%
 */
export const normalizePercentages = (
  items: { label: string; value: number }[]
): { label: string; value: number; percentage: number }[] => {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return items.map((item) => ({ ...item, percentage: 0 }));

  return items.map((item) => ({
    ...item,
    percentage: parseFloat(((item.value / total) * 100).toFixed(2)),
  }));
};

/**
 * Chunk array into smaller arrays
 */
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

/**
 * Sleep utility
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Sanitize string for safe usage
 */
export const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/[<>]/g, '')
    .replace(/\n+/g, ' ')
    .substring(0, 500);
};

/**
 * Truncate string with ellipsis
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

/**
 * Generate cache key from parameters
 */
export const generateCacheKey = (...parts: (string | number)[]): string => {
  return parts.join(':');
};

/**
 * Parse Instagram media type
 */
export const parseMediaType = (type: string): string => {
  const typeMap: Record<string, string> = {
    IMAGE: 'IMAGE',
    VIDEO: 'VIDEO',
    CAROUSEL_ALBUM: 'CAROUSEL_ALBUM',
    REELS: 'REELS',
    STORY: 'STORY',
    IGTV: 'IGTV',
  };
  return typeMap[type.toUpperCase()] || 'UNKNOWN';
};