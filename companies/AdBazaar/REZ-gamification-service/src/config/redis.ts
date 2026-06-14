import IORedis from 'ioredis';
import { logger } from './logger';

// SECURITY FIX: Fail at startup if REDIS_URL is not set
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

export const bullmqRedis: IORedis = new IORedis({
  host: u.hostname,
  port: parseInt(u.port || '6379', 10),
  password: u.password || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  keepAlive: 10000,
  retryStrategy: (times: number) => {
    const base = Math.min(Math.pow(2, times) * 200, 15000);
    return Math.floor(base);
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

// GAM-LOW-01 FIX: Separate IORedis instance for application-level Redis operations.
// BullMQ uses bullmqRedis internally; app code (caching, distributed locks, DLQ
// inspection) uses appRedis. This prevents command interleaving and ensures BullMQ's
// internal state stays clean.
export const appRedis: IORedis = new IORedis({
  host: u.hostname,
  port: parseInt(u.port || '6379', 10),
  password: u.password || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const base = Math.min(Math.pow(2, times) * 200, 5000);
    return Math.floor(base);
  },
  lazyConnect: false,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
});

appRedis.on('connect', () => logger.info('[Redis/APP] Application connection established'));
appRedis.on('ready', () => logger.info('[Redis/APP] Application connection ready'));
appRedis.on('reconnecting', () => logger.warn('[Redis/APP] Application reconnecting...'));
appRedis.on('error', (err: Error) => logger.error('[Redis/APP] Error: ' + err.message));
appRedis.on('end', () => logger.warn('[Redis/APP] Application connection closed'));
