import { Global, Module, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { MockRedisService } from './mock-redis.service';
import { RedisHealthService } from './redis-health.service';
import { CacheService } from './cache.service';
import { CacheInterceptor } from './cache.interceptor';
import { RateLimiterService } from './rate-limiter.service';
import { RateLimitGuard } from './rate-limit.guard';
import { createRedisClient, testRedisConnection } from './redis-config';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const mockMode = process.env.MOCK_DATABASE === 'true' || configService.get('REDIS_ENABLED') === 'false';

        if (mockMode) {
          logger.warn('Using mock Redis client - Redis functionality will be simulated in memory');
          return new MockRedisService();
        }

        try {
          logger.log('Creating Redis client...');
          const client = createRedisClient(configService);

          // Test connection
          const connected = await testRedisConnection(client);
          if (!connected) {
            logger.warn('Redis connection test failed, falling back to mock service');
            await client.quit();
            return new MockRedisService();
          }

          logger.log('Redis client connected and tested successfully');
          return client;
        } catch (error) {
          logger.error('Failed to create Redis client, using mock:', (error as Error).message);
          return new MockRedisService();
        }
      },
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_SUBSCRIBER',
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const mockMode = process.env.MOCK_DATABASE === 'true' || configService.get('REDIS_ENABLED') === 'false';

        if (mockMode) {
          logger.warn('Using mock Redis subscriber - Pub/Sub will be simulated in memory');
          return new MockRedisService();
        }

        try {
          logger.log('Creating Redis subscriber...');
          const subscriber = createRedisClient(configService);

          // Test connection for subscriber
          const connected = await testRedisConnection(subscriber);
          if (!connected) {
            logger.warn('Redis subscriber connection test failed, falling back to mock service');
            await subscriber.quit();
            return new MockRedisService();
          }

          logger.log('Redis subscriber connected and tested successfully');
          return subscriber;
        } catch (error) {
          logger.error('Failed to create Redis subscriber, using mock:', (error as Error).message);
          return new MockRedisService();
        }
      },
      inject: [ConfigService],
    },
    {
      provide: RedisService,
      useFactory: (client, subscriber) => {
        return new RedisService(client, subscriber);
      },
      inject: ['REDIS_CLIENT', 'REDIS_SUBSCRIBER'],
    },
    RedisHealthService,
    CacheService,
    CacheInterceptor,
    RateLimiterService,
    RateLimitGuard,
  ],
  exports: ['REDIS_CLIENT', 'REDIS_SUBSCRIBER', RedisService, RedisHealthService, CacheService, CacheInterceptor, RateLimiterService, RateLimitGuard],
})
export class RedisModule {}