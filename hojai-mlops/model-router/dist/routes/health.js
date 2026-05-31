"use strict";
/**
 * Hojai Model Router - Health Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const config_1 = __importDefault(require("../config"));
const router_1 = require("../services/router");
const router = (0, express_1.Router)();
/**
 * GET /health - Health check (no auth required)
 */
router.get('/', (_req, res) => {
    const providers = router_1.modelRouterService.getProviders();
    const stats = router_1.modelRouterService.getStats();
    const providerStatus = providers.reduce((acc, p) => {
        acc[p.name] = p.enabled;
        return acc;
    }, {});
    res.status(200).json({
        status: 'healthy',
        providers: providerStatus,
        timestamp: new Date().toISOString(),
        version: config_1.default.version,
        totalRequests: stats.totalRequests,
        averageLatencyMs: Object.values(stats.averageLatencyMs).reduce((a, b) => a + b, 0) / 4,
    });
});
/**
 * GET /health/ready - Readiness probe
 */
router.get('/ready', (_req, res) => {
    res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString(),
    });
});
/**
 * GET /health/live - Liveness probe
 */
router.get('/live', (_req, res) => {
    res.status(200).json({
        alive: true,
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=health.js.map