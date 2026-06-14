/**
 * Format a date to Reddit's required format
 */
export const formatRedditDate = (date: Date): number => {
  return Math.floor(date.getTime() / 1000);
};

/**
 * Parse Reddit timestamp to Date
 */
export const parseRedditTimestamp = (timestamp: number): Date => {
  return new Date(timestamp * 1000);
};

/**
 * Sanitize subreddit name
 */
export const sanitizeSubredditName = (name: string): string => {
  return name.toLowerCase().replace(/^r\//, '').replace(/[^a-z0-9_]/g, '');
};

/**
 * Format Reddit post URL
 */
export const formatRedditUrl = (subreddit: string, postId: string): string => {
  return `https://reddit.com/r/${subreddit}/comments/${postId}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Convert vote direction string to number
 */
export const voteDirectionToNumber = (
  direction: 'up' | 'down' | 'none'
): -1 | 0 | 1 => {
  switch (direction) {
    case 'up':
      return 1;
    case 'down':
      return -1;
    case 'none':
    default:
      return 0;
  }
};

/**
 * Format large numbers (e.g., 1000 -> 1K)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Calculate engagement score
 */
export const calculateEngagement = (metrics: {
  score: number;
  comments: number;
  awards?: number;
}): number => {
  return metrics.score + metrics.comments * 2 + (metrics.awards || 0) * 10;
};

/**
 * Sleep utility for rate limiting
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
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
      if (i < maxRetries - 1) {
        await sleep(baseDelay * Math.pow(2, i));
      }
    }
  }

  throw lastError;
};
