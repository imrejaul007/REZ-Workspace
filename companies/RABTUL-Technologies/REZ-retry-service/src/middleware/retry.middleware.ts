import { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import { QueueService } from '../services/queue.service';
import { RetryService } from '../services/retry.service';
import { RetryOptions, RetryStrategy } from '../models/retry-job.model';

export interface RetryMiddlewareOptions {
  queueService: QueueService;
  retryService: RetryService;
  queueName?: string;
  defaultOptions?: Partial<RetryOptions>;
  idempotencyService?: IdempotencyService;
}

export interface IdempotencyService {
  check(key: string): Promise<{ exists: boolean; response?: unknown }>;
  store(key: string, response: unknown, statusCode: number): Promise<void>;
}

interface IdempotencyRecord {
  response: unknown;
  statusCode: number;
  createdAt: Date;
}

/**
 * Generate idempotency key from request
 */
export function generateIdempotencyKey(req: Request): string {
  // Use provided header or generate from request details
  const providedKey = req.headers['x-idempotency-key'] as string;
  if (providedKey) {
    return providedKey;
  }

  // Generate key from request fingerprint
  const fingerprint = [
    req.method,
    req.path,
    JSON.stringify(req.body || {}),
    req.headers['x-request-id'] || '',
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `idem-${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`;
}

/**
 * Middleware factory for automatic retry on failed requests WITH IDEMPOTENCY
 *
 * FIX: Added idempotency key handling to prevent duplicate processing
 * when retries occur across multiple service instances.
 */
export function createRetryMiddleware(options: RetryMiddlewareOptions) {
  const {
    queueService,
    retryService,
    queueName = 'http-requests',
    defaultOptions = {},
    idempotencyService,
  } = options;

  // In-memory idempotency store (use Redis in production)
  const localIdempotencyStore = new Map<string, IdempotencyRecord>();
  const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of localIdempotencyStore.entries()) {
      if (now - record.createdAt.getTime() > IDEMPOTENCY_TTL_MS) {
        localIdempotencyStore.delete(key);
      }
    }
  }, 60 * 60 * 1000); // Run every hour

  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const originalJson = res.json;
    const idempotencyKey = generateIdempotencyKey(req);

    let responseSent = false;
    let responseBody: unknown;
    let responseStatusCode = 200;

    const handleResponse = (body?: unknown) => {
      if (responseSent) return;
      responseSent = true;
      responseBody = body;
    };

    res.send = function (body?: unknown): Response {
      handleResponse(body);
      return originalSend.call(this, body);
    };

    res.json = function (body?: unknown): Response {
      handleResponse(body);
      return originalJson.call(this, body);
    };

    // Store retry context on request
    (req as unknown).retryContext = {
      queueName,
      retryService,
      queueService,
      options: defaultOptions,
      idempotencyKey,
    };

    // Check idempotency BEFORE processing
    if (idempotencyService) {
      try {
        const { exists, response } = await idempotencyService.check(idempotencyKey);
        if (exists && response) {
          logger.info('Idempotent request already processed', { idempotencyKey });
          return res.status(200).json(response);
        }
      } catch (error) {
        logger.warn('Idempotency check failed, proceeding without idempotency', { idempotencyKey });
      }
    } else {
      // Use local store as fallback
      const localRecord = localIdempotencyStore.get(idempotencyKey);
      if (localRecord) {
        const age = Date.now() - localRecord.createdAt.getTime();
        if (age < IDEMPOTENCY_TTL_MS) {
          logger.info('Idempotent request already processed (local store)', { idempotencyKey });
          return res.status(localRecord.statusCode).json(localRecord.response);
        }
        localIdempotencyStore.delete(idempotencyKey);
      }
    }

    // Hook into response to store idempotency result
    const originalEnd = res.end;
    res.end = function (...args: unknown[]): Response {
      // Store idempotency result after successful processing
      if (responseBody && res.statusCode < 300) {
        if (idempotencyService) {
          idempotencyService.store(idempotencyKey, responseBody, res.statusCode).catch((err) => {
            logger.error('Failed to store idempotency record', { idempotencyKey, error: err.message });
          });
        } else {
          // Use local store as fallback
          localIdempotencyStore.set(idempotencyKey, {
            response: responseBody,
            statusCode: res.statusCode,
            createdAt: new Date(),
          });
        }
      }
      return originalEnd.apply(this, args as unknown);
    };

    next();
  };
}

