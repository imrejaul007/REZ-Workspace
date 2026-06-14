import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      this.client = createClient({
        url: config.redis.url,
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.info('Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  getClient(): RedisClientType {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.');
    }
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected;
  }

  // Cache operations
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;
    try {
      const data = await this.client!.get(`${config.redis.keyPrefix}${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      const serialized = JSON.stringify(value);
      const fullKey = `${config.redis.keyPrefix}${key}`;
      if (ttl) {
        await this.client!.setEx(fullKey, ttl, serialized);
      } else {
        await this.client!.setEx(fullKey, config.redis.ttl.cache, serialized);
      }
    } catch (error) {
      logger.error('Redis SET error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client!.del(`${config.redis.keyPrefix}${key}`);
    } catch (error) {
      logger.error('Redis DEL error:', error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      const keys = await this.client!.keys(`${config.redis.keyPrefix}${pattern}`);
      if (keys.length > 0) {
        await this.client!.del(keys);
      }
    } catch (error) {
      logger.error('Redis DEL pattern error:', error);
    }
  }

  // Apartment-specific cache operations
  async cacheApartment(apartmentId: string, data: unknown): Promise<void> {
    await this.set(`apartment:${apartmentId}`, data);
  }

  async getCachedApartment(apartmentId: string): Promise<unknown | null> {
    return this.get(`apartment:${apartmentId}`);
  }

  async invalidateApartmentCache(apartmentId: string): Promise<void> {
    await this.del(`apartment:${apartmentId}`);
  }

  async cacheNearbyApartments(key: string, data: unknown): Promise<void> {
    await this.set(`nearby:${key}`, data, 300); // 5 min TTL for nearby searches
  }

  async getCachedNearbyApartments(key: string): Promise<unknown | null> {
    return this.get(`nearby:${key}`);
  }
}

export const redisService = new RedisService();