/**
 * Redis Client for Safe QR Service
 * Used for OTP, sessions, and rate limiting
 */

import Redis from 'ioredis';
import { config } from '../config';

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('[Redis] Max retries reached, giving up');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      logger.info('[Redis] Connected to', config.redisUrl);
    });

    redis.on('error', (err) => {
      logger.error('[Redis] Connection error:', err.message);
    });

    redis.on('close', () => {
      logger.info('[Redis] Connection closed');
    });
  }

  return redis;
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  try {
    await client.connect();
    logger.info('[Redis] Successfully connected');
  } catch (error) {
    logger.error('[Redis] Failed to connect:', error);
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('[Redis] Disconnected');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OTP STORAGE (Redis)
// ═══════════════════════════════════════════════════════════════════════════════

const OTP_PREFIX = 'otp:';
const OTP_TTL = 600; // 10 minutes

export async function storeOtp(phone: string, otp: string, otpId: string): Promise<void> {
  const client = getRedisClient();
  const key = `${OTP_PREFIX}${phone}`;
  const data = JSON.stringify({ otp, otpId, attempts: 0, createdAt: Date.now() });
  await client.setex(key, OTP_TTL, data);
}

export async function getOtp(phone: string): Promise<{ otp: string; otpId: string; attempts: number } | null> {
  const client = getRedisClient();
  const key = `${OTP_PREFIX}${phone}`;
  const data = await client.get(key);
  if (!data) return null;

  const parsed = JSON.parse(data);
  return {
    otp: parsed.otp,
    otpId: parsed.otpId,
    attempts: parsed.attempts || 0,
  };
}

export async function deleteOtp(phone: string): Promise<void> {
  const client = getRedisClient();
  const key = `${OTP_PREFIX}${phone}`;
  await client.del(key);
}

export async function incrementOtpAttempts(phone: string): Promise<number> {
  const client = getRedisClient();
  const key = `${OTP_PREFIX}${phone}`;
  const data = await client.get(key);
  if (!data) return 0;

  const parsed = JSON.parse(data);
  parsed.attempts = (parsed.attempts || 0) + 1;
  const ttl = await client.ttl(key);
  if (ttl > 0) {
    await client.setex(key, ttl, JSON.stringify(parsed));
  }
  return parsed.attempts;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION STORAGE (Redis)
// ═══════════════════════════════════════════════════════════════════════════════

const SESSION_PREFIX = 'session:';
const SESSION_TTL = 604800; // 7 days

export async function storeSession(token: string, sessionData: Record<string, unknown>): Promise<void> {
  const client = getRedisClient();
  const key = `${SESSION_PREFIX}${token}`;
  const data = JSON.stringify({
    ...sessionData,
    createdAt: Date.now(),
  });
  await client.setex(key, SESSION_TTL, data);
}

export async function getSession(token: string): Promise<Record<string, unknown> | null> {
  const client = getRedisClient();
  const key = `${SESSION_PREFIX}${token}`;
  const data = await client.get(key);
  if (!data) return null;
  return JSON.parse(data);
}

export async function deleteSession(token: string): Promise<void> {
  const client = getRedisClient();
  const key = `${SESSION_PREFIX}${token}`;
  await client.del(key);
}

export async function refreshSession(token: string): Promise<void> {
  const client = getRedisClient();
  const key = `${SESSION_PREFIX}${token}`;
  await client.expire(key, SESSION_TTL);
}

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITING HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const RATE_PREFIX = 'rate:';

export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const client = getRedisClient();
  const fullKey = `${RATE_PREFIX}${key}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  // Remove old entries
  await client.zremrangebyscore(fullKey, 0, windowStart);

  // Count current requests
  const count = await client.zcard(fullKey);

  if (count >= limit) {
    const oldestEntry = await client.zrange(fullKey, 0, 0, 'WITHSCORES');
    const resetAt = oldestEntry.length >= 2 ? parseInt(oldestEntry[1], 10) + windowSeconds : now + windowSeconds;
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Add new entry
  await client.zadd(fullKey, now, `${now}:${Math.random()}`);
  await client.expire(fullKey, windowSeconds);

  return {
    allowed: true,
    remaining: limit - count - 1,
    resetAt: now + windowSeconds,
  };
}
