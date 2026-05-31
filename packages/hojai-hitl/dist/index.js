"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const hitlService_js_1 = require("./services/hitlService.js");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT || 4517;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-hitl';
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'hojai-hitl' }));
// Check if review needed
app.post('/api/hitl/check', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const result = await hitlService_js_1.hitlService.shouldReview({ tenantId, ...req.body });
    res.json({ success: true, data: result });
});
// Create review
app.post('/api/reviews', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const review = await hitlService_js_1.hitlService.createReview({ tenantId, ...req.body });
    res.status(201).json({ success: true, data: review });
});
// Get pending reviews
app.get('/api/reviews/pending', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const reviews = await hitlService_js_1.hitlService.getPendingReviews(tenantId, {
        assignedTo: req.query.assignedTo,
        priority: req.query.priority
    });
    res.json({ success: true, data: reviews });
});
// Decide on review
app.post('/api/reviews/:id/decide', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const review = await hitlService_js_1.hitlService.decide({ reviewId: req.params.id, tenantId, ...req.body });
    res.json({ success: true, data: review });
});
// Check escalation
app.post('/api/escalation/check', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const result = await hitlService_js_1.hitlService.checkEscalation({ tenantId, ...req.body });
    res.json({ success: true, data: result });
});
// Stats
app.get('/api/stats', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const stats = await hitlService_js_1.hitlService.getStats(tenantId);
    res.json({ success: true, data: stats });
});
async function start() {
    await mongoose_1.default.connect(MONGODB_URI);
    app.listen(PORT, () => console.log(`[Hojai HITL] Running on port ${PORT}`));
}
start().catch(console.error);
exports.default = app;
