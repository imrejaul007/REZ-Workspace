// Connection modes (set via environment variables):
//   Single node: REDIS_URL=redis://host:6379
//   Sentinel:    REDIS_SENTINEL_HOSTS=s1:26379,s2:26379,s3:26379
//                REDIS_SENTINEL_NAME=mymaster  (optional, default: mymaster)
//                REDIS_PASSWORD=...            (optional)
//
// When REDIS_SENTINEL_HOSTS is set, Sentinel mode is used and REDIS_URL is
// ignored. When it is not set, REDIS_URL is used (single-node fallback).

import IORedis from 'ioredis';
import { logger } from './logger';

function createRedisClient(): IORedis {
  const sentinelRaw = process.env.REDIS_SENTINEL_HOSTS;
  const retryStrategy = (times: number) => {
    const base = Math.min(times * 200, 5000);
    return Math.floor(base);
  };
  const reconnectOnError = (err: Error) =>
    err.message.includes('ECONNRESET') ||
    err.message.includes('EPIPE') ||
    err.message.includes('READONLY');

  // SECURITY FIX: Validate sentinel hosts format
  if (sentinelRaw) {
    const sentinels = sentinelRaw.split(',').map((h) => {
      const [host, port] = h.trim().split(':');
      if (!host) throw new Error('Sentinel host cannot be empty');
      return { host, port: parseInt(port || '26379', 10) };
    });
    return new IORedis({
      sentinels,
      name: process.env.REDIS_SENTINEL_NAME || 'mymaster',
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      keepAlive: 10000,
      retryStrategy,
      reconnectOnError,
    });
  }

  // SECURITY FIX: Fail at startup if REDIS_URL is not set
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) throw new Error('REDIS_URL is required');

  const isProduction = process.env.NODE_ENV === 'production';
  const useTLS = process.env.REDIS_TLS === 'true' || (isProduction && !sentinelRaw);

  return new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    keepAlive: 10000,
    password: process.env.REDIS_PASSWORD,
    retryStrategy,
    reconnectOnError,
    // SECURITY FIX: Enforce TLS in production
    ...(useTLS && {
      tls: {
        minVersion: 'TLSv1.2',
      },
    }),
  });
}

export const redis = createRedisClient();

/** PAY-009 FIX: Export host and port directly so callers do not need (redis as unknown).options. */
export const redisHost: string = process.env.REDIS_URL
  ? (() => {
      try {
        const u = new URL(process.env.REDIS_URL);
        return u.hostname || 'localhost';
      } catch {
        return 'localhost';
      }
    })()
  : 'localhost';
export const redisPort: number = process.env.REDIS_URL
  ? (() => {
      try {
        const u = new URL(process.env.REDIS_URL);
        return parseInt(u.port || '6379', 10);
      } catch {
        return 6379;
      }
    })()
  : 6379;

redis.on('error', (err) => logger.error('[Redis] Error: ' + err.message));
redis.on('connect', () => logger.info('[Redis] Connection established'));
redis.on('ready', () => logger.info('[Redis] Connection ready'));
redis.on('reconnecting', () => logger.warn('[Redis] Reconnecting...'));
