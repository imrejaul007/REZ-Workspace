"use strict";
/**
 * Health Check Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const redis_1 = require("../services/redis");
const router = (0, express_1.Router)();
const VERSION = '1.0.0';
/**
 * GET /health
 * Basic health check
 */
router.get('/health', async (_req, res) => {
    const redisConnected = redis_1.redisService.getConnectionStatus();
    const redisPing = await redis_1.redisService.ping();
    const response = {
        status: redisConnected && redisPing ? 'healthy' : 'unhealthy',
        redis: redisConnected && redisPing ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        version: VERSION,
    };
    const statusCode = response.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
});
/**
 * GET /health/live
 * Liveness probe - is the server running?
 */
router.get('/health/live', (_req, res) => {
    res.json({
        status: 'alive',
        timestamp: new Date().toISOString(),
    });
});
/**
 * GET /health/ready
 * Readiness probe - is the server ready to accept traffic?
 */
router.get('/health/ready', async (_req, res) => {
    const redisConnected = redis_1.redisService.getConnectionStatus();
    const redisPing = await redis_1.redisService.ping();
    const isReady = redisConnected && redisPing;
    res.json({
        status: isReady ? 'ready' : 'not_ready',
        redis: redisConnected && redisPing ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=health.js.map