import Redis from 'ioredis';
import config from './index';
import { logger } from '../utils/logger';

export class RedisClient {
  private static instance: RedisClient;
  private client: Redis | null = null;
  private subscriber: Redis | null = null;

  private constructor() {}

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public getClient(): Redis {
    if (!this.client) {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        keyPrefix: config.redis.keyPrefix,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.error('Redis: Max retry attempts reached');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        maxRetriesPerRequest: 3
      });

      this.client.on('connect', () => {
        logger.info('Redis: Connected');
      });

      this.client.on('error', (err) => {
        logger.error('Redis error:', err);
      });

      this.client.on('close', () => {
        logger.warn('Redis: Connection closed');
      });
    }
    return this.client;
  }

  public getSubscriber(): Redis {
    if (!this.subscriber) {
      this.subscriber = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        keyPrefix: config.redis.keyPrefix,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.error('Redis Subscriber: Max retry attempts reached');
            return null;
          }
          return Math.min(times * 100, 3000);
        }
      });

      this.subscriber.on('connect', () => {
        logger.info('Redis Subscriber: Connected');
      });

      this.subscriber.on('error', (err) => {
        logger.error('Redis Subscriber error:', err);
      });
    }
    return this.subscriber;
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = null;
    }
    logger.info('Redis: Disconnected');
  }
}

export const redisClient = RedisClient.getInstance();
export default redisClient;
