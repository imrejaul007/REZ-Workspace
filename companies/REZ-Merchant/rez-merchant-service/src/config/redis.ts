import IORedis from 'ioredis';
import { logger } from './logger';

// REDIS_URL is a required env var (validated in env.ts).
// No fallback here — if REDIS_URL is missing the process should fail at startup.
const redisUrl = process.env.REDIS_URL!;

// MEDIUM FIX: Added retry strategy and connection timeouts for Redis resilience
export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  keepAlive: 10000,
  lazyConnect: true,
  connectTimeout: 5000,
  commandTimeout: 3000,
  tls: redisUrl.startsWith('rediss://') ? {} : undefined,
  retryStrategy: (times: number) => {
    if (times > 10) {
      logger.error('[Redis] Max retry attempts reached, giving up');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 100, 3000);
    logger.warn(`[Redis] Reconnecting in ${delay}ms (attempt ${times}/10)`);
    return delay;
  },
  reconnectOnError: (err: Error) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some(e => err.message.includes(e));
  },
});

redis.on('connect', () => logger.info('[Redis] Connected'));
redis.on('ready', () => logger.info('[Redis] Ready'));
redis.on('reconnecting', () => logger.warn('[Redis] Reconnecting...'));
redis.on('error', (err: Error) => logger.error('[Redis] Error', { error: err.message }));

export async function ensureRedisConnected(): Promise<void> {
  if (redis.status === 'ready' || redis.status === 'connecting' || redis.status === 'connect') return;
  await redis.connect();
}

// Cache helpers
const CACHE_PREFIX = 'merch:';

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    await ensureRedisConnected();
    const val = await redis.get(`${CACHE_PREFIX}${key}`);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
  try {
    await ensureRedisConnected();
    await redis.set(`${CACHE_PREFIX}${key}`, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {}
}

export async function cacheDel(pattern: string): Promise<void> {
  try {
    await ensureRedisConnected();
    // SCAN is O(1) per iteration — does NOT block Redis like KEYS which is O(N).
    // KEYS on large keyspaces can freeze Redis for seconds, causing production incidents.
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        `${CACHE_PREFIX}${pattern}`,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  } catch {}
}
