import { createClient, RedisClientType } from 'redis';
import logger, { redisOperationDuration } from '../utils/logger';

class RedisClient {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    if (this.client && this.isConnected) {
      return;
    }

    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redisPassword = process.env.REDIS_PASSWORD;

    try {
      this.client = createClient({
        socket: {
          host: redisHost,
          port: redisPort
        },
        password: redisPassword || undefined
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error', { error: err.message });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis Client Connected', { host: redisHost, port: redisPort });
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis Client Ready');
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis Client Reconnecting');
      });

      await this.client.connect();
      this.isConnected = true;
    } catch (error: any) {
      logger.error('Failed to connect to Redis', { error: error.message });
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis Client Disconnected');
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  async get(key: string): Promise<string | null> {
    const start = Date.now();
    try {
      if (!this.client) {
        logger.warn('Redis client not initialized');
        return null;
      }
      const result = await this.client.get(key);
      redisOperationDuration.observe({ operation: 'get' }, (Date.now() - start) / 1000);
      return result;
    } catch (error: any) {
      logger.error('Redis GET error', { key, error: error.message });
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    const start = Date.now();
    try {
      if (!this.client) {
        logger.warn('Redis client not initialized');
        return false;
      }
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      redisOperationDuration.observe({ operation: 'set' }, (Date.now() - start) / 1000);
      return true;
    } catch (error: any) {
      logger.error('Redis SET error', { key, error: error.message });
      return false;
    }
  }

  async setEx(key: string, seconds: number, value: string): Promise<boolean> {
    return this.set(key, value, seconds);
  }

  async del(key: string): Promise<boolean> {
    const start = Date.now();
    try {
      if (!this.client) {
        return false;
      }
      await this.client.del(key);
      redisOperationDuration.observe({ operation: 'del' }, (Date.now() - start) / 1000);
      return true;
    } catch (error: any) {
      logger.error('Redis DEL error', { key, error: error.message });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error: any) {
      logger.error('Redis EXISTS error', { key, error: error.message });
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }
      await this.client.expire(key, seconds);
      return true;
    } catch (error: any) {
      logger.error('Redis EXPIRE error', { key, error: error.message });
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      if (!this.client) {
        return -1;
      }
      return await this.client.ttl(key);
    } catch (error: any) {
      logger.error('Redis TTL error', { key, error: error.message });
      return -1;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      if (!this.client) {
        return -1;
      }
      return await this.client.incr(key);
    } catch (error: any) {
      logger.error('Redis INCR error', { key, error: error.message });
      return -1;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      if (!this.client) {
        return -1;
      }
      return await this.client.decr(key);
    } catch (error: any) {
      logger.error('Redis DECR error', { key, error: error.message });
      return -1;
    }
  }

  async hSet(key: string, field: string, value: string): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }
      await this.client.hSet(key, field, value);
      return true;
    } catch (error: any) {
      logger.error('Redis HSET error', { key, field, error: error.message });
      return false;
    }
  }

  async hGet(key: string, field: string): Promise<string | null> {
    try {
      if (!this.client) {
        return null;
      }
      return await this.client.hGet(key, field);
    } catch (error: any) {
      logger.error('Redis HGET error', { key, field, error: error.message });
      return null;
    }
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      if (!this.client) {
        return {};
      }
      return await this.client.hGetAll(key);
    } catch (error: any) {
      logger.error('Redis HGETALL error', { key, error: error.message });
      return {};
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.client) {
        return [];
      }
      return await this.client.keys(pattern);
    } catch (error: any) {
      logger.error('Redis KEYS error', { pattern, error: error.message });
      return [];
    }
  }

  async scan(cursor: number, pattern: string, count: number): Promise<{ cursor: number; keys: string[] }> {
    try {
      if (!this.client) {
        return { cursor: 0, keys: [] };
      }
      return await this.client.scan(cursor, { MATCH: pattern, COUNT: count });
    } catch (error: any) {
      logger.error('Redis SCAN error', { pattern, error: error.message });
      return { cursor: 0, keys: [] };
    }
  }

  async publish(channel: string, message: string): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }
      await this.client.publish(channel, message);
      return true;
    } catch (error: any) {
      logger.error('Redis PUBLISH error', { channel, error: error.message });
      return false;
    }
  }

  async lPush(key: string, value: string): Promise<number> {
    try {
      if (!this.client) {
        return -1;
      }
      return await this.client.lPush(key, value);
    } catch (error: any) {
      logger.error('Redis LPUSH error', { key, error: error.message });
      return -1;
    }
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      if (!this.client) {
        return [];
      }
      return await this.client.lRange(key, start, stop);
    } catch (error: any) {
      logger.error('Redis LRANGE error', { key, error: error.message });
      return [];
    }
  }
}

export const redisClient = new RedisClient();
export default redisClient;