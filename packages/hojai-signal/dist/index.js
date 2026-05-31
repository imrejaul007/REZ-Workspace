"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const signalService_js_1 = require("./services/signalService.js");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT || 4515;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-signal';
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'hojai-signal' }));
// Validate and process event
app.post('/api/signal/validate', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const result = await signalService_js_1.signalService.processEvent(tenantId, req.body);
    res.status(201).json({ success: true, data: result });
});
// Batch validate
app.post('/api/signal/validate/batch', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const results = await Promise.all(req.body.events.map((e) => signalService_js_1.signalService.processEvent(tenantId, e)));
    res.status(201).json({ success: true, data: { processed: results.length, results } });
});
// Quality metrics
app.get('/api/signal/metrics', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const metrics = await signalService_js_1.signalService.getQualityMetrics(tenantId, req.query.period || 'day');
    res.json({ success: true, data: metrics });
});
async function start() {
    await mongoose_1.default.connect(MONGODB_URI);
    app.listen(PORT, () => console.log(`[Hojai Signal] Running on port ${PORT}`));
}
start().catch(console.error);
exports.default = app;
