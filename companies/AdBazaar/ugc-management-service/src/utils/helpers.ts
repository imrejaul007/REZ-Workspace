/**
 * Generate a short unique ID
 */
export const generateId = (prefix: string = ''): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
};

/**
 * Format date to ISO string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parse date string to Date object
 */
export const parseDate = (dateString: string): Date | null => {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Truncate string with ellipsis
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

/**
 * Extract hashtags from text
 */
export const extractHashtags = (text: string): string[] => {
  const regex = /#[\w]+/g;
  return (text.match(regex) || []).map(tag => tag.toLowerCase().replace('#', ''));
};

/**
 * Extract mentions from text
 */
export const extractMentions = (text: string): string[] => {
  const regex = /@[\w]+/g;
  return (text.match(regex) || []).map(mention => mention.toLowerCase().replace('@', ''));
};

/**
 * Slugify string
 */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Calculate engagement score
 */
export const calculateEngagementScore = (likes: number, comments: number, shares: number): number => {
  // Weighted engagement score
  return likes + (comments * 2) + (shares * 3);
};

/**
 * Pagination helper
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const paginate = <T>(
  items: T[],
  total: number,
  options: PaginationOptions
): PaginatedResult<T> => {
  const { page, limit } = options;
  const totalPages = Math.ceil(total / limit);

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

/**
 * Sleep/delay helper
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Chunk array into smaller arrays
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Remove duplicates from array
 */
export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

/**
 * Format bytes to human readable
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Normalize platform name
 */
export const normalizePlatform = (platform: string): string => {
  const platformMap: Record<string, string> = {
    'ig': 'instagram',
    'twitter': 'twitter',
    'x': 'twitter',
    'fb': 'facebook',
    'facebook': 'facebook',
    'tiktok': 'tiktok',
    'tt': 'tiktok'
  };

  return platformMap[platform.toLowerCase()] || platform.toLowerCase();
};

/**
 * Get platform display name
 */
export const getPlatformDisplayName = (platform: string): string => {
  const displayNames: Record<string, string> = {
    instagram: 'Instagram',
    twitter: 'X/Twitter',
    facebook: 'Facebook',
    tiktok: 'TikTok'
  };

  return displayNames[platform] || platform;
};

/**
 * Sanitize text for display
 */
export const sanitizeText = (text: string): string => {
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
};