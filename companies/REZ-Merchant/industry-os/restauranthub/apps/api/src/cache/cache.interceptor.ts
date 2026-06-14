import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService, CacheOptions } from './cache.service';
import { Request } from 'express';

export const CACHE_KEY = 'cache_key';
export const CACHE_TTL = 'cache_ttl';
export const CACHE_TAGS = 'cache_tags';
export const CACHE_DISABLED = 'cache_disabled';

// Decorator functions
export const CacheKey = (key: string) => (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
  const Reflector = require('@nestjs/core').Reflector;
  Reflector.createDecorator()(CACHE_KEY, key)(target, propertyKey, descriptor);
};

export const CacheTTL = (ttl: number) => (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
  const Reflector = require('@nestjs/core').Reflector;
  Reflector.createDecorator()(CACHE_TTL, ttl)(target, propertyKey, descriptor);
};

export const CacheTags = (tags: string[]) => (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
  const Reflector = require('@nestjs/core').Reflector;
  Reflector.createDecorator()(CACHE_TAGS, tags)(target, propertyKey, descriptor);
};

export const DisableCache = () => (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
  const Reflector = require('@nestjs/core').Reflector;
  Reflector.createDecorator()(CACHE_DISABLED, true)(target, propertyKey, descriptor);
};

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;

    // Check if caching is disabled for this endpoint
    const isCacheDisabled = this.reflector.get<boolean>(CACHE_DISABLED, handler);
    if (isCacheDisabled) {
      return next.handle();
    }

    // Only cache GET requests by default
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Get cache configuration from decorators
    const cacheKey = this.reflector.get<string>(CACHE_KEY, handler) || this.generateCacheKey(request, className, methodName);
    const cacheTtl = this.reflector.get<number>(CACHE_TTL, handler);
    const cacheTags = this.reflector.get<string[]>(CACHE_TAGS, handler);

    const cacheOptions: CacheOptions = {
      ttl: cacheTtl,
      tags: cacheTags,
      namespace: 'api',
    };

    try {
      // Try to get from cache first
      const cachedResult = await this.cacheService.get(cacheKey, cacheOptions);

      if (cachedResult !== null) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return new Observable(subscriber => {
          subscriber.next(cachedResult);
          subscriber.complete();
        });
      }

      this.logger.debug(`Cache miss for key: ${cacheKey}`);

      // Execute the handler and cache the result
      return next.handle().pipe(
        tap(async (result) => {
          try {
            // Only cache successful responses
            if (result && !this.isErrorResponse(result)) {
              await this.cacheService.set(cacheKey, result, cacheOptions);
              this.logger.debug(`Cached result for key: ${cacheKey}`);
            }
          } catch (error) {
            this.logger.error(`Failed to cache result for key ${cacheKey}:`, error);
            // Don't throw error, just log it
          }
        })
      );
    } catch (error) {
      this.logger.error(`Cache interceptor error for key ${cacheKey}:`, error);
      // If cache fails, continue without caching
      return next.handle();
    }
  }

  private generateCacheKey(request: Request, className: string, methodName: string): string {
    const baseKey = `${className}.${methodName}`;
    const queryString = JSON.stringify(request.query);
    const paramsString = JSON.stringify(request.params);

    // Create a hash of the query and params for consistent key generation
    const hash = this.simpleHash(queryString + paramsString);

    return `${baseKey}:${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  private isErrorResponse(result: unknown): boolean {
    if (!result || typeof result !== 'object') return false;
    const r = result as Record<string, unknown>;
    return (
      (typeof r.statusCode === 'number' && r.statusCode >= 400) ||
      r.error !== undefined ||
      r.success === false ||
      result instanceof Error
    );
  }
}