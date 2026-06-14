import { createClient, RedisClientType } from 'redis';
import config from '../config';
import { logger } from './logger.service';

class CacheService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  async connect(): Promise<void> {
    try {
      this.client = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
          reconnectStrategy: (retries) => {
            if (retries > this.maxReconnectAttempts) {
              logger.error('Redis: Max reconnection attempts reached');
              return false;
            }
            return Math.min(retries * 100, 3000);
          },
        },
        password: config.redis.password,
        database: config.redis.db,
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.client.on('reconnecting', () => {
        this.reconnectAttempts++;
        logger.warn(`Redis reconnecting... Attempt ${this.reconnectAttempts}`);
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  isReady(): boolean {
    return this.isConnected && !!this.client?.isOpen;
  }

  // Generic cache key builder
  private buildKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  // Cache key generators
  readonly keys = {
    creator: (id: string) => this.buildKey('creator', id),
    creators: (page: number, limit: number) => this.buildKey('creators:page', page, limit),
    creatorProducts: (creatorId: string, page: number) => this.buildKey('creator', creatorId, 'products', page),
    creatorOrders: (creatorId: string, page: number) => this.buildKey('creator', creatorId, 'orders', page),
    creatorAnalytics: (creatorId: string) => this.buildKey('creator', creatorId, 'analytics'),
    creatorPayouts: (creatorId: string) => this.buildKey('creator', creatorId, 'payouts'),
    product: (id: string) => this.buildKey('product', id),
    order: (id: string) => this.buildKey('order', id),
    platformAnalytics: () => this.buildKey('platform', 'analytics'),
  };

  // Get cached data
  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      const data = await this.client!.get(key);
      if (data) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(data) as T;
      }
      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Set cached data with TTL
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const ttl = ttlSeconds || config.cache.ttl;
      await this.client!.setEx(key, ttl, JSON.stringify(value));
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  // Delete cached data
  async del(key: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.client!.del(key);
      logger.debug(`Cache deleted: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  // Delete keys by pattern
  async delByPattern(pattern: string): Promise<number> {
    if (!this.isReady()) {
      return 0;
    }

    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        await this.client!.del(keys);
        logger.debug(`Cache deleted ${keys.length} keys matching pattern: ${pattern}`);
        return keys.length;
      }
      return 0;
    } catch (error) {
      logger.error(`Cache delete by pattern error (${pattern}):`, error);
      return 0;
    }
  }

  // Invalidate creator-related cache
  async invalidateCreatorCache(creatorId: string): Promise<void> {
    await Promise.all([
      this.del(this.keys.creator(creatorId)),
      this.delByPattern(`creators:*`),
      this.delByPattern(`creator:${creatorId}:*`),
    ]);
    logger.debug(`Invalidated cache for creator: ${creatorId}`);
  }

  // Invalidate product cache
  async invalidateProductCache(productId: string): Promise<void> {
    await this.del(this.keys.product(productId));
    logger.debug(`Invalidated cache for product: ${productId}`);
  }

  // Invalidate order cache
  async invalidateOrderCache(orderId: string): Promise<void> {
    await this.del(this.keys.order(orderId));
    logger.debug(`Invalidated cache for order: ${orderId}`);
  }

  // Cache with lock (prevent race conditions)
  async setWithLock<T>(
    key: string,
    value: T,
    ttlSeconds: number,
    lockTtlSeconds: number = 5
  ): Promise<boolean> {
    const lockKey = `${key}:lock`;

    if (!this.isReady()) {
      return this.set(key, value, ttlSeconds);
    }

    try {
      // Try to acquire lock
      const lockAcquired = await this.client!.setNX(lockKey, '1');

      if (!lockAcquired) {
        // Another process is updating, return false
        return false;
      }

      // Set lock expiry
      await this.client!.setEx(lockKey, lockTtlSeconds, '1');

      // Set the actual value
      await this.set(key, value, ttlSeconds);

      // Release lock
      await this.del(lockKey);

      return true;
    } catch (error) {
      logger.error(`Cache setWithLock error for key ${key}:`, error);
      return false;
    }
  }

  // Get or set (cache-aside pattern)
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  // Health check
  async ping(): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.client!.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
