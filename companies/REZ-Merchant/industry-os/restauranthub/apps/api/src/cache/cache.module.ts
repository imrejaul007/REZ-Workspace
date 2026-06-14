import { Module, Global, DynamicModule } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { RedisService } from './redis.service';
import { MemoryCacheService } from './memory-cache.service';
import { CacheConfigService } from './cache-config.service';
import { CacheHealthService } from './cache-health.service';
import { CacheInterceptor } from './cache.interceptor';
import { CacheEvictionService } from './cache-eviction.service';
import * as redisStore from 'cache-manager-redis-store';

@Global()
@Module({})
export class CacheConfigModule {
  static forRoot(): DynamicModule {
    return {
      module: CacheConfigModule,
      imports: [
        ConfigModule,
        NestCacheModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => {
            const cacheConfig = new CacheConfigService(configService);

            if (cacheConfig.isRedisEnabled()) {
              return {
                store: redisStore as unknown,
                host: cacheConfig.getRedisHost(),
                port: cacheConfig.getRedisPort(),
                password: cacheConfig.getRedisPassword(),
                db: cacheConfig.getRedisDb(),
                ttl: cacheConfig.getDefaultTtl(),
                max: cacheConfig.getMaxItems(),
                // Performance optimizations
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                enableOfflineQueue: false,
                connectTimeout: 10000,
                commandTimeout: 5000,
                // Connection pool settings
                family: 4,
                keepAlive: true,
                // Compression for large values
                compression: 'gzip',
                // Key serialization
                keyPrefix: cacheConfig.getKeyPrefix(),
                // Error handling
                retryDelayOnClusterDown: 300,
                enableReadyCheck: true,
              } as unknown;
            } else {
              // Fallback to in-memory cache
              return {
                ttl: cacheConfig.getDefaultTtl(),
                max: cacheConfig.getMaxItems(),
                // Memory cache specific optimizations
                updateAgeOnGet: true,
                useClones: false,
              } as unknown;
            }
          },
          inject: [ConfigService],
        }),
      ],
      providers: [
        CacheConfigService,
        CacheService,
        RedisService,
        MemoryCacheService,
        CacheHealthService,
        CacheInterceptor,
        CacheEvictionService,
        {
          provide: 'CACHE_CONFIG',
          useFactory: (configService: ConfigService) => new CacheConfigService(configService),
          inject: [ConfigService],
        },
      ],
      exports: [
        CacheService,
        RedisService,
        MemoryCacheService,
        CacheHealthService,
        CacheInterceptor,
        CacheEvictionService,
        'CACHE_CONFIG',
      ],
    };
  }
}
