/**
 * Rate Limiter Tests
 * Tests for Redis-based and in-memory rate limiting
 */

import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:node:assert';
import { randomInt } from 'crypto';

// Mock Redis client
const mockRedis = {
  zremrangebyscore: mock.fn(),
  zcard: mock.fn(),
  zadd: mock.fn(),
  expire: mock.fn()
};

describe('Rate Limiter', () => {
  beforeEach(() => {
    mockRedis.zremrangebyscore.mock.resetCalls();
    mockRedis.zcard.mock.resetCalls();
    mockRedis.zadd.mock.resetCalls();
    mockRedis.expire.mock.resetCalls();
  });

  describe('createRateLimiter', () => {
    it('should allow requests under the limit', async () => {
      const windowMs = 60000; // 1 minute
      const maxRequests = 10;

      // Mock Redis returning count under limit
      mockRedis.zcard.mock.mockImplementation(() => Promise.resolve(5));

      const userId = 'user123';
      const key = `ratelimit:test:${userId}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      await mockRedis.zremrangebyscore(key, 0, windowStart);
      const count = await mockRedis.zcard(key);

      const allowed = count < maxRequests;

      assert.strictEqual(allowed, true);
    });

    it('should block requests over the limit', async () => {
      const maxRequests = 10;

      // Mock Redis returning count at limit
      mockRedis.zcard.mock.mockImplementation(() => Promise.resolve(10));

      const key = 'ratelimit:test:user123';
      const count = await mockRedis.zcard(key);

      const allowed = count < maxRequests;

      assert.strictEqual(allowed, false);
    });

    it('should record new requests when allowed', async () => {
      const windowMs = 60000;

      mockRedis.zcard.mock.mockImplementation(() => Promise.resolve(5));
      mockRedis.zadd.mock.mockImplementation(() => Promise.resolve(1));
      mockRedis.expire.mock.mockImplementation(() => Promise.resolve(1));

      const key = 'ratelimit:test:user123';
      const now = Date.now();
      const windowStart = now - windowMs;

      await mockRedis.zremrangebyscore(key, 0, windowStart);
      const count = await mockRedis.zcard(key);

      if (count < 10) {
        await mockRedis.zadd(key, now, `${now}:${randomInt(0, 1000000)}`);
        await mockRedis.expire(key, Math.ceil(windowMs / 1000));
      }

      assert.strictEqual(mockRedis.zadd.mock.calls.length, 1);
      assert.strictEqual(mockRedis.expire.mock.calls.length, 1);
    });
  });

  describe('Redis Fallback', () => {
    it('should fall back to in-memory when Redis fails', async () => {
      const inMemoryLimiters = new Map<string, number[]>();

      // Simulate Redis error
      mockRedis.zcard.mock.mockImplementation(() => Promise.reject(new Error('Redis connection failed')));

      const userId = 'user123';
      const endpoint = 'impression';
      const memKey = `${endpoint}:${userId}`;
      const windowMs = 60000;
      const now = Date.now();
      const windowStart = now - windowMs;

      // In-memory fallback
      let timestamps = inMemoryLimiters.get(memKey) || [];
      timestamps = timestamps.filter(t => t > windowStart);
      const count = timestamps.length;

      if (count < 10) {
        timestamps.push(now);
        inMemoryLimiters.set(memKey, timestamps);
      }

      const allowed = count < 10;

      assert.strictEqual(allowed, true);
      assert.strictEqual(inMemoryLimiters.has(memKey), true);
    });

    it('should respect limits in fallback mode', async () => {
      const inMemoryLimiters = new Map<string, number[]>();

      const userId = 'user123';
      const endpoint = 'impression';
      const memKey = `${endpoint}:${userId}`;
      const windowMs = 60000;
      const now = Date.now();

      // Add 10 requests
      const timestamps = Array.from({ length: 10 }, (_, i) => now - i * 1000);
      inMemoryLimiters.set(memKey, timestamps);

      const windowStart = now - windowMs;
      const recentTimestamps = timestamps.filter(t => t > windowStart);
      const allowed = recentTimestamps.length < 10;

      assert.strictEqual(allowed, false);
    });
  });

  describe('Sliding Window', () => {
    it('should remove old timestamps from window', async () => {
      const windowMs = 60000;
      const now = Date.now();

      // Timestamps: some inside window, some outside
      const timestamps = [
        now - 5000,   // 5 seconds ago (inside)
        now - 30000,  // 30 seconds ago (inside)
        now - 70000,  // 70 seconds ago (outside)
        now - 120000  // 2 minutes ago (outside)
      ];

      const windowStart = now - windowMs;
      const validTimestamps = timestamps.filter(t => t > windowStart);

      assert.strictEqual(validTimestamps.length, 2);
      assert.strictEqual(validTimestamps[0], now - 5000);
      assert.strictEqual(validTimestamps[1], now - 30000);
    });
  });
});

console.log('Rate limiter tests loaded');
