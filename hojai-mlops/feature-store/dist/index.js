"use strict";
/**
 * Hojai Feature Store - Main Entry Point
 * Port: 4710
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = __importDefault(require("./config"));
const redis_1 = require("./services/redis");
const error_1 = require("./middleware/error");
const rateLimit_1 = require("./middleware/rateLimit");
const features_1 = __importDefault(require("./routes/features"));
const health_1 = __importDefault(require("./routes/health"));
const app = (0, express_1.default)();
const PORT = config_1.default.port;
// Middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Trust proxy for rate limiting
app.set('trust proxy', 1);
// Health routes (no auth required)
app.use('/', health_1.default);
// API routes with auth and rate limiting
app.use('/api/features', rateLimit_1.rateLimitMiddleware, features_1.default);
// Error handling
app.use(error_1.notFoundHandler);
app.use(error_1.errorHandler);
// Graceful shutdown
async function shutdown() {
    console.log('Shutting down gracefully...');
    await redis_1.redisService.disconnect();
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Start server
async function start() {
    try {
        // Connect to Redis
        console.log('Connecting to Redis...');
        await redis_1.redisService.connect();
        // Start HTTP server
        app.listen(PORT, () => {
            console.log(`Hojai Feature Store running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
            console.log(`Redis: ${config_1.default.redis.host}:${config_1.default.redis.port}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
start();
exports.default = app;
//# sourceMappingURL=index.js.map