"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
const events_js_1 = __importDefault(require("./routes/events.js"));
const subscriptions_js_1 = __importDefault(require("./routes/subscriptions.js"));
const dlq_js_1 = __importDefault(require("./routes/dlq.js"));
const eventBus_js_1 = require("./services/eventBus.js");
// ============================================================================
// CONFIG
// ============================================================================
const PORT = process.env.PORT || 4510;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-event';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
// ============================================================================
// EXPRESS APP
// ============================================================================
const app = (0, express_1.default)();
// Security
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
// Request ID
app.use((req, res, next) => {
    req.requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    res.setHeader('X-Request-ID', req.requestId);
    next();
});
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'hojai-event',
        timestamp: new Date().toISOString()
    });
});
app.get('/ready', async (req, res) => {
    const mongoStatus = mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: 'ready',
        mongodb: mongoStatus,
        timestamp: new Date().toISOString()
    });
});
// Routes
app.use('/api/events', events_js_1.default);
app.use('/api/subscriptions', subscriptions_js_1.default);
app.use('/api/dlq', dlq_js_1.default);
// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});
// ============================================================================
// DATABASE
// ============================================================================
async function connectDatabase() {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('[MongoDB] Connected to', MONGODB_URI);
    }
    catch (error) {
        console.error('[MongoDB] Connection failed:', error);
        process.exit(1);
    }
}
// ============================================================================
// SERVER
// ============================================================================
async function startServer() {
    console.log('[Hojai Event] Starting server...');
    await connectDatabase();
    await eventBus_js_1.eventBusService.initialize();
    app.listen(PORT, () => {
        console.log(`[Hojai Event] Server running on port ${PORT}`);
        console.log(`[Hojai Event] Health: http://localhost:${PORT}/health`);
    });
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('[Hojai Event] Shutting down...');
    await eventBus_js_1.eventBusService.shutdown();
    await mongoose_1.default.disconnect();
    process.exit(0);
});
startServer().catch(console.error);
exports.default = app;
//# sourceMappingURL=index.js.map