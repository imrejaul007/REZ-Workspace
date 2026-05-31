"use strict";
/**
 * HR Recruiter Agent - Main Application Entry Point
 * AI-powered candidate screening, interview scheduling, and onboarding
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const uuid_1 = require("uuid");
// Routes
const resumeRoutes_1 = __importDefault(require("./routes/resumeRoutes"));
const candidateRoutes_1 = __importDefault(require("./routes/candidateRoutes"));
const interviewRoutes_1 = __importDefault(require("./routes/interviewRoutes"));
const onboardingRoutes_1 = __importDefault(require("./routes/onboardingRoutes"));
const jobRoutes_1 = __importDefault(require("./routes/jobRoutes"));
const skillsRoutes_1 = __importDefault(require("./routes/skillsRoutes"));
// ============================================
// APP CONFIGURATION
// ============================================
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4762;
// ============================================
// MIDDLEWARE
// ============================================
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Disable for API
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'X-Tenant-ID', 'X-Internal-Token'],
    credentials: true,
}));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request ID middleware
app.use((req, _res, next) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || (0, uuid_1.v4)();
    next();
});
// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});
// Rate limiting (basic implementation)
const requestCounts = new Map();
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT || '100');
const RATE_WINDOW = 60 * 1000; // 1 minute
app.use((req, res, next) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    let clientData = requestCounts.get(clientId);
    if (!clientData || now > clientData.resetTime) {
        clientData = { count: 0, resetTime: now + RATE_WINDOW };
        requestCounts.set(clientId, clientData);
    }
    clientData.count++;
    if (clientData.count > RATE_LIMIT) {
        const response = {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: `Rate limit exceeded. Try again in ${Math.ceil((clientData.resetTime - now) / 1000)} seconds.`,
            },
        };
        return res.status(429).json(response);
    }
    next();
});
// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (_req, res) => {
    const response = {
        success: true,
        data: {
            status: 'healthy',
            version: '1.0.0',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            services: {
                resumeScreener: true,
                candidateQualifier: true,
                interviewScheduler: true,
                onboardingManager: true,
                skillsMatcher: true,
            },
        },
    };
    res.status(200).json(response);
});
app.get('/ready', (_req, res) => {
    res.status(200).json({ ready: true });
});
// ============================================
// API ROUTES
// ============================================
// Resume routes
app.use('/api/resumes', resumeRoutes_1.default);
// Candidate routes
app.use('/api/candidates', candidateRoutes_1.default);
// Interview routes
app.use('/api/interviews', interviewRoutes_1.default);
// Onboarding routes
app.use('/api/onboarding', onboardingRoutes_1.default);
// Job routes
app.use('/api/jobs', jobRoutes_1.default);
// Skills routes
app.use('/api/skills', skillsRoutes_1.default);
// ============================================
// METRICS ENDPOINT
// ============================================
app.get('/metrics', (_req, res) => {
    const memoryUsage = process.memoryUsage();
    const response = {
        success: true,
        data: {
            uptime: process.uptime(),
            memory: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                rss: Math.round(memoryUsage.rss / 1024 / 1024),
            },
            requests: {
                total: Array.from(requestCounts.values()).reduce((sum, c) => sum + c.count, 0),
                active: Array.from(requestCounts.values()).filter(c => Date.now() < c.resetTime).length,
            },
        },
    };
    res.status(200).json(response);
});
// ============================================
// ERROR HANDLING
// ============================================
// 404 handler
app.use((_req, res) => {
    const response = {
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found',
        },
    };
    res.status(404).json(response);
});
// Global error handler
app.use((err, _req, res, _next) => {
    console.error('[ERROR]', err);
    const response = {
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'An internal error occurred'
                : err.message,
        },
    };
    res.status(500).json(response);
});
// ============================================
// SERVER START
// ============================================
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   HR RECRUITER AGENT                                          ║
║   AI-Powered Candidate Screening & Onboarding                 ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   Port:        ${PORT}                                          ║
║   Status:      RUNNING                                        ║
║   Version:     1.0.0                                         ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   Endpoints:                                                  ║
║   - POST   /api/resumes/screen     Screen resumes            ║
║   - POST   /api/candidates/qualify Qualify candidates        ║
║   - POST   /api/interviews/schedule Schedule interviews       ║
║   - POST   /api/onboarding/start    Start onboarding          ║
║   - GET    /api/candidates         List candidates            ║
║   - POST   /api/jobs/match         Match candidates to jobs   ║
║                                                               ║
║   Health:   GET /health                                     ║
║   Metrics:  GET /metrics                                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[SHUTDOWN] SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('[SHUTDOWN] SIGINT received. Shutting down gracefully...');
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=index.js.map