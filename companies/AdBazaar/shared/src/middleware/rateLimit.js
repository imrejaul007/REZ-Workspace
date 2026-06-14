"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRateLimitMiddleware = exports.authRateLimitMiddleware = exports.strictRateLimitMiddleware = exports.rateLimitMiddleware = void 0;
exports.createRateLimiter = createRateLimiter;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Default rate limit configuration
 */
const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
};
/**
 * Create a rate limiter with custom options
 */
function createRateLimiter(options) {
    return (0, express_rate_limit_1.default)({
        ...defaultOptions,
        ...options,
    });
}
/**
 * Default rate limiter for all API routes
 */
exports.rateLimitMiddleware = createRateLimiter();
/**
 * Strict rate limiter for sensitive endpoints
 */
exports.strictRateLimitMiddleware = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
});
/**
 * Auth rate limiter - prevents brute force
 */
exports.authRateLimitMiddleware = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many authentication attempts' },
});
/**
 * Webhook rate limiter - higher limits for webhooks
 */
exports.webhookRateLimitMiddleware = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 1000,
    message: { error: 'Webhook rate limit exceeded' },
});
//# sourceMappingURL=rateLimit.js.map