"use strict";
/**
 * HOJAI AI Churn Model Service
 *
 * Express server for customer churn prediction
 * Port: 4740
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const churnRoutes_js_1 = __importDefault(require("./routes/churnRoutes.js"));
const logger_js_1 = require("./utils/logger.js");
const PORT = parseInt(process.env.PORT ?? '4740', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
// Create Express app
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
// Body parsing
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging
app.use((req, _res, next) => {
    logger_js_1.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});
// Health check at root
app.get('/', (_req, res) => {
    res.json({
        service: 'hojai-churn-model',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
    });
});
// API routes
app.use('/api', churnRoutes_js_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found',
        },
    });
});
// Error handler
app.use((err, _req, res, _next) => {
    logger_js_1.logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
        },
    });
});
// Start server
app.listen(PORT, HOST, () => {
    logger_js_1.logger.info(`HOJAI Churn Model Service started`);
    logger_js_1.logger.info(`Listening on ${HOST}:${PORT}`);
    logger_js_1.logger.info(`Health check: http://localhost:${PORT}/api/health`);
    logger_js_1.logger.info(`Predict: POST http://localhost:${PORT}/api/predict`);
    logger_js_1.logger.info(`Train: POST http://localhost:${PORT}/api/train`);
    logger_js_1.logger.info(`Model info: GET http://localhost:${PORT}/api/model/:id`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_js_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_js_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=index.js.map