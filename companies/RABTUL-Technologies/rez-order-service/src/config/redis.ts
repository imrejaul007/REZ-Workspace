import IORedis from 'ioredis';
import { logger } from './logger';
import { randomUUID, randomInt } from 'crypto';

// SECURITY FIX: Fail at startup instead of silently falling back to localhost
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is required');
}

function parsedUrl() {
  try {
    return new URL(redisUrl as string);
  } catch {
    throw new Error(`Invalid REDIS_URL: ${redisUrl}`);
  }
}

const u = parsedUrl();

export const bullmqRedis: unknown = new IORedis({
  host: u.hostname,
  port: parseInt(u.port || '6379', 10),
  password: u.password || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  keepAlive: 10000,
  retryStrategy: (times: number) => {
    const base = Math.min(Math.pow(2, times) * 200, 15000);
    // SECURITY FIX (ORDER-RAND-001): Use crypto.randomInt for retry jitter.
    return Math.floor(base + randomInt(1000));
  },
  reconnectOnError: (err: Error) => {
    return err.message.includes('ECONNRESET') || err.message.includes('EPIPE') || err.message.includes('READONLY');
  },
  lazyConnect: false,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
});

bullmqRedis.on('connect', () => logger.info('[Redis] Connection established'));
bullmqRedis.on('ready', () => logger.info('[Redis] Connection ready'));
bullmqRedis.on('reconnecting', () => logger.warn('[Redis] Reconnecting...'));
bullmqRedis.on('error', (err: Error) => logger.error('[Redis] Error: ' + err.message));
bullmqRedis.on('end', () => logger.error('[Redis] Connection closed'));

// M15 FIX: Separate Redis connection for BullMQ workers.
// BullMQ documentation recommends NOT sharing connections between the main app and workers.
// Previously the worker used bullmqRedis (same connection as Express app), which could
// cause connection exhaustion under load. Now worker.ts uses workerRedis, leaving bullmqRedis
// for app-level operations (locks, blacklists, SSE tracking).
export const workerRedis = new IORedis({
  host: u.hostname,
  port: parseInt(u.port || '6379', 10),
  password: u.password || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  keepAlive: 10000,
  retryStrategy: (times: number) => {
    const base = Math.min(Math.pow(2, times) * 200, 15000);
    return Math.floor(base + randomInt(1000));
  },
  reconnectOnError: (err: Error) => {
    return err.message.includes('ECONNRESET') || err.message.includes('EPIPE') || err.message.includes('READONLY');
  },
  lazyConnect: false,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
});

workerRedis.on('connect', () => logger.info('[Redis Worker] Connection established'));
workerRedis.on('ready', () => logger.info('[Redis Worker] Connection ready'));
workerRedis.on('reconnecting', () => logger.warn('[Redis Worker] Reconnecting...'));
workerRedis.on('error', (err: Error) => logger.error('[Redis Worker] Error: ' + err.message));
workerRedis.on('end', () => logger.error('[Redis Worker] Connection closed'));
