/**
 * Redis Configuration for Pub/Sub
 * Uses separate clients for publishing and subscribing
 */

import IORedis from 'ioredis';
import { env } from './services.js';

// Main Redis client for general operations
export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(Math.pow(2, times) * 200, 15000),
});

// Dedicated publisher client for pub/sub
export const pub = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(Math.pow(2, times) * 200, 15000),
});

// Subscriber client (separate connection required for subscribe)
export const sub = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(Math.pow(2, times) * 200, 15000),
});

// Redis channels for loyalty events
export const LOYALTY_CHANNELS = {
  COIN_EARNED: 'loyalty:coin:earned',
  COIN_REDEEMED: 'loyalty:coin:redeemed',
  COIN_EXPIRED: 'loyalty:coin:expired',
  COIN_TRANSFERRED: 'loyalty:coin:transferred',
  TIER_CHANGED: 'loyalty:tier:changed',
  SYNC_REQUEST: 'loyalty:sync:request',
  SYNC_RESPONSE: 'loyalty:sync:response',
} as const;

// Cache keys
export const CACHE_KEYS = {
  BALANCE: (userId: string) => `loyalty:balance:${userId}`,
  TIER: (userId: string) => `loyalty:tier:${userId}`,
  SYNC_STATUS: (userId: string) => `loyalty:sync:status:${userId}`,
} as const;

// TTL values
export const CACHE_TTL = {
  BALANCE: parseInt(env.SYNC_CACHE_TTL) || 300, // 5 minutes
  TIER: 3600, // 1 hour
  SYNC_STATUS: 60, // 1 minute
};

// Connect all clients
export async function connectRedis(): Promise<void> {
  await Promise.all([
    redis.connect(),
    pub.connect(),
    sub.connect(),
  ]);
}

// Disconnect all clients
export async function disconnectRedis(): Promise<void> {
  await Promise.all([
    redis.quit(),
    pub.quit(),
    sub.quit(),
  ]);
}

// Health check
export async function redisHealthCheck(): Promise<{ status: string; latency?: number }> {
  const start = Date.now();
  try {
    await redis.ping();
    return { status: 'healthy', latency: Date.now() - start };
  } catch (error) {
    return { status: 'unhealthy' };
  }
}
