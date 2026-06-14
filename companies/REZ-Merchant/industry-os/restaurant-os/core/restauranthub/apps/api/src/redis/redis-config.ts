import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

const logger = new Logger('RedisConfig');

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryStrategy?: (times: number) => number | null;
  maxRetriesPerRequest?: number;
  connectTimeout?: number;
  commandTimeout?: number;
  lazyConnect?: boolean;
}

export const createRedisConfig = (configService: ConfigService): RedisConfig => {
  const config: RedisConfig = {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    password: configService.get<string>('REDIS_PASSWORD'),
    db: 0,
    connectTimeout: configService.get<number>('REDIS_CONNECT_TIMEOUT', 10000),
    commandTimeout: configService.get<number>('REDIS_COMMAND_TIMEOUT', 5000),
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy: (times: number) => {
      if (times > 3) {
        logger.error('Redis connection failed after 3 retries');
        return null;
      }
      const delay = Math.min(times * 500, 2000);
      logger.warn(`Redis connection attempt ${times}, retrying in ${delay}ms`);
      return delay;
    },
  };

  return config;
};

export const createRedisClient = (configService: ConfigService): Redis => {
  const config = createRedisConfig(configService);
  const client = new Redis(config);

  client.on('connect', () => {
    logger.log('Redis client connected successfully');
  });

  client.on('ready', () => {
    logger.log('Redis client ready to accept commands');
  });

  client.on('error', (error) => {
    logger.error('Redis client error:', error.message);
  });

  client.on('close', () => {
    logger.warn('Redis client connection closed');
  });

  client.on('reconnecting', (time: number) => {
    logger.log(`Redis client reconnecting in ${time}ms`);
  });

  return client;
};

export const testRedisConnection = async (client: Redis): Promise<boolean> => {
  try {
    await client.ping();
    logger.log('Redis connection test successful');
    return true;
  } catch (error) {
    logger.error('Redis connection test failed:', error instanceof Error ? error.message : error);
    return false;
  }
};

export const getRedisInfo = async (client: Redis): Promise<Record<string, unknown>> => {
  try {
    const info = await client.info();
    const lines = info.split('\r\n');
    const result: Record<string, unknown> = {};

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    }

    return result;
  } catch (error) {
    logger.error('Failed to get Redis info:', error instanceof Error ? error.message : error);
    return {};
  }
};