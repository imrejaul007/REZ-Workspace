"use strict";
/**
 * HOJAI RAG Service - Main Entry Point
 * Port: 4731
 *
 * Retrieval Augmented Generation Service for HOJAI AI
 * Provides document storage, semantic search, and LLM-powered generation
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
const documents_1 = __importDefault(require("./routes/documents"));
const search_1 = __importDefault(require("./routes/search"));
const generate_1 = __importDefault(require("./routes/generate"));
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
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});
// Health routes (no auth required)
app.use('/', health_1.default);
app.use('/health', health_1.default);
// API routes with auth and rate limiting
app.use('/api/documents', auth_1.authMiddleware, rateLimit_1.rateLimitMiddleware, documents_1.default);
app.use('/api/search', auth_1.authMiddleware, rateLimit_1.rateLimitMiddleware, search_1.default);
app.use('/api/generate', auth_1.authMiddleware, rateLimit_1.generationRateLimit, generate_1.default);
// Error handling
app.use(error_1.notFoundHandler);
app.use(error_1.errorHandler);
// Graceful shutdown
async function shutdown() {
    console.log('Shutting down HOJAI RAG Service...');
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Start server
function start() {
    app.listen(PORT, () => {
        console.log('╔═══════════════════════════════════════════════════════════════════╗');
        console.log('║                    HOJAI RAG SERVICE                            ║');
        console.log('╠═══════════════════════════════════════════════════════════════════╣');
        console.log(`║  Port:         ${PORT}                                              ║`);
        console.log(`║  Environment:  ${config_1.default.nodeEnv.padEnd(47)}║`);
        console.log(`║  Version:      ${config_1.default.version.padEnd(47)}║`);
        console.log('╠═══════════════════════════════════════════════════════════════════╣');
        console.log('║  Endpoints:                                                   ║');
        console.log('║    GET  /health              Health check                      ║');
        console.log('║    GET  /health/ready        Readiness check                   ║');
        console.log('║    GET  /health/live         Liveness check                    ║');
        console.log('║    POST /api/documents        Add document                     ║');
        console.log('║    POST /api/documents/batch  Batch add documents              ║');
        console.log('║    GET  /api/documents       List all documents               ║');
        console.log('║    GET  /api/documents/:id   Get document by ID              ║');
        console.log('║    DELETE /api/documents/:id Delete document                  ║');
        console.log('║    POST /api/search          Semantic search                   ║');
        console.log('║    POST /api/generate        Generate with RAG context        ║');
        console.log('╠═══════════════════════════════════════════════════════════════════╣');
        console.log('║  Configuration:                                               ║');
        console.log(`║    LLM Provider:      ${config_1.default.llmProvider.padEnd(40)}║`);
        console.log(`║    OpenAI Model:      ${config_1.default.openaiModel.padEnd(40)}║`);
        console.log(`║    Embedding Model:   ${config_1.default.embeddingModel.padEnd(40)}║`);
        console.log(`║    Embedding Dims:    ${config_1.default.embeddingDimension.toString().padEnd(40)}║`);
        console.log('╚═══════════════════════════════════════════════════════════════════╝');
    });
}
start();
exports.default = app;
//# sourceMappingURL=index.js.map