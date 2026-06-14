/**
 * REZ Atlas GTM - Redis Caching Module
 * Redis-based caching with fallback to in-memory storage
 */

const { v4: uuidv4 } = require('uuid');

// Redis client (lazy initialization)
let redisClient = null;
let isRedisConnected = false;

// In-memory fallback cache
const memoryCache = new Map();
const cacheMetadata = new Map();

// ============================================
// REDIS CLIENT
// ============================================

/**
 * Initialize Redis connection
 */
async function connectRedis(options = {}) {
  const {
    host = process.env.REDIS_HOST || 'localhost',
    port = parseInt(process.env.REDIS_PORT || '6379'),
    password = process.env.REDIS_PASSWORD,
    db = parseInt(process.env.REDIS_DB || '0'),
    url = process.env.REDIS_URL
  } = options;

  try {
    // Try to use ioredis if available
    let Redis;
    try {
      Redis = require('ioredis');
    } catch (e) {
      console.log('[CACHE] ioredis not available, using memory fallback');
      return false;
    }

    const config = url ? { url } : { host, port, password, db };

    redisClient = new Redis(config);

    redisClient.on('connect', () => {
      console.log('[CACHE] Redis connected');
      isRedisConnected = true;
    });

    redisClient.on('error', (err) => {
      console.error('[CACHE] Redis error:', err.message);
      isRedisConnected = false;
    });

    redisClient.on('close', () => {
      console.log('[CACHE] Redis connection closed');
      isRedisConnected = false;
    });

    // Test connection
    await redisClient.ping();
    isRedisConnected = true;

    return true;
  } catch (error) {
    console.log('[CACHE] Redis connection failed, using memory fallback:', error.message);
    isRedisConnected = false;
    return false;
  }
}

/**
 * Disconnect Redis
 */
async function disconnectRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isRedisConnected = false;
  }
}

/**
 * Check if Redis is available
 */
function isRedisAvailable() {
  return isRedisConnected && redisClient !== null;
}

/**
 * Get Redis client
 */
function getRedisClient() {
  return redisClient;
}

// ============================================
// MEMORY CACHE HELPERS
// ============================================

/**
 * Memory cache set with TTL
 */
function memorySet(key, value, ttlMs) {
  const ttl = ttlMs || 3600000; //1 hour default
 const expiresAt = Date.now() + ttl;

  memoryCache.set(key, {
    value,
    expiresAt,
    createdAt: Date.now()
  });

  // Clean up expired entries periodically
  if (memoryCache.size > 10000) {
    cleanupMemoryCache();
  }
}

/**
 * Memory cache get
 */
function memoryGet(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return entry.value;
}

/**
 * Memory cache delete
 */
function memoryDelete(key) {
  return memoryCache.delete(key);
}

/**
 * Memory cache exists
 */
function memoryExists(key) {
  const entry = memoryCache.get(key);
  if (!entry) return false;

  if (entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return false;
  }

  return true;
}

/**
 * Clean up expired memory cache entries
 */
