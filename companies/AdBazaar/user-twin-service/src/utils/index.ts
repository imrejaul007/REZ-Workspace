/**
 * Utility functions for the User Twin Service
 */

/**
 * Calculate weighted average
 */
export const weightedAverage = (values: number[], weights: number[]): number => {
  if (values.length !== weights.length || values.length === 0) {
    return 0;
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = values.reduce((sum, v, i) => sum + v * weights[i], 0);
  return weightedSum / totalWeight;
};

/**
 * Normalize a value to0-1 range
 */
export const normalize = (value: number, min: number, max: number): number => {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
};

/**
 * Calculate time difference in days
 */
export const daysSince = (date: Date): number => {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
};

/**
 * Format date to ISO string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parse date from various formats
 */
export const parseDate = (input: string | Date): Date => {
  if (input instanceof Date) return input;
  return new Date(input);
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Merge objects deeply
 */
export const deepMerge = <T extends object>(target: T, source: Partial<T>): T => {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        (target[key] as object) || {} as T[Extract<keyof T, string>],
        source[key] as Partial<T[Extract<keyof T, string>]>
      ) as T[Extract<keyof T, string>];
    } else if (source[key] !== undefined) {
      result[key] = source[key] as T[Extract<keyof T, string>];
    }
  }

  return result;
};

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await sleep(baseDelay * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
};

/**
 * Debounce a function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Generate a random ID
 */
export const generateId = (prefix?: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};

/**
 * Truncate string to specified length
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

/**
 * Calculate engagement tier
 */
export const getEngagementTier = (score: number): 'low' | 'medium' | 'high' => {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
};

/**
 * Calculate churn risk tier
 */
export const getChurnRiskTier = (risk: number): 'low' | 'medium' | 'high' => {
  if (risk <= 0.3) return 'low';
  if (risk <= 0.6) return 'medium';
  return 'high';
};

export default {
  weightedAverage,
  normalize,
  daysSince,
  formatDate,
  parseDate,
  deepClone,
  deepMerge,
  sleep,
  retry,
  debounce,
  generateId,
  truncate,
  getEngagementTier,
  getChurnRiskTier,
};