"use strict";
/**
 * Hojai Model Router - Main Entry Point
 * Port: 4712
 *
 * Intelligent LLM Provider Routing Service for HOJAI AI
 * Routes requests to appropriate LLM providers based on task type
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
const router_1 = __importDefault(require("./routes/router"));
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
// API routes with auth and rate limiting
app.use('/api', auth_1.authMiddleware, rateLimit_1.rateLimitMiddleware, router_1.default);
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
        console.log('║              HOJAI MODEL ROUTER SERVICE                      ║');
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log(`║  Port:        ${PORT}                                          ║`);
        console.log(`║  Environment: ${config_1.default.nodeEnv.padEnd(42)}║`);
        console.log(`║  Version:     ${config_1.default.version.padEnd(42)}║`);
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log('║  Endpoints:                                                 ║');
        console.log('║    GET  /health              Health check                  ║');
        console.log('║    GET  /health/ready        Readiness probe               ║');
        console.log('║    GET  /health/live         Liveness probe                ║');
        console.log('║    POST /api/route           Route request to model         ║');
        console.log('║    POST /api/fallback       Handle provider fallback       ║');
        console.log('║    GET  /api/providers      List available providers      ║');
        console.log('║    GET  /api/costs          Get cost estimates            ║');
        console.log('║    GET  /api/stats          Get router statistics          ║');
        console.log('║    DELETE /api/stats        Reset statistics               ║');
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log('║  Task Routing:                                             ║');
        console.log('║    chat      -> GPT-4o-mini (cost optimized)                ║');
        console.log('║    embed     -> OpenAI embeddings                          ║');
        console.log('║    classify  -> Claude 3.5 Sonnet (analysis)               ║');
        console.log('║    complete  -> GPT-4o-mini                               ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝');
    });
}
start();
exports.default = app;
//# sourceMappingURL=index.js.map