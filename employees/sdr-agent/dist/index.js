"use strict";
// ============================================
// HOJAI AI - SDR Agent Main Entry Point
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("./utils/logger");
const auth_1 = require("./middleware/auth");
const routes_1 = require("./routes");
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 4757;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-sdr';
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:']
        }
    }
}));
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'X-Internal-Token']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT || '100'),
    message: JSON.stringify({
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later.'
        }
    }),
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api', limiter);
// Request logging middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    // Log request
    logger_1.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        contentType: req.get('content-type')
    });
    // Log response on finish
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger_1.logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
});
// Health check endpoints (no auth required)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'sdr-agent',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
app.get('/ready', async (req, res) => {
    const mongoStatus = mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected';
    const isReady = mongoStatus === 'connected';
    res.status(isReady ? 200 : 503).json({
        status: isReady ? 'ready' : 'not_ready',
        service: 'sdr-agent',
        checks: {
            mongodb: mongoStatus
        },
        timestamp: new Date().toISOString()
    });
});
// API routes
app.use('/api', auth_1.requireInternalAuth);
app.use('/api/prospects', routes_1.prospectRoutes);
app.use('/api/leads', routes_1.leadRoutes);
app.use('/api/outreach', routes_1.outreachRoutes);
app.use('/api/followups', routes_1.followupRoutes);
app.use('/api/qualification', routes_1.qualificationRoutes);
// Webhook endpoint for CRM callbacks
app.post('/webhooks/crm', async (req, res) => {
    try {
        const { crmConnector } = require('./services/crmConnector');
        if (!crmConnector.isConnected()) {
            return res.status(400).json({
                success: false,
                error: 'CRM not configured'
            });
        }
        const result = await crmConnector.handleWebhook(req.body);
        if (result) {
            logger_1.logger.info('CRM webhook received', { type: result.type });
        }
        res.json({ success: true });
    }
    catch (error) {
        logger_1.logger.error('CRM webhook error', { error });
        res.status(500).json({
            success: false,
            error: 'Webhook processing failed'
        });
    }
});
// Webhook for email events (SendGrid, Mailgun, etc.)
app.post('/webhooks/email', async (req, res) => {
    try {
        const { outreachEngine } = require('./services/outreachEngine');
        const { OutreachStatus } = require('./types');
        const { type, outreachId, timestamp } = req.body;
        let status;
        let metadata = {};
        switch (type) {
            case 'delivered':
                status = 'delivered';
                metadata = { deliveredAt: new Date(timestamp) };
                break;
            case 'opened':
                status = 'opened';
                metadata = { openedAt: new Date(timestamp) };
                break;
            case 'clicked':
                status = 'clicked';
                metadata = { clickedAt: new Date(timestamp) };
                break;
            case 'replied':
                status = 'replied';
                metadata = { repliedAt: new Date(timestamp) };
                break;
            case 'bounced':
                status = 'bounced';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Unknown webhook event type'
                });
        }
        await outreachEngine.updateOutreachStatus(req.headers['x-tenant-id'] || 'default', outreachId, status, metadata);
        logger_1.logger.info(`Email webhook: ${type}`, { outreachId });
        res.json({ success: true });
    }
    catch (error) {
        logger_1.logger.error('Email webhook error', { error });
        res.status(500).json({
            success: false,
            error: 'Webhook processing failed'
        });
    }
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`
        }
    });
});
// Error handler
app.use((err, req, res, next) => {
    logger_1.logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : err.message
        }
    });
});
// Graceful shutdown
async function shutdown(signal) {
    logger_1.logger.info(`Received ${signal}, shutting down gracefully...`);
    try {
        await mongoose_1.default.connection.close();
        logger_1.logger.info('MongoDB connection closed');
    }
    catch (error) {
        logger_1.logger.error('Error closing MongoDB connection', { error });
    }
    process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
// Start server
async function start() {
    try {
        // Connect to MongoDB
        logger_1.logger.info('Connecting to MongoDB...', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });
        await mongoose_1.default.connect(MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        logger_1.logger.info('Connected to MongoDB');
        // Create indexes
        await createIndexes();
        // Start listening
        app.listen(PORT, () => {
            logger_1.logger.info(`HOJAI SDR Agent started on port ${PORT}`, {
                port: PORT,
                env: process.env.NODE_ENV || 'development',
                mongoStatus: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected'
            });
            console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎯 HOJAI AI - SDR Agent                                 ║
║   Sales Development Representative Service                 ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   Status: Running                                          ║
║                                                           ║
║   Endpoints:                                              ║
║   • POST /api/prospects/find     - Find prospects         ║
║   • POST /api/prospects/qualify  - Qualify lead          ║
║   • POST /api/outreach/send      - Send outreach          ║
║   • POST /api/followups/schedule - Schedule follow-ups    ║
║   • GET  /api/leads              - List qualified leads   ║
║   • PUT  /api/leads/:id/stage    - Update stage           ║
║                                                           ║
║   Health: http://localhost:${PORT}/health                   ║
║   Ready:  http://localhost:${PORT}/ready                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', { error });
        process.exit(1);
    }
}
// Create MongoDB indexes
async function createIndexes() {
    try {
        const { Contact, Company, Lead, Qualification, Outreach, Followup, Activity } = require('./models');
        // Contact indexes
        await Contact.collection.createIndex({ tenantId: 1, email: 1 }, { unique: true, sparse: true });
        await Contact.collection.createIndex({ tenantId: 1, industry: 1 });
        await Contact.collection.createIndex({ tenantId: 1, companySize: 1 });
        // Company indexes
        await Company.collection.createIndex({ tenantId: 1, domain: 1 }, { unique: true, sparse: true });
        await Company.collection.createIndex({ tenantId: 1, industry: 1 });
        // Lead indexes
        await Lead.collection.createIndex({ tenantId: 1, stage: 1 });
        await Lead.collection.createIndex({ tenantId: 1, score: 1 });
        await Lead.collection.createIndex({ tenantId: 1, nextFollowupAt: 1 });
        await Lead.collection.createIndex({ tenantId: 1, contactId: 1 }, { unique: true });
        // Qualification indexes
        await Qualification.collection.createIndex({ tenantId: 1, leadId: 1 }, { unique: true });
        // Outreach indexes
        await Outreach.collection.createIndex({ tenantId: 1, status: 1 });
        await Outreach.collection.createIndex({ tenantId: 1, sentAt: 1 });
        // Followup indexes
        await Followup.collection.createIndex({ tenantId: 1, status: 1, scheduledFor: 1 });
        // Activity indexes
        await Activity.collection.createIndex({ tenantId: 1, leadId: 1, createdAt: -1 });
        logger_1.logger.info('MongoDB indexes created successfully');
    }
    catch (error) {
        logger_1.logger.warn('Error creating indexes (may already exist)', { error });
    }
}
// Start the server
start();
//# sourceMappingURL=index.js.map