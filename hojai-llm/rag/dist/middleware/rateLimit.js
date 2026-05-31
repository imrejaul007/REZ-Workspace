"use strict";
/**
 * HOJAI RAG Service - Rate Limiting Middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = rateLimitMiddleware;
exports.generationRateLimit = generationRateLimit;
const error_1 = require("./error");
const rateLimitStore = new Map();
// Clean up expired entries every minute
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 60000);
const defaultConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
};
function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `rate_limit:${ip}`;
    const now = Date.now();
    let entry = rateLimitStore.get(key);
    if (!entry || entry.resetTime < now) {
        // Create new window
        entry = {
            count: 1,
            resetTime: now + defaultConfig.windowMs,
        };
        rateLimitStore.set(key, entry);
        return next();
    }
    entry.count++;
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', defaultConfig.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, defaultConfig.maxRequests - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
    if (entry.count > defaultConfig.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return next(new error_1.RateLimitError(retryAfter));
    }
    return next();
}
/**
 * Stricter rate limit for expensive operations (generation)
 */
function generationRateLimit(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `generation_limit:${ip}`;
    const now = Date.now();
    const genConfig = {
        windowMs: 60000,
        maxRequests: 10, // Only 10 generations per minute
    };
    let entry = rateLimitStore.get(key);
    if (!entry || entry.resetTime < now) {
        entry = {
            count: 1,
            resetTime: now + genConfig.windowMs,
        };
        rateLimitStore.set(key, entry);
        return next();
    }
    entry.count++;
    res.setHeader('X-RateLimit-Limit', genConfig.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, genConfig.maxRequests - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
    if (entry.count > genConfig.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return next(new error_1.RateLimitError(retryAfter));
    }
    return next();
}
//# sourceMappingURL=rateLimit.js.map