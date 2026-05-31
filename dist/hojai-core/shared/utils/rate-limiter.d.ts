/**
 * Hojai Core - Rate Limiter Utility
 * Version: 1.0 | Date: May 29, 2026
 */
/**
 * Create tenant-aware rate limiter
 */
export declare function createRateLimiter(options?: {
    windowMs?: number;
    maxRequests?: number;
    redisClient?: any;
}): import("express-rate-limit").RateLimitRequestHandler;
/**
 * Create stricter rate limiter for sensitive endpoints
 */
export declare function createStrictRateLimiter(options?: {
    windowMs?: number;
    maxRequests?: number;
}): import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rate-limiter.d.ts.map