"use strict";
/**
 * Rate Limiting Middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = rateLimitMiddleware;
const error_1 = require("./error");
// Simple in-memory rate limiter
// For production, use Redis-based rate limiting
class RateLimiter {
    requests = new Map();
    windowMs;
    maxRequests;
    constructor(windowMs = 60000, maxRequests = 1000) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        // Clean up old entries every minute
        setInterval(() => this.cleanup(), 60000);
    }
    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.requests.entries()) {
            if (value.resetTime < now) {
                this.requests.delete(key);
            }
        }
    }
    check(identifier) {
        const now = Date.now();
        const record = this.requests.get(identifier);
        if (!record || record.resetTime < now) {
            // New window
            this.requests.set(identifier, {
                count: 1,
                resetTime: now + this.windowMs,
            });
            return {
                allowed: true,
                remaining: this.maxRequests - 1,
                resetIn: this.windowMs,
            };
        }
        if (record.count >= this.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetIn: record.resetTime - now,
            };
        }
        record.count++;
        return {
            allowed: true,
            remaining: this.maxRequests - record.count,
            resetIn: record.resetTime - now,
        };
    }
}
// Rate limiters for different endpoints
const standardLimiter = new RateLimiter(60000, 1000); // 1000 requests/minute
const batchLimiter = new RateLimiter(60000, 100); // 100 batch requests/minute
function rateLimitMiddleware(req, res, next) {
    // Use entity ID or IP as identifier
    const identifier = req.params.entityId ||
        req.headers['x-internal-token'] ||
        req.ip ||
        'unknown';
    const limiter = req.path.includes('/batch') ? batchLimiter : standardLimiter;
    const result = limiter.check(identifier);
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limiter['maxRequests']);
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetIn / 1000).toString());
    if (!result.allowed) {
        throw new error_1.RateLimitError(Math.ceil(result.resetIn / 1000));
    }
    next();
}
//# sourceMappingURL=rateLimit.js.map