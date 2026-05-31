"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
const tenantManager_js_1 = require("./services/tenant/tenantManager.js");
const rbacService_js_1 = require("./services/rbac/rbacService.js");
const auditLogger_js_1 = require("./services/audit/auditLogger.js");
const apiGateway_js_1 = __importStar(require("./services/api-gateway/apiGateway.js"));
const tenantRoutes_js_1 = __importDefault(require("./routes/tenant/tenantRoutes.js"));
// ============================================================================
// CONFIG
// ============================================================================
const PORT = process.env.PORT || 4501;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-governance';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
// ============================================================================
// EXPRESS APP
// ============================================================================
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, cors_1.default)({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true }));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Global rate limiting
app.use(apiGateway_js_1.globalLimiter);
// Request logging
app.use(apiGateway_js_1.requestLogger);
// Health check (no auth required)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'hojai-governance',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Readiness check
app.get('/ready', async (req, res) => {
    try {
        const mongoStatus = mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected';
        res.json({
            status: 'ready',
            service: 'hojai-governance',
            mongodb: mongoStatus,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(503).json({ status: 'not_ready', error: 'Service unavailable' });
    }
});
// Request ID middleware
app.use((req, res, next) => {
    req.requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    res.setHeader('X-Request-ID', req.requestId);
    next();
});
// ============================================================================
// ROUTES
// ============================================================================
// Auth routes (login, register, token refresh)
app.use('/api/auth', apiGateway_js_1.authLimiter, apiGateway_js_1.default);
// Tenant routes
app.use('/api/tenants', tenantRoutes_js_1.default);
// ============================================================================
// ERROR HANDLER
// ============================================================================
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path
    });
});
// Error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    console.error('[Error]', {
        requestId: req.requestId,
        path: req.path,
        method: req.method,
        error: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
    // Log to audit
    auditLogger_js_1.auditLogger.log({
        tenantId: req.tenantId,
        userId: req.userId,
        action: 'error',
        resource: req.path,
        status: 'failure',
        metadata: { error: err.message, statusCode }
    }).catch(console.error);
    res.status(statusCode).json({
        success: false,
        error: message,
        requestId: req.requestId
    });
});
// ============================================================================
// START SERVER
// ============================================================================
async function startServer() {
    console.log('[Hojai Governance] Starting server...');
    // Connect to MongoDB
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('[MongoDB] Connected to', MONGODB_URI);
    // Initialize tenant manager
    await tenantManager_js_1.tenantManager.initialize();
    console.log('[Tenant Manager] Initialized');
    // Initialize RBAC
    await rbacService_js_1.rbacService.initialize();
    console.log('[RBAC] Initialized');
    // Start server
    app.listen(PORT, () => {
        console.log(`[Hojai Governance] Server running on port ${PORT}`);
        console.log(`[Hojai Governance] Health check: http://localhost:${PORT}/health`);
    });
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('[Hojai Governance] Shutting down...');
    await mongoose_1.default.disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('[Hojai Governance] Shutting down...');
    await mongoose_1.default.disconnect();
    process.exit(0);
});
startServer().catch((error) => {
    console.error('[Hojai Governance] Failed to start:', error);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map