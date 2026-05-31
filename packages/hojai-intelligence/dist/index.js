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
const predict_js_1 = __importDefault(require("./routes/predict.js"));
const recommend_js_1 = __importDefault(require("./routes/recommend.js"));
const decision_js_1 = __importDefault(require("./routes/decision.js"));
const PORT = process.env.PORT || 4530;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-intelligence';
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use((req, res, next) => {
    req.requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    res.setHeader('X-Request-ID', req.requestId);
    next();
});
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'hojai-intelligence', timestamp: new Date().toISOString() });
});
app.get('/ready', async (req, res) => {
    const mongoStatus = mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ status: 'ready', mongodb: mongoStatus, timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/predict', predict_js_1.default);
app.use('/api/recommend', recommend_js_1.default);
app.use('/api/decide', decision_js_1.default);
// Error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});
async function startServer() {
    console.log('[Hojai Intelligence] Starting server...');
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('[MongoDB] Connected to', MONGODB_URI);
    app.listen(PORT, () => {
        console.log(`[Hojai Intelligence] Server running on port ${PORT}`);
    });
}
process.on('SIGTERM', async () => {
    console.log('[Hojai Intelligence] Shutting down...');
    await mongoose_1.default.disconnect();
    process.exit(0);
});
startServer().catch(console.error);
exports.default = app;
//# sourceMappingURL=index.js.map