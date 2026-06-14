import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';
export const CACHE_PREFIX_METADATA = 'cache_prefix';

export interface CacheDecoratorOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Cache key prefix
  bypassFor?: string[]; // HTTP methods to bypass cache (e.g., ['POST', 'PUT', 'DELETE'])
  keyGenerator?: (req) => string; // Custom key generator function
}

/**
 * Cache decorator for controller methods
 * @param options Cache configuration options
 */
export const Cache = (options: CacheDecoratorOptions = {}) => {
  return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
    // Set cache metadata
    SetMetadata(CACHE_TTL_METADATA, options.ttl || 300)(target, propertyKey, descriptor);
    SetMetadata(CACHE_PREFIX_METADATA, options.prefix || 'endpoint')(target, propertyKey, descriptor);

    // Store options in metadata for interceptor
    SetMetadata('cacheOptions', options)(target, propertyKey, descriptor);

    return descriptor;
  };
};

/**
 * Specific decorators for common use cases
 */

// Short-term cache (1 minute) - for real-time data
export const CacheShort = (prefix?: string) => Cache({ ttl: 60, prefix });

// Medium-term cache (5 minutes) - for frequently changing data
export const CacheMedium = (prefix?: string) => Cache({ ttl: 300, prefix });

// Long-term cache (1 hour) - for rarely changing data
export const CacheLong = (prefix?: string) => Cache({ ttl: 3600, prefix });

// Cache for static data (24 hours) - for configuration, static lists
export const CacheStatic = (prefix?: string) => Cache({ ttl: 86400, prefix });

// User-specific cache (15 minutes) - for user-dependent data
export const CacheUser = (ttl: number = 900) => Cache({
  ttl,
  prefix: 'user',
  keyGenerator: (req) => `user:${req.user?.id || 'anonymous'}:${req.method}:${req.url}`
});

// Restaurant-specific cache (30 minutes) - for restaurant data
export const CacheRestaurant = (ttl: number = 1800) => Cache({
  ttl,
  prefix: 'restaurant',
  keyGenerator: (req) => {
    const restaurantId = req.params?.restaurantId || req.body?.restaurantId || 'all';
    return `restaurant:${restaurantId}:${req.method}:${req.url}`;
  }
});

// Jobs cache (10 minutes) - for job listings
export const CacheJobs = (ttl: number = 600) => Cache({
  ttl,
  prefix: 'jobs',
  bypassFor: ['POST', 'PUT', 'DELETE', 'PATCH']
});