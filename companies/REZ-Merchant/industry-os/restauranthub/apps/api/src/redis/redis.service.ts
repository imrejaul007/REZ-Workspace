import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor(
    @Inject('REDIS_CLIENT') private readonly client: Redis,
    @Inject('REDIS_SUBSCRIBER') private readonly subscriber: Redis,
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Redis client connected');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      this.logger.error('Redis client error:', error);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.logger.warn('Redis client connection closed');
    });

    this.subscriber.on('error', (error) => {
      this.logger.error('Redis subscriber error:', error);
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping get operation');
        return null;
      }
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping set operation');
        return;
      }
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Redis set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.client.expire(key, ttl);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hdel(key: string, field: string): Promise<void> {
    await this.client.hdel(key, field);
  }

  async sadd(key: string, member: string): Promise<void> {
    await this.client.sadd(key, member);
  }

  async srem(key: string, member: string): Promise<void> {
    await this.client.srem(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }

  async flushall(): Promise<void> {
    await this.client.flushall();
  }

  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  async healthCheck(): Promise<{ status: string; connected: boolean; error?: string }> {
    try {
      if (!this.isConnected) {
        return {
          status: 'unhealthy',
          connected: false,
          error: 'Not connected to Redis server'
        };
      }

      await this.client.ping();
      return {
        status: 'healthy',
        connected: true
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}