"use strict";
/**
 * Hojai Model Registry - Health Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const registry_1 = require("../services/registry");
const config_1 = __importDefault(require("../config"));
const router = (0, express_1.Router)();
/**
 * GET /health - Health check endpoint
 */
router.get('/', async (_req, res) => {
    const stats = await registry_1.modelRegistryService.getStats();
    const health = {
        status: 'healthy',
        storage: 'in-memory',
        timestamp: new Date().toISOString(),
        version: config_1.default.version,
        models_registered: stats.models_registered,
        total_versions: stats.total_versions,
    };
    res.json(health);
});
/**
 * GET /ready - Readiness check
 */
router.get('/ready', async (_req, res) => {
    // Model registry is always ready when the service is running
    res.json({
        ready: true,
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=health.js.map