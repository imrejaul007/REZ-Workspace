"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const winston_1 = require("winston");
const consultRoutes_1 = __importDefault(require("./routes/consultRoutes"));
// ============================================
// Configuration
// ============================================
const PORT = process.env.PORT || 4758;
const NODE_ENV = process.env.NODE_ENV || 'development';
// ============================================
// Logger
// ============================================
const logger = (0, winston_1.createLogger)({
    level: NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston_1.format.combine(winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.errors({ stack: true }), winston_1.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}${stack ? '\n' + stack : ''}`;
    })),
    transports: [
        new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.timestamp({ format: 'HH:mm:ss' }), winston_1.format.printf(({ timestamp, level, message }) => {
                return `${timestamp} ${level}: ${message}`;
            })),
        }),
    ],
});
// ============================================
// Express App
// ============================================
const app = (0, express_1.default)();
// ============================================
// Middleware
// ============================================
// Security headers
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Disable for API
}));
// CORS
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests, please try again later.',
        },
    },
});
app.use('/api/', limiter);
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging
app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});
// ============================================
// Health Check Endpoint
// ============================================
app.get('/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            service: 'Restaurant Growth Consultant',
            version: '1.0.0',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
    });
});
// ============================================
// API Routes
// ============================================
app.use('/api/consult', consultRoutes_1.default);
// Sales Agent routes
app.use('/api/consult/sales', consultRoutes_1.default);
// Marketing Agent routes
app.use('/api/consult/marketing', consultRoutes_1.default);
// ============================================
// Error Handling
// ============================================
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found.',
        },
    });
});
// Global error handler
app.use((err, _req, res, _next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.',
        },
    });
});
// ============================================
// Server Startup
// ============================================
app.listen(PORT, () => {
    logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🍽️  Restaurant Growth Consultant                           ║
║      Expert Employee Service                                  ║
║                                                               ║
║   Port: ${PORT}                                                  ║
║   Environment: ${NODE_ENV}                                        ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   API Endpoints:                                              ║
║   • POST /api/consult/menu      - Menu Engineering           ║
║   • POST /api/consult/turnover  - Table Turnover             ║
║   • POST /api/consult/food-cost - Food Cost Analysis         ║
║   • POST /api/consult/loyalty   - Loyalty Program            ║
║   • POST /api/consult/reviews   - Review Management          ║
║   • POST /api/consult/zomato    - Platform Optimization      ║
║   • GET  /api/consult/growth    - Growth Recommendations     ║
║                                                               ║
║   Composer Agents:                                            ║
║   • POST /api/consult/sales/upsell  - Sales Agent            ║
║   • POST /api/consult/sales/bundles - Bundle Generation       ║
║   • POST /api/consult/marketing/* - Marketing Agent           ║
║   • POST /api/consult/loyalty/*  - Loyalty Agent             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
// ============================================
// Graceful Shutdown
// ============================================
const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    process.exit(0);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
exports.default = app;
//# sourceMappingURL=index.js.map