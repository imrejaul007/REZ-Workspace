"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const costService_js_1 = require("./services/costService.js");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT || 4516;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-cost';
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'hojai-cost' }));
app.post('/api/costs', async (req, res) => {
    const cost = await costService_js_1.costService.trackCost(req.body);
    res.status(201).json({ success: true, data: cost });
});
app.get('/api/costs/summary', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const summary = await costService_js_1.costService.getCostSummary(tenantId, {
        start: new Date(req.query.start),
        end: new Date(req.query.end)
    });
    res.json({ success: true, data: summary });
});
app.get('/api/costs/by-user', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const byUser = await costService_js_1.costService.getCostByUser(tenantId, {
        start: new Date(req.query.start),
        end: new Date(req.query.end)
    });
    res.json({ success: true, data: byUser });
});
app.post('/api/budgets', async (req, res) => {
    const budget = await costService_js_1.costService.createBudget(req.body);
    res.status(201).json({ success: true, data: budget });
});
app.get('/api/budgets', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const budgets = await costService_js_1.costService.getBudgets(tenantId);
    res.json({ success: true, data: budgets });
});
async function start() {
    await mongoose_1.default.connect(MONGODB_URI);
    app.listen(PORT, () => console.log(`[Hojai Cost] Running on port ${PORT}`));
}
start().catch(console.error);
exports.default = app;
