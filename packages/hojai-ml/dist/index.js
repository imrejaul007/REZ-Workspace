"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const modelService_js_1 = require("./services/modelService.js");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT || 4540;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-ml';
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'hojai-ml' }));
// Models
app.post('/api/models', async (req, res) => {
    const model = await modelService_js_1.modelService.registerModel(req.body);
    res.status(201).json({ success: true, data: model });
});
app.get('/api/models', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const models = await modelService_js_1.modelService.getAvailableModels(tenantId, req.query.tier);
    res.json({ success: true, data: models });
});
// Routing
app.post('/api/models/route', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const model = await modelService_js_1.modelService.getBestModel({ tenantId, ...req.body });
    res.json({ success: true, data: model });
});
app.post('/api/routing-rules', async (req, res) => {
    const rule = await modelService_js_1.modelService.createRoutingRule(req.body);
    res.status(201).json({ success: true, data: rule });
});
// Inference
app.post('/api/infer', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const result = await modelService_js_1.modelService.infer({ tenantId, ...req.body });
    res.json({ success: true, data: result });
});
// Cost estimate
app.get('/api/cost-estimate', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const estimate = await modelService_js_1.modelService.getCostEstimate(tenantId, req.query.task, req.query.tokens ? parseInt(req.query.tokens) : undefined);
    res.json({ success: true, data: estimate });
});
// Prompt templates
app.post('/api/prompts', async (req, res) => {
    const template = await modelService_js_1.modelService.createPromptTemplate(req.body);
    res.status(201).json({ success: true, data: template });
});
app.post('/api/prompts/render', (req, res) => {
    const { template, variables } = req.body;
    const rendered = modelService_js_1.modelService.renderPrompt(template, variables);
    res.json({ success: true, data: rendered });
});
async function start() {
    await mongoose_1.default.connect(MONGODB_URI);
    app.listen(PORT, () => console.log(`[Hojai ML] Running on port ${PORT}`));
}
start().catch(console.error);
exports.default = app;
