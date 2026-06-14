import Redis from 'ioredis';
import { config } from './index';
import { logger } from 'utils/logger.js';

export class RedisClient {
  private static instance: RedisClient;
  private client: Redis | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  async connect(): Promise<void> {
    if (this.client && this.isConnected) {
      logger.info('Redis already connected');
      return;
    }

    try {
      this.client = new Redis(config.redis.url, {
        keyPrefix: config.redis.keyPrefix,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.error('Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (err) => {
        logger.error('Redis connection error:', err);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

      // Wait for connection
      await this.client.ping();

    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      // Redis is optional - continue without it
      this.client = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis disconnected gracefully');
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Session management methods
  async setSession(sessionId: string, data: Record<string, unknown>, ttl?: number): Promise<void> {
    if (!this.client) return;
    const key = `session:${sessionId}`;
    await this.client.setex(key, ttl || config.session.ttl, JSON.stringify(data));
  }

  async getSession(sessionId: string): Promise<Record<string, unknown> | null> {
    if (!this.client) return null;
    const key = `session:${sessionId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!this.client) return;
    const key = `session:${sessionId}`;
    await this.client.del(key);
  }

  // Cache methods
  async setCache(key: string, value: unknown, ttl: number): Promise<void> {
    if (!this.client) return;
    await this.client.setex(key, ttl, JSON.stringify(value));
  }

  async getCache<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteCache(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  // Rate limiting
  async checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    if (!this.client) {
      return { allowed: true, remaining: maxRequests, resetTime: Date.now() + windowMs };
    }

    const windowSec = Math.ceil(windowMs / 1000);
    const current = await this.client.incr(key);

    if (current === 1) {
      await this.client.expire(key, windowSec);
    }

    const ttl = await this.client.ttl(key);
    const allowed = current <= maxRequests;
    const remaining = Math.max(0, maxRequests - current);

    return {
      allowed,
      remaining,
      resetTime: Date.now() + (ttl * 1000)
    };
  }
}

export const redis = RedisClient.getInstance();
export default redis;