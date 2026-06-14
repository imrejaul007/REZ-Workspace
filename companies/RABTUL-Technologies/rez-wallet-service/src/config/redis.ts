// Connection modes (set via environment variables):
//   Single node: REDIS_URL=redis://host:6379
//   Sentinel:    REDIS_SENTINEL_HOSTS=s1:26379,s2:26379,s3:26379
//                REDIS_SENTINEL_NAME=mymaster  (optional, default: mymaster)
//                REDIS_PASSWORD=...            (optional)
//
// When REDIS_SENTINEL_HOSTS is set, Sentinel mode is used and REDIS_URL is
// ignored for both the cache client and the BullMQ client. When it is not
// set, REDIS_URL is used (single-node fallback).

import IORedis from 'ioredis';
import { logger } from './logger';
import { randomUUID, randomInt } from 'crypto';

// SECURITY FIX: Fail at startup if REDIS_URL is not set
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is required');
}
let redisShutdownInitiated = false;

export function markRedisShutdownInitiated(): void {
  redisShutdownInitiated = true;
}

function parsedUrl() {
  try {
    return new URL(redisUrl as string);
  } catch {
    throw new Error(`Invalid REDIS_URL: ${redisUrl}`);
  }
}

const reconnectOnError = (err: Error) =>
  err.message.includes('ECONNRESET') ||
  err.message.includes('EPIPE') ||
  err.message.includes('READONLY');

const sentinelRaw = process.env.REDIS_SENTINEL_HOSTS;
const sentinels = sentinelRaw
  ? sentinelRaw.split(',').map((h) => {
      const [host, port] = h.trim().split(':');
      if (!host) throw new Error('Sentinel host cannot be empty');
      return { host, port: parseInt(port || '26379', 10) };
    })
  : undefined;
const sentinelName = process.env.REDIS_SENTINEL_NAME || 'mymaster';
const redisPassword = process.env.REDIS_PASSWORD;

// General-purpose Redis client for caching.
// retryStrategy uses exponential backoff to prevent thundering-herd reconnect storms
// when the Redis instance is at connection capacity (observed on Render free plan).
export const redis: IORedis = sentinels
  ? new IORedis({
      sentinels,
      name: sentinelName,
      password: redisPassword,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      keepAlive: 10000,
      lazyConnect: false,
      retryStrategy: (times: number) => {
        const base = Math.min(Math.pow(2, times) * 200, 15000);
        return base + randomInt(500);
      },
      reconnectOnError,
    })
  : new IORedis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      keepAlive: 10000,
      lazyConnect: false,
      password: redisPassword,
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      retryStrategy: (times: number) => {
        const base = Math.min(Math.pow(2, times) * 200, 15000);
        return base + randomInt(500);
      },
      reconnectOnError,
    });

redis.on('connect', () => logger.info('[Redis:cache] Connected'));
redis.on('ready', () => logger.info('[Redis:cache] Ready'));
redis.on('error', (err: Error) => {
  if (redisShutdownInitiated) {
    logger.info('[Redis:cache] Connection closing during shutdown');
    return;
  }
  logger.error('[Redis:cache] Error: ' + err.message);
});
redis.on('reconnecting', () => logger.warn('[Redis:cache] Reconnecting...'));
redis.on('end', () => {
  if (redisShutdownInitiated) {
    logger.info('[Redis:cache] Connection closed (shutdown)');
    return;
  }
  // WAL-023 FIX: Log as warn, not error — connection end is expected during network blips
  // and IORedis will auto-reconnect. Only error if shutdown was not intentional.
  logger.warn('[Redis:cache] Connection closed (unexpected — reconnecting)');
});

// BullMQ Redis client (needs maxRetriesPerRequest: null).
// Follows the same Sentinel/single-node selection logic as the cache client.
export const bullmqRedis: IORedis = sentinels
  ? new IORedis({
      sentinels,
      name: sentinelName,
      password: redisPassword,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      keepAlive: 10000,
      lazyConnect: false,
      retryStrategy: (times: number) => {
        const base = Math.min(Math.pow(2, times) * 200, 15000);
        return base + randomInt(1000);
      },
      reconnectOnError,
    })
  : (() => {
      const u = parsedUrl();
      return new IORedis({
        host: u.hostname || 'localhost',
        port: parseInt(u.port || '6379', 10),
        password: redisPassword || u.password || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        keepAlive: 10000,
        lazyConnect: false,
        tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
        retryStrategy: (times: number) => {
          const base = Math.min(Math.pow(2, times) * 200, 15000);
          return base + randomInt(1000);
        },
        reconnectOnError,
      });
    })();

bullmqRedis.on('connect', () => logger.info('[Redis] Connection established'));
bullmqRedis.on('ready', () => logger.info('[Redis] Connection ready'));
bullmqRedis.on('reconnecting', () => logger.warn('[Redis] Reconnecting...'));
bullmqRedis.on('error', (err: Error) => {
  if (redisShutdownInitiated) {
    logger.info('[Redis] Connection closing during shutdown');
    return;
  }
  logger.error('[Redis] Error: ' + err.message);
});
bullmqRedis.on('end', () => {
  if (redisShutdownInitiated) {
    logger.info('[Redis] Connection closed (shutdown)');
    return;
  }
  logger.error('[Redis] Connection closed');
});

// ── Pub client for cross-service pub/sub ────────────────────────────────────────────
// XS-CRIT-007 FIX: Dedicated publisher client for Redis pub/sub. Uses a separate
// connection from the cache and BullMQ clients (required by Redis — a client cannot
// both publish and subscribe on the same connection). Publishes coin credit events
// on the 'coin-credit' channel so the karma service can subscribe and update karma
// conversion records accordingly.
export const pub: IORedis = sentinels
  ? new IORedis({
      sentinels,
      name: `${sentinelName}:pub`,
      password: redisPassword,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: (times: number) => {
        const base = Math.min(Math.pow(2, times) * 200, 15000);
        return base + randomInt(500);
      },
      reconnectOnError,
    })
  : new IORedis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
      password: redisPassword,
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      retryStrategy: (times: number) => {
        const base = Math.min(Math.pow(2, times) * 200, 15000);
        return base + randomInt(500);
      },
      reconnectOnError,
    });

pub.on('connect', () => logger.info('[Redis:pub] Connected'));
pub.on('ready', () => logger.info('[Redis:pub] Ready'));
pub.on('error', (err: Error) => {
  if (redisShutdownInitiated) {
    logger.info('[Redis:pub] Connection closing during shutdown');
    return;
  }
  logger.error('[Redis:pub] Error: ' + err.message);
});
pub.on('end', () => {
  if (redisShutdownInitiated) {
    logger.info('[Redis:pub] Connection closed (shutdown)');
    return;
  }
  logger.error('[Redis:pub] Connection permanently closed');
});
