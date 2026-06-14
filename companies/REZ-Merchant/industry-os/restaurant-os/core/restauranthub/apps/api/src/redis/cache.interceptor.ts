import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CacheService } from './cache.service';
import { CACHE_TTL_METADATA, CACHE_PREFIX_METADATA } from './cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Get cache metadata from decorators
    const ttl = this.reflector.getAllAndOverride<number>(CACHE_TTL_METADATA, [
      handler,
      controller,
    ]);
    const prefix = this.reflector.getAllAndOverride<string>(CACHE_PREFIX_METADATA, [
      handler,
      controller,
    ]);
    const cacheOptions = this.reflector.getAllAndOverride<{
      bypassFor?: string[];
      keyGenerator?: (request: Request) => string;
    }>('cacheOptions', [
      handler,
      controller,
    ]);

    // Skip caching if no metadata found
    if (!ttl && !cacheOptions) {
      return next.handle();
    }

    // Check if method should bypass cache
    if (cacheOptions?.bypassFor?.includes(request.method)) {
      this.logger.debug(`Bypassing cache for ${request.method} ${request.url}`);
      return next.handle();
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(request, cacheOptions);

    try {
      // Try to get from cache first
      const cachedResponse = await this.cacheService.get(cacheKey, prefix);

      if (cachedResponse !== null) {
        this.logger.debug(`Serving from cache: ${cacheKey}`);

        // Set cache headers
        response.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${ttl || 300}`,
        });

        return of(cachedResponse);
      }

      // Cache miss - execute handler and cache result
      this.logger.debug(`Cache miss: ${cacheKey}`);

      return next.handle().pipe(
        tap(async (data) => {
          try {
            // Only cache successful responses
            if (response.statusCode >= 200 && response.statusCode < 300) {
              await this.cacheService.set(cacheKey, data, {
                ttl: ttl || 300,
                prefix,
              });

              // Set cache headers
              response.set({
                'X-Cache': 'MISS',
                'X-Cache-Key': cacheKey,
                'Cache-Control': `public, max-age=${ttl || 300}`,
              });

              this.logger.debug(`Cached response: ${cacheKey}`);
            }
          } catch (error) {
            this.logger.error(`Failed to cache response for ${cacheKey}:`, error);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache interceptor error for ${cacheKey}:`, error);
      // Fall back to normal execution on cache error
      return next.handle();
    }
  }

  private generateCacheKey(request: Request, cacheOptions?): string {
    // Use custom key generator if provided
    if (cacheOptions?.keyGenerator) {
      return cacheOptions.keyGenerator(request);
    }

    // Default key generation
    const userId = (request as unknown).user?.id || 'anonymous';
    const method = request.method;
    const url = request.url;
    const queryParams = Object.keys(request.query).length > 0 ? request.query : null;

    return this.cacheService.generateApiCacheKey(method, url, userId, queryParams || undefined);
  }
}