import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  Optional,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requests = new Map<string, RateLimitRecord>();
  private readonly logger = new Logger(RateLimitGuard.name);

  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly keyPrefix: string;

  constructor(
    @Optional() @Inject('RATE_LIMIT_WINDOW_MS') windowMs: number = 60000,
    @Optional() @Inject('RATE_LIMIT_MAX_REQUESTS') maxRequests: number = 60,
    @Optional() @Inject('RATE_LIMIT_KEY_PREFIX') keyPrefix: string = 'rate',
  ) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.keyPrefix = keyPrefix;

    setInterval(() => this.cleanup(), this.windowMs);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest() as Request;
    const response = context.switchToHttp().getResponse() as Response;

    const ip = this.getClientIp(request);
    const key = `${this.keyPrefix}:${ip}`;
    const now = Date.now();

    let record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + this.windowMs,
      };
    }

    record.count++;
    this.requests.set(key, record);

    response.setHeader('X-RateLimit-Limit', this.maxRequests);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - record.count));
    response.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > this.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      response.setHeader('Retry-After', retryAfter);

      this.logger.warn(
        `Rate limit exceeded for IP ${ip}: ${record.count} requests in current window`,
      );

      throw new HttpException(
        `Rate limit exceeded. Maximum ${this.maxRequests} requests per ${this.windowMs / 1000} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return ips.trim();
    }
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Rate limit cleanup: removed ${cleaned} expired entries`);
    }
  }
}
