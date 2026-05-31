"use strict";
/**
 * HOJAI RAG Service - Health Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentService_1 = require("../services/documentService");
const config_1 = __importDefault(require("../config"));
const router = (0, express_1.Router)();
// GET /health - Health check
router.get('/health', (_req, res) => {
    const health = {
        status: 'healthy',
        service: config_1.default.serviceName,
        version: config_1.default.version,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        checks: {
            vector_service: config_1.default.vectorServiceUrl ? 'configured' : 'not_configured',
            llm_provider: config_1.default.openaiApiKey ? 'configured' : 'mock',
        },
    };
    res.json(health);
});
// GET /health/ready - Readiness check
router.get('/health/ready', (_req, res) => {
    const isReady = true; // Add actual checks here if needed
    const stats = (0, documentService_1.getStorageStats)();
    if (isReady) {
        res.json({
            ready: true,
            documents: stats.total_documents,
            namespaces: stats.total_namespaces,
        });
    }
    else {
        res.status(503).json({
            ready: false,
            reason: 'Service not ready',
        });
    }
});
// GET /health/live - Liveness check
router.get('/health/live', (_req, res) => {
    res.json({ alive: true });
});
// GET / - Root endpoint
router.get('/', (_req, res) => {
    const response = {
        success: true,
        data: {
            service: config_1.default.serviceName,
            version: config_1.default.version,
            endpoints: [
                'POST /api/documents - Create document',
                'POST /api/documents/batch - Batch create',
                'GET /api/documents/:id - Get document',
                'DELETE /api/documents/:id - Delete document',
                'GET /api/documents - List documents',
                'POST /api/search - Search documents',
                'POST /api/generate - Generate with RAG',
                'GET /health - Health check',
            ],
        },
        timestamp: new Date().toISOString(),
    };
    res.json(response);
});
exports.default = router;
//# sourceMappingURL=health.js.map