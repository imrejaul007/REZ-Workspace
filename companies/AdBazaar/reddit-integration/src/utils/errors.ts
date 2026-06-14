/**
 * Custom error classes for Reddit Integration Service
 */

export class RedditApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'REDDIT_API_ERROR'
  ) {
    super(message);
    this.name = 'RedditApiError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
 }
}

export class RateLimitError extends Error {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter: number = 60
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: { path: string; message: string }[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class DuplicateError extends Error {
  constructor(resource: string) {
    super(`${resource} already exists`);
    this.name = 'DuplicateError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Check if error is a Reddit API error
 */
export const isRedditApiError = (error: unknown): error is RedditApiError => {
  return error instanceof RedditApiError;
};

/**
 * Check if error is an operational error
 */
export const isOperationalError = (error: unknown): boolean => {
  return (
    error instanceof RedditApiError ||
    error instanceof AuthenticationError ||
    error instanceof RateLimitError ||
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof DuplicateError
  );
};
