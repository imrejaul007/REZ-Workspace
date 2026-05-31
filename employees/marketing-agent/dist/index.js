"use strict";
// ============================================
// HOJAI AI - Marketing Agent Main Entry Point
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
const PORT = process.env.PORT || 4761;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-marketing';
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
        service: 'marketing-agent',
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
        service: 'marketing-agent',
        checks: {
            mongodb: mongoStatus
        },
        timestamp: new Date().toISOString()
    });
});
// API routes
app.use('/api', auth_1.requireInternalAuth);
// Content routes
app.use('/api/content', routes_1.contentRoutes);
// Social media routes
app.use('/api/social', routes_1.socialRoutes);
// Campaign routes
app.use('/api/campaigns', routes_1.campaignRoutes);
// SEO routes
app.use('/api/seo', routes_1.seoRoutes);
// Email routes
app.use('/api/email', routes_1.emailRoutes);
// Ad routes
app.use('/api/ads', routes_1.adRoutes);
// Webhook endpoint for social media analytics
app.post('/webhooks/social/:platform', async (req, res) => {
    try {
        const { platform } = req.params;
        const { postId, event, metrics } = req.body;
        logger_1.logger.info('Social webhook received', { platform, event, postId });
        // Process webhook event
        // In production, this would update engagement metrics
        res.json({ success: true, processed: true });
    }
    catch (error) {
        logger_1.logger.error('Social webhook error', { error });
        res.status(500).json({
            success: false,
            error: 'Webhook processing failed'
        });
    }
});
// Webhook for email events
app.post('/webhooks/email', async (req, res) => {
    try {
        const { type, emailCampaignId, timestamp, data } = req.body;
        logger_1.logger.info('Email webhook received', { type, emailCampaignId });
        // Update email campaign stats based on webhook
        // In production, this would update open/click/bounce metrics
        res.json({ success: true, processed: true });
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
            logger_1.logger.info(`HOJAI Marketing Agent started on port ${PORT}`, {
                port: PORT,
                env: process.env.NODE_ENV || 'development',
                mongoStatus: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected'
            });
            console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎯 HOJAI AI - Marketing Agent                          ║
║   Content Generation, Campaigns & Social Media             ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   Status: Running                                         ║
║                                                           ║
║   Endpoints:                                              ║
║   • POST /api/content/generate - Generate content          ║
║   • POST /api/social/post    - Post to social            ║
║   • POST /api/campaigns/create - Create campaign          ║
║   • POST /api/campaigns/:id/launch - Launch campaign     ║
║   • POST /api/seo/optimize   - SEO optimization          ║
║   • POST /api/email/campaign - Email campaign            ║
║   • POST /api/ads/copy       - Generate ad copy          ║
║                                                           ║
║   Health: http://localhost:${PORT}/health                     ║
║   Ready:  http://localhost:${PORT}/ready                     ║
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
        const { Content, SocialPost, Campaign, EmailCampaign, SEOOptimization, AdCopy } = require('./models');
        // Content indexes
        await Content.collection.createIndex({ tenantId: 1, status: 1 });
        await Content.collection.createIndex({ tenantId: 1, type: 1 });
        await Content.collection.createIndex({ tenantId: 1, createdBy: 1 });
        // Social Post indexes
        await SocialPost.collection.createIndex({ tenantId: 1, status: 1 });
        await SocialPost.collection.createIndex({ tenantId: 1, platform: 1 });
        await SocialPost.collection.createIndex({ tenantId: 1, scheduledFor: 1 });
        // Campaign indexes
        await Campaign.collection.createIndex({ tenantId: 1, status: 1 });
        await Campaign.collection.createIndex({ tenantId: 1, type: 1 });
        await Campaign.collection.createIndex({ tenantId: 1, createdBy: 1 });
        // Email Campaign indexes
        await EmailCampaign.collection.createIndex({ tenantId: 1, status: 1 });
        await EmailCampaign.collection.createIndex({ tenantId: 1, campaignId: 1 });
        // SEO Optimization indexes
        await SEOOptimization.collection.createIndex({ tenantId: 1, type: 1 });
        await SEOOptimization.collection.createIndex({ tenantId: 1, url: 1 }, { sparse: true });
        // Ad Copy indexes
        await AdCopy.collection.createIndex({ tenantId: 1, adType: 1 });
        await AdCopy.collection.createIndex({ tenantId: 1, productName: 1 });
        logger_1.logger.info('MongoDB indexes created successfully');
    }
    catch (error) {
        logger_1.logger.warn('Error creating indexes (may already exist)', { error });
    }
}
// Start the server
start();
//# sourceMappingURL=index.js.map