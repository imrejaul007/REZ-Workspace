import IORedis from 'ioredis';
import crypto from 'crypto';
import { logger } from './logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  keepAlive: 10000,
  retryStrategy: (times: number) => {
    const base = Math.min(times * 200, 5000);
    const jitter = crypto.randomInt(0, 500); // FIX VULN-6: crypto instead of Math.random()
    return base + jitter;
  },
  reconnectOnError: (err: Error) => {
    return err.message.includes('ECONNRESET') || err.message.includes('EPIPE') || err.message.includes('READONLY');
  },
});

redis.on('error', (err) => logger.error('[Redis] Error: ' + err.message));
redis.on('connect', () => logger.info('[Redis] Connection established'));
redis.on('ready', () => logger.info('[Redis] Connection ready'));
redis.on('reconnecting', () => logger.warn('[Redis] Reconnecting...'));

// SEA-006 FIX: Cache invalidation pub/sub channel.
// When rez-backend mutates stores/products/categories, it publishes an invalidation
// event here. The subscriber in index.ts uses a separate connection to listen so
// that long-running commands (e.g. BLPOP) don't block pub/sub messages.
export const CACHE_INVALIDATE_CHANNEL = 'catalog:invalidate';

// Supported entity types and a wildcard pattern for flushing all keys of a type.
// Patterns are evaluated with SCAN (batched, non-blocking) to avoid blocking Redis.
export const CACHE_INVALIDATION_PATTERNS: Record<string, string> = {
  store:     'search:stores*',
  product:   'search:products*',
  trending:  'search:trending*',
  autocomplete: 'search:autocomplete_v2*',
  filters:   'search:productFilters*',
  home:      'search:home*',
  // Wildcard — published when full catalog reindex is needed
  all:       'search:*',
};