/**
 * Queue a failed operation for retry
 */
export async function queueForRetry(
  req: Request,
  jobName: string,
  payload: Record<string, unknown>,
  options?: Partial<RetryOptions>
): Promise<void> {
  const context = (req as unknown).retryContext;
  if (!context) {
    throw new Error('Retry middleware not properly configured');
  }

  const { queueService, retryService, queueName } = context;
  const retryOptions = { ...context.options, ...options };

  await retryService.scheduleRetry(jobName, payload, retryOptions);
}

/**
 * Check if request is a retry attempt
 */
export function isRetryRequest(req: Request): boolean {
  const retryCount = req.headers['x-retry-count'];
  return retryCount !== undefined && parseInt(retryCount as string, 10) > 0;
}

/**
 * Get retry count from request
 */
export function getRetryCount(req: Request): number {
  const retryCount = req.headers['x-retry-count'];
  if (!retryCount) return 0;
  return parseInt(retryCount as string, 10);
}

/**
 * Add retry headers to response
 */
export function addRetryHeaders(res: Response, retryCount: number, maxRetries: number): void {
  res.setHeader('X-Retry-Count', retryCount.toString());
  res.setHeader('X-Max-Retries', maxRetries.toString());
  res.setHeader('X-Retry-Attempt', `${retryCount}/${maxRetries}`);
}

/**
 * Express error handler middleware with retry support
 */
export function retryErrorHandler(
  options: RetryMiddlewareOptions = {} as RetryMiddlewareOptions
) {
  const { retryService, queueService, queueName = 'error-retries', defaultOptions = {} } = options;

  return async (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`Error handling request ${req.path}:`, err.message);

    const retryCount = getRetryCount(req);
    const opts = { ...defaultOptions, maxRetries: defaultOptions.maxRetries || 3 };

    if (retryCount < (opts.maxRetries || 3)) {
      // Queue for retry
      await retryService.scheduleRetry(
        `error-${req.path}`,
        {
          path: req.path,
          method: req.method,
          body: req.body,
          query: req.query,
          originalError: err.message,
          retryCount: retryCount + 1,
        },
        opts,
        retryCount
      );

      addRetryHeaders(res, retryCount + 1, opts.maxRetries || 3);
      return res.status(503).json({
        error: 'Request queued for retry',
        retryCount: retryCount + 1,
        message: 'The request has been queued and will be retried',
      });
    }

    // Max retries exceeded
    return res.status(500).json({
      error: 'Request failed after maximum retries',
      message: err.message,
    });
  };
}

/**
 * Create a retryable route handler
 */
export function withRetry<T>(
  handler: (req: Request, res: Response) => Promise<T>,
  options: {
    retryable?: boolean;
    retryOptions?: Partial<RetryOptions>;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
) {
  return async (req: Request, res: Response) => {
    const retryCount = getRetryCount(req);
    const maxRetries = options.retryOptions?.maxRetries || 3;
    const retryable = options.retryable !== false;

    try {
      addRetryHeaders(res, retryCount, maxRetries);
      const result = await handler(req, res);
      return result;
    } catch (error) {
      const err = error as Error;

      if (options.onRetry) {
        options.onRetry(err, retryCount);
      }

      if (retryable && retryCount < maxRetries) {
        logger.info(`Retrying request to ${req.path}, attempt ${retryCount + 1}/${maxRetries}`);
        // The error will trigger the retry middleware to queue the request
        throw error;
      }

      throw error;
    }
  };
}

/**
 * Rate limiting middleware that uses queues for rate limit responses
 */
export function queueRateLimitedRequests(
  options: RetryMiddlewareOptions = {} as RetryMiddlewareOptions
) {
  const { queueService, queueName = 'rate-limited', retryService } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // If rate limited, queue the request
    if (res.statusCode === 429) {
      const delay = parseInt(res.getHeader('Retry-After') as string || '1000', 10);

      await queueService.addJob(queueName, `rate-limited-${req.path}`, {
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        headers: req.headers,
      }, {
        delay,
      });

      return res.status(202).json({
        message: 'Rate limited request queued for later processing',
        queuedAt: new Date().toISOString(),
      });
    }

    next();
  };
}
