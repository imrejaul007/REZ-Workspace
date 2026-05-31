"use strict";
/**
 * HOJAI AI Recommendation Engine
 *
 * Express server for rule-based + embedding similarity recommendations
 * Port: 4742
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const recommendationRoutes_js_1 = __importDefault(require("./routes/recommendationRoutes.js"));
const logger_js_1 = require("./utils/logger.js");
const dataStore_js_1 = require("./services/dataStore.js");
const PORT = parseInt(process.env.PORT ?? '4742', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
// Create Express app
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Tenant-ID'],
}));
// Body parsing
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging
app.use((req, _res, next) => {
    logger_js_1.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        contentLength: req.get('content-length'),
    });
    next();
});
// Root health check
app.get('/', (_req, res) => {
    res.json({
        service: 'hojai-recommendation-engine',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        docs: {
            recommend: 'POST /api/recommend',
            userRecommend: 'GET /api/recommend/:userId',
            trending: 'GET /api/trending',
            similar: 'POST /api/similar',
            health: 'GET /api/health',
        },
    });
});
// API routes
app.use('/api', recommendationRoutes_js_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found',
        },
        timestamp: new Date().toISOString(),
    });
});
// Error handler
app.use((err, _req, res, _next) => {
    logger_js_1.logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
        },
        timestamp: new Date().toISOString(),
    });
});
// Initialize and start server
async function start() {
    // Initialize mock data
    (0, dataStore_js_1.initializeMockData)();
    // Log data stats
    const stats = (0, dataStore_js_1.getDataStats)();
    logger_js_1.logger.info(`Data store initialized: ${stats.productCount} products, ${stats.purchaseCount} purchases`);
    // Start server
    app.listen(PORT, HOST, () => {
        logger_js_1.logger.info('='.repeat(60));
        logger_js_1.logger.info('HOJAI Recommendation Engine started');
        logger_js_1.logger.info('='.repeat(60));
        logger_js_1.logger.info(`Listening on ${HOST}:${PORT}`);
        logger_js_1.logger.info(`Health check: http://localhost:${PORT}/api/health`);
        logger_js_1.logger.info(`Recommend: POST http://localhost:${PORT}/api/recommend`);
        logger_js_1.logger.info(`User recommend: GET http://localhost:${PORT}/api/recommend/:userId`);
        logger_js_1.logger.info(`Trending: GET http://localhost:${PORT}/api/trending`);
        logger_js_1.logger.info(`Similar: POST http://localhost:${PORT}/api/similar`);
        logger_js_1.logger.info(`Stats: GET http://localhost:${PORT}/api/stats`);
        logger_js_1.logger.info('='.repeat(60));
    });
}
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_js_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_js_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
// Start the server
start().catch((error) => {
    logger_js_1.logger.error('Failed to start server', { error: error.message });
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map