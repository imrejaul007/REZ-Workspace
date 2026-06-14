import { Injectable, Logger } from '@nestjs/common';
import crypto from 'crypto';
import { RedisService } from './redis.service';

export interface RateLimitOptions {
  key: string;
  limit: number; // Max requests
  window: number; // Time window in seconds
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when limit resets
  retryAfter?: number; // Seconds to wait if blocked
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Check if request is allowed under rate limit
   * Uses sliding window log algorithm with Redis sorted sets
   */
  async checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
    const { key, limit, window, skipSuccessfulRequests = false, skipFailedRequests = false } = options;

    try {
      const now = Date.now();
      const windowStart = now - (window * 1000);
      const cacheKey = `rate_limit:${key}`;

      // Remove expired entries and count current requests in sliding window
      const pipeline = this.redis.getClient().multi();

      // Remove requests older than the window
      pipeline.zremrangebyscore(cacheKey, 0, windowStart);

      // Count current requests in window
      pipeline.zcard(cacheKey);

      // Add current request timestamp
      pipeline.zadd(cacheKey, now, `${now}-${crypto.randomInt(0, 999999)}`);

      // Set expiration
      pipeline.expire(cacheKey, window * 2); // Keep data longer than window for cleanup

      const results = await pipeline.exec();
      const currentRequests = results?.[1]?.[1] as number || 0;

      const allowed = currentRequests < limit;
      const remaining = Math.max(0, limit - currentRequests - 1);
      const reset = Math.ceil(now / 1000) + window;

      const result: RateLimitResult = {
        allowed,
        limit,
        remaining,
        reset,
      };

      if (!allowed) {
        // Calculate retry after based on oldest request in window
        const oldestInWindow = await this.redis.getClient()
          .zrange(cacheKey, 0, 0, 'WITHSCORES');

        if (oldestInWindow.length > 0) {
          const oldestTimestamp = parseFloat(oldestInWindow[1]);
          const retryAfter = Math.ceil((oldestTimestamp + (window * 1000) - now) / 1000);
          result.retryAfter = Math.max(1, retryAfter);
        } else {
          result.retryAfter = window;
        }

        this.logger.warn(`Rate limit exceeded for key: ${key} (${currentRequests}/${limit})`);
      }

      this.logger.debug(`Rate limit check for ${key}: ${currentRequests}/${limit}, allowed: ${allowed}`);

      return result;
    } catch (error) {
      this.logger.error(`Rate limiter error for key ${key}:`, error);

      // Security-critical endpoints: fail closed
      const isSecurityEndpoint = key?.includes('auth') ||
        key?.includes('login') ||
        key?.includes('signup') ||
        key?.includes('password') ||
        key?.includes('payment') ||
        key?.includes('admin') ||
        key?.includes('api_key') ||
        key?.includes('token') ||
        key?.includes('refresh');

      if (isSecurityEndpoint) {
        this.logger.warn(`Rate limiter failing CLOSED for security endpoint: ${key}`);
        return {
          allowed: false,
          limit,
          remaining: 0,
          reset: Math.ceil(Date.now() / 1000) + window,
          retryAfter: window,
        };
      }

      // Fail open only for non-critical endpoints
      this.logger.warn(`Rate limiter failing OPEN for non-critical endpoint: ${key}`);
      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        reset: Math.ceil(Date.now() / 1000) + window,
      };
    }
  }

  /**
   * Remove rate limit entry (useful for successful requests that shouldn't count)
   */
  async removeLastRequest(key: string): Promise<void> {
    try {
      const cacheKey = `rate_limit:${key}`;

      // Remove the most recent request
      await this.redis.getClient().zpopmax(cacheKey);

      this.logger.debug(`Removed last request from rate limit key: ${key}`);
    } catch (error) {
      this.logger.error(`Error removing last request for key ${key}:`, error);
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(key: string, limit: number, window: number): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const windowStart = now - (window * 1000);
      const cacheKey = `rate_limit:${key}`;

      // Clean and count current requests
      await this.redis.getClient().zremrangebyscore(cacheKey, 0, windowStart);
      const currentRequests = await this.redis.getClient().zcard(cacheKey);

      const remaining = Math.max(0, limit - currentRequests);
      const reset = Math.ceil(now / 1000) + window;

      return {
        allowed: currentRequests < limit,
        limit,
        remaining,
        reset,
      };
    } catch (error) {
      this.logger.error(`Error getting rate limit status for key ${key}:`, error);

      return {
        allowed: true,
        limit,
        remaining: limit,
        reset: Math.ceil(Date.now() / 1000) + window,
      };
    }
  }

  /**
   * Clear rate limit for a specific key
   */
  async clearRateLimit(key: string): Promise<void> {
    try {
      const cacheKey = `rate_limit:${key}`;
      await this.redis.del(cacheKey);

      this.logger.debug(`Cleared rate limit for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error clearing rate limit for key ${key}:`, error);
    }
  }

  /**
   * Generate rate limit key based on IP, user, or custom identifier
   */
  generateKey(identifier: string, prefix: string = 'default'): string {
    return `${prefix}:${identifier}`;
  }

  /**
   * Get rate limit statistics
   */
  async getStats(keyPattern: string = '*'): Promise<{
    activeKeys: number;
    totalRequests: number;
    blockedRequests: number;
  }> {
    try {
      const pattern = `rate_limit:${keyPattern}`;
      const keys = await this.redis.getClient().keys(pattern);

      let totalRequests = 0;
      let blockedRequests = 0;

      for (const key of keys) {
        const count = await this.redis.getClient().zcard(key);
        totalRequests += count;

        // Estimate blocked requests (simplified)
        if (count > 100) { // Assume high count indicates some blocks
          blockedRequests += Math.floor(count * 0.1);
        }
      }

      return {
        activeKeys: keys.length,
        totalRequests,
        blockedRequests,
      };
    } catch (error) {
      this.logger.error('Error getting rate limit stats:', error);
      return {
        activeKeys: 0,
        totalRequests: 0,
        blockedRequests: 0,
      };
    }
  }
}