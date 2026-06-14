import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimiterService } from './rate-limiter.service';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitConfig {
  limit: number; // Max requests
  window: number; // Time window in seconds
  key?: string; // Custom key prefix
  skipIf?: (request: Request) => boolean; // Skip rate limiting condition
  keyGenerator?: (request: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly rateLimiter: RateLimiterService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Get rate limit configuration from decorator
    const rateLimitConfig = this.reflector.getAllAndOverride<RateLimitConfig>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Skip if no rate limit configuration
    if (!rateLimitConfig) {
      return true;
    }

    const { limit, window, key = 'api', skipIf, keyGenerator, skipSuccessfulRequests = false, skipFailedRequests = false } = rateLimitConfig;

    // Skip if custom condition is met
    if (skipIf && skipIf(request)) {
      return true;
    }

    // Generate rate limit key
    const identifier = this.generateIdentifier(request, keyGenerator);
    const rateLimitKey = this.rateLimiter.generateKey(identifier, key);

    try {
      // Check rate limit
      const result = await this.rateLimiter.checkRateLimit({
        key: rateLimitKey,
        limit,
        window,
        skipSuccessfulRequests,
        skipFailedRequests,
      });

      // Set rate limit headers
      response.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'X-RateLimit-Window': window.toString(),
      });

      if (!result.allowed) {
        // Set additional headers for blocked requests
        response.set({
          'Retry-After': (result.retryAfter || window).toString(),
          'X-RateLimit-Blocked': 'true',
        });

        this.logger.warn(
          `Rate limit exceeded for ${rateLimitKey}: ${limit} requests per ${window}s`,
        );

        throw new HttpException(
          {
            message: 'Too Many Requests',
            error: 'Rate limit exceeded',
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            retryAfter: result.retryAfter || window,
            limit,
            window,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      this.logger.debug(
        `Rate limit OK for ${rateLimitKey}: ${result.remaining}/${limit} remaining`,
      );

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Rate limit guard error:', error);

      // Fail open - allow request if rate limiter fails
      return true;
    }
  }

  private generateIdentifier(
    request: Request,
    keyGenerator?: (request: Request) => string,
  ): string {
    if (keyGenerator) {
      return keyGenerator(request);
    }

    // Default: Use user ID if authenticated, otherwise IP
    const user = (request as unknown).user;
    if (user?.id) {
      return `user:${user.id}`;
    }

    // Fallback to IP address
    const ip = this.getClientIp(request);
    return `ip:${ip}`;
  }

  private getClientIp(request: Request): string {
    // Handle various proxy scenarios
    const forwarded = request.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers['x-real-ip'] as string;
    if (realIp) {
      return realIp;
    }

    return request.connection.remoteAddress || 'unknown';
  }
}