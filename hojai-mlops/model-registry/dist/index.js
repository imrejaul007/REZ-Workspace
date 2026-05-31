"use strict";
/**
 * Hojai Model Registry - Main Entry Point
 * Port: 4711
 *
 * ML Model Registry Service for HOJAI AI
 * Manages model versions, stages, and metadata
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = __importDefault(require("./config"));
const error_1 = require("./middleware/error");
const rateLimit_1 = require("./middleware/rateLimit");
const auth_1 = require("./middleware/auth");
const models_1 = __importDefault(require("./routes/models"));
const health_1 = __importDefault(require("./routes/health"));
const app = (0, express_1.default)();
const PORT = config_1.default.port;
// Middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Trust proxy for rate limiting
app.set('trust proxy', 1);
// Security headers
app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});
// Health routes (no auth required)
app.use('/health', health_1.default);
app.use('/', health_1.default);
// API routes with auth and rate limiting
app.use('/api/models', auth_1.authMiddleware, rateLimit_1.rateLimitMiddleware, models_1.default);
// Error handling
app.use(error_1.notFoundHandler);
app.use(error_1.errorHandler);
// Graceful shutdown
async function shutdown() {
    console.log('Shutting down gracefully...');
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Start server
function start() {
    app.listen(PORT, () => {
        console.log('╔═══════════════════════════════════════════════════════════════╗');
        console.log('║           HOJAI MODEL REGISTRY SERVICE                        ║');
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log(`║  Port:        ${PORT}                                          ║`);
        console.log(`║  Environment: ${config_1.default.nodeEnv.padEnd(42)}║`);
        console.log(`║  Version:     ${config_1.default.version.padEnd(42)}║`);
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log('║  Endpoints:                                                 ║');
        console.log('║    GET  /health              Health check                    ║');
        console.log('║    POST /api/models          Register model                  ║');
        console.log('║    GET  /api/models          List all models                 ║');
        console.log('║    GET  /api/models/:name    Get model versions             ║');
        console.log('║    GET  /api/models/:name/latest  Get latest version        ║');
        console.log('║    GET  /api/models/:name/:version   Get specific version   ║');
        console.log('║    PUT  /api/models/:name/:version/stage  Update stage      ║');
        console.log('║    DELETE /api/models/:name/:version  Delete version        ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝');
    });
}
start();
exports.default = app;
//# sourceMappingURL=index.js.map