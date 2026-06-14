import { createClient, RedisClientType } from 'redis';
import { config } from '../config';
import logger from 'utils/logger.js';

class RedisService {
  private static instance: RedisService;
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      logger.info('Redis already connected');
      return;
    }

    try {
      this.client = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
        password: config.redis.password || undefined,
        database: config.redis.db,
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connecting');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
      logger.info(`Redis connected to ${config.redis.host}:${config.redis.port}`);
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.client) {
      logger.info('Redis already disconnected');
      return;
    }

    try {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from Redis:', error);
      throw error;
    }
  }

  public async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return this.client.get(key);
  }

  public async set(key: string, value: string, options?: { EX?: number; PX?: number }): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    await this.client.set(key, value, options);
  }

  public async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    await this.client.del(key);
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    const result = await this.client.exists(key);
    return result === 1;
  }

  public async keys(pattern: string): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return this.client.keys(pattern);
  }

  public async hGet(key: string, field: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return this.client.hGet(key, field);
  }

  public async hSet(key: string, field: string, value: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    await this.client.hSet(key, field, value);
  }

  public async hGetAll(key: string): Promise<Record<string, string>> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return this.client.hGetAll(key);
  }

  public async incr(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return this.client.incr(key);
  }

  public async expire(key: string, seconds: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    await this.client.expire(key, seconds);
  }

  public isHealthy(): boolean {
    return this.isConnected;
  }
}

export const redisService = RedisService.getInstance();
export default redisService;