function cleanupMemoryCache() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt < now) {
      memoryCache.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

// ============================================
// CACHE OPERATIONS
// ============================================

/**
 * Set cache value
 */
async function set(key, value, options = {}) {
  const {
    ttl = 3600,           // TTL in seconds
    compress = false
  } = options;

  const ttlMs = ttl * 1000;
  const serialized = compress ? JSON.stringify(value) : JSON.stringify(value);

  if (isRedisAvailable()) {
    await redisClient.setex(key, ttl, serialized);
  } else {
    memorySet(key, value, ttlMs);
  }

  // Update metadata
  cacheMetadata.set(key, {
    ttl,
    compressed,
    setAt: new Date().toISOString()
  });

  return true;
}

/**
 * Get cache value
 */
async function get(key) {
  let data;

  if (isRedisAvailable()) {
    data = await redisClient.get(key);
  } else {
    data = memoryGet(key);
  }

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}

/**
 * Delete cache value
 */
async function del(key) {
  cacheMetadata.delete(key);

  if (isRedisAvailable()) {
    return await redisClient.del(key);
  } else {
    return memoryDelete(key);
  }
}

/**
 * Check if key exists
 */
async function exists(key) {
  if (isRedisAvailable()) {
    const result = await redisClient.exists(key);
    return result === 1;
  } else {
    return memoryExists(key);
  }
}

/**
 * Set multiple values
 */
async function mset(keyValuePairs, options = {}) {
  const { ttl = 3600 } = options;

  if (isRedisAvailable()) {
    const pipeline = redisClient.pipeline();

    for (const [key, value] of Object.entries(keyValuePairs)) {
      pipeline.setex(key, ttl, JSON.stringify(value));
    }

    await pipeline.exec();
  } else {
    for (const [key, value] of Object.entries(keyValuePairs)) {
      memorySet(key, value, ttl * 1000);
    }
  }

  return true;
}

/**
 * Get multiple values
 */
async function mget(keys) {
  if (isRedisAvailable()) {
    const values = await redisClient.mget(keys);
    return values.map(v => v ? JSON.parse(v) : null);
  } else {
    return keys.map(k => memoryGet(k));
  }
}

/**
 * Get keys matching pattern
 */
async function keys(pattern = '*') {
  if (isRedisAvailable()) {
    return await redisClient.keys(pattern);
  } else {
    // Simple pattern matching for memory cache
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(memoryCache.keys()).filter(k => regex.test(k));
  }
}

/**
 * Delete keys matching pattern
 */
async function delByPattern(pattern) {
  const matchingKeys = await keys(pattern);
  let deleted = 0;

  for (const key of matchingKeys) {
    await del(key);
    deleted++;
  }

  return deleted;
}

// ============================================
// CACHE HELPERS
// ============================================

/**
 * Cache-aside pattern: get from cache or fetch and cache
 */
async function getOrFetch(key, fetchFn, options = {}) {
  const { ttl = 3600, staleWhileRevalidating = 300 } = options;

  // Try cache first
  const cached = await get(key);
  if (cached) {
    return { data: cached, source: 'cache', stale: false };
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Cache the result
  if (data !== undefined && data !== null) {
    await set(key, data, { ttl });
  }

  return { data, source: 'fetch', stale: false };
}

/**
 * Invalidate cache and refetch
 */
async function invalidateAndFetch(key, fetchFn, options = {}) {
  await del(key);
  const data = await fetchFn();

  if (data !== undefined && data !== null) {
    await set(key, data, options);
  }

  return data;
}

/**
 * Increment counter
 */
async function incr(key, amount = 1) {
  if (isRedisAvailable()) {
    return await redisClient.incrby(key, amount);
  } else {
    const current = parseInt(memoryGet(key) || '0');
    const newValue = current + amount;
    memorySet(key, newValue.toString(), 86400000); // 24 hours
    return newValue;
  }
}

/**
 * Decrement counter
 */
async function decr(key, amount = 1) {
  return incr(key, -amount);
}

/**
 * Set with NX (only if not exists)
 */
async function setNX(key, value, options = {}) {
  const { ttl = 3600 } = options;

  if (isRedisAvailable()) {
    const result = await redisClient.setnx(key, JSON.stringify(value));
    if (result === 1) {
      await redisClient.expire(key, ttl);
    }
    return result === 1;
  } else {
    if (!memoryExists(key)) {
      memorySet(key, value, ttl * 1000);
      return true;
    }
    return false;
  }
}

/**
 * Set with EX (with expiration)
 */
async function setEX(key, value, seconds) {
  return set(key, value, { ttl: seconds });
}

/**
 * Get TTL
 */
async function ttl(key) {
  if (isRedisAvailable()) {
    return await redisClient.ttl(key);
  } else {
    const entry = memoryCache.get(key);
    if (!entry) return -2;
    return Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
  }
}

// ============================================
// CACHE REGIONS
// ============================================

const CACHE_KEYS = {
  PROSPECT: 'prospect',
  CAMPAIGN: 'campaign',
  SEQUENCE: 'sequence',
  ANALYTICS: 'analytics',
  USER: 'user',
  SESSION: 'session'
};

/**
 * Cache prospect data
 */
async function cacheProspect(prospectId, data, ttl = 1800) {
  return set(`${CACHE_KEYS.PROSPECT}:${prospectId}`, data, { ttl });
}

/**
 * Get cached prospect
 */
async function getCachedProspect(prospectId) {
  return get(`${CACHE_KEYS.PROSPECT}:${prospectId}`);
}

/**
 * Invalidate prospect cache
 */
async function invalidateProspect(prospectId) {
  return del(`${CACHE_KEYS.PROSPECT}:${prospectId}`);
}

/**
 * Cache campaign data
 */
async function cacheCampaign(campaignId, data, ttl = 900) {
  return set(`${CACHE_KEYS.CAMPAIGN}:${campaignId}`, data, { ttl });
}

/**
 * Get cached campaign
 */
async function getCachedCampaign(campaignId) {
  return get(`${CACHE_KEYS.CAMPAIGN}:${campaignId}`);
}

/**
 * Invalidate campaign cache
 */
async function invalidateCampaign(campaignId) {
  return del(`${CACHE_KEYS.CAMPAIGN}:${campaignId}`);
}

/**
 * Cache analytics data
 */
async function cacheAnalytics(key, data, ttl = 300) {
  return set(`${CACHE_KEYS.ANALYTICS}:${key}`, data, { ttl });
}

/**
 * Get cached analytics
 */
async function getCachedAnalytics(key) {
  return get(`${CACHE_KEYS.ANALYTICS}:${key}`);
}

/**
 * Invalidate all analytics cache
 */
async function invalidateAnalytics() {
  return delByPattern(`${CACHE_KEYS.ANALYTICS}:*`);
}

// ============================================
// CACHE UTILITIES
// ============================================

/**
 * Wrap function with caching
 */
function withCache(fn, keyFn, options = {}) {
  const { ttl = 3600, keyPrefix = 'fn' } = options;

  return async (...args) => {
    const key = keyFn ? keyFn(...args) : `${keyPrefix}:${JSON.stringify(args)}`;

    const cached = await get(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn(...args);
    if (result !== undefined && result !== null) {
      await set(key, result, { ttl });
    }

    return result;
  };
}

/**
 * Memoize function results
 */
function memoize(fn, options = {}) {
  const { ttl = 3600, maxSize = 1000 } = options;
  const cache = new Map();

  return async (...args) => {
    const key = JSON.stringify(args);

    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const result = await fn(...args);

    // Evict oldest if at capacity
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    cache.set(key, {
      value: result,
      expiresAt: Date.now() + (ttl * 1000)
    });

    return result;
  };
}

// ============================================
// CACHE STATS
// ============================================

/**
 * Get cache statistics
 */
async function getStats() {
  const stats = {
    backend: isRedisAvailable() ? 'redis' : 'memory',
    memory: {
      size: memoryCache.size,
      keys: memoryCache.size
    },
    metadata: {
      entries: cacheMetadata.size
    }
  };

  if (isRedisAvailable()) {
    try {
      const info = await redisClient.info('memory');
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      stats.redis = {
        memory: memoryMatch ? memoryMatch[1] : 'unknown',
        connected: true
      };
    } catch (e) {
      stats.redis = { connected: false };
    }
  }

  return stats;
}

/**
 * Get cache health
 */
async function getHealth() {
  if (isRedisAvailable()) {
    try {
      await redisClient.ping();
      return { status: 'healthy', backend: 'redis' };
    } catch (e) {
      return { status: 'unhealthy', backend: 'redis', error: e.message };
    }
  }

  return { status: 'healthy', backend: 'memory' };
}

/**
 * Clear all cache
 */
async function clearAll() {
  if (isRedisAvailable()) {
    await redisClient.flushdb();
  }

  memoryCache.clear();
  cacheMetadata.clear();

  return true;
}

/**
 * Get cache size
 */
async function getSize() {
  if (isRedisAvailable()) {
    const keys = await redisClient.dbsize();
    return keys;
  }

  return memoryCache.size;
}

// ============================================
// CACHE MIDDLEWARE
// ============================================

/**
 * Create cache middleware for Express
 */
function cacheMiddleware(options = {}) {
  const {
    ttl = 300,
    cacheKeyFn,
    shouldCacheFn = () => true,
    varyBy = ['Accept']
  } = options;

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if should cache
    if (!shouldCacheFn(req)) {
      return next();
    }

    // Generate cache key
    const baseKey = cacheKeyFn ? cacheKeyFn(req) : req.originalUrl;
    const varyHeaders = varyBy.map(h => req.headers[h.toLowerCase()] || '').join(':');
    const cacheKey = `http:${baseKey}:${varyHeaders}`;

    // Try to get from cache
    const cached = await get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Capture response
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      if (res.statusCode === 200) {
        await set(cacheKey, data, { ttl });
        res.setHeader('X-Cache', 'MISS');
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * Invalidate cache middleware
 */
function invalidateMiddleware(patterns) {
  return async (req, res, next) => {
    // Capture original end
    const originalEnd = res.end;
    const originalJson = res.json;

    res.end = async function () {
      // Invalidate on successful mutations
      if (req.method !== 'GET' && res.statusCode >= 200 && res.statusCode < 300) {
        for (const pattern of patterns) {
          await delByPattern(pattern);
        }
      }
      return originalEnd.apply(this, arguments);
    };

    next();
  };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Connection
  connectRedis,
  disconnectRedis,
  isRedisAvailable,
  getRedisClient,

  // Basic operations
  set,
  get,
  del,
  exists,
  mset,
  mget,
  keys,
  delByPattern,

  // Helpers
  getOrFetch,
  invalidateAndFetch,
  incr,
  decr,
  setNX,
  setEX,
  ttl,

  // Regions
  cacheProspect,
  getCachedProspect,
  invalidateProspect,
  cacheCampaign,
  getCachedCampaign,
  invalidateCampaign,
  cacheAnalytics,
  getCachedAnalytics,
  invalidateAnalytics,

  // Utilities
  withCache,
  memoize,

  // Stats
  getStats,
  getHealth,
  clearAll,
  getSize,

  // Middleware
  cacheMiddleware,
  invalidateMiddleware,

  // Constants
  CACHE_KEYS
};
