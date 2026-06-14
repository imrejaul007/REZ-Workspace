import { Request } from 'express';
/**
 * Create a rate limiter with custom options
 */
export declare function createRateLimiter(options?: {
    windowMs?: number;
    max?: number;
    keyGenerator?: (req: Request) => string;
}): any;
/**
 * Default rate limiter for all API routes
 */
export declare const rateLimitMiddleware: any;
/**
 * Strict rate limiter for sensitive endpoints
 */
export declare const strictRateLimitMiddleware: any;
/**
 * Auth rate limiter - prevents brute force
 */
export declare const authRateLimitMiddleware: any;
/**
 * Webhook rate limiter - higher limits for webhooks
 */
export declare const webhookRateLimitMiddleware: any;
//# sourceMappingURL=rateLimit.d.ts.map