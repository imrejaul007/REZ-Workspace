/**
 * Error Tracking Service - Day 22-30
 * Sentry integration + custom error handling
 */

import * as Sentry from '@sentry/node';
import { redis } from './config/redis';

const ERROR_PREFIX = 'errors:';
const ERROR_TTL = 86400 * 30; // 30 days

interface ErrorEvent {
  errorId: string;
  service: string;
  message: string;
  stack?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Capture error to Sentry + Redis
 */
export async function captureError(error: Error, context?: {
  service: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const errorId = crypto.randomUUID();

  // Sentry
  Sentry.captureException(error, {
    extra: context,
    tags: { service: context?.service },
  });

  // Redis for quick lookup
  const event: ErrorEvent = {
    errorId,
    service: context?.service || 'unknown',
    message: error.message,
    stack: error.stack,
    userId: context?.userId,
    metadata: context?.metadata,
    timestamp: new Date(),
  };

  await redis.setex(`${ERROR_PREFIX}${errorId}`, ERROR_TTL, JSON.stringify(event));
  await redis.zadd(`${ERROR_PREFIX}index`, Date.now(), errorId);

  return errorId;
}

/**
 * Get recent errors
 */
export async function getRecentErrors(service?: string, limit = 100): Promise<ErrorEvent[]> {
  const ids = await redis.zrevrange(`${ERROR_PREFIX}index`, 0, limit - 1);
  const errors: ErrorEvent[] = [];

  for (const id of ids) {
    const event = await redis.get(`${ERROR_PREFIX}${id}`);
    if (event) {
      const parsed = JSON.parse(event);
      if (!service || parsed.service === service) {
        errors.push(parsed);
      }
    }
  }

  return errors;
}

/**
 * Get error by ID
 */
export async function getError(errorId: string): Promise<ErrorEvent | null> {
  const event = await redis.get(`${ERROR_PREFIX}${errorId}`);
  return event ? JSON.parse(event) : null;
}

/**
 * Resolve error
 */
export async function resolveError(errorId: string): Promise<void> {
  await redis.setex(`${ERROR_PREFIX}${errorId}:resolved`, ERROR_TTL, new Date().toISOString());
}
