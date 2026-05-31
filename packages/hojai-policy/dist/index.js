"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const consentService_js_1 = require("./services/consentService.js");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT || 4505;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-policy';
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'hojai-policy' }));
// Policy check
app.post('/api/policy/check', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const result = await consentService_js_1.policyService.canProcess({
        tenantId,
        ...req.body
    });
    res.json({ success: true, data: result });
});
// Consent management
app.post('/api/consent', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const consent = await consentService_js_1.policyService.grantConsent({
        tenantId,
        ...req.body
    });
    res.status(201).json({ success: true, data: consent });
});
app.delete('/api/consent/:type', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    await consentService_js_1.policyService.withdrawConsent({
        tenantId,
        userId: req.body.userId,
        type: req.params.type
    });
    res.json({ success: true });
});
app.get('/api/consent/:userId', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const summary = await consentService_js_1.policyService.getConsentSummary(tenantId, req.params.userId);
    res.json({ success: true, data: summary });
});
// Data rights
app.post('/api/data-rights', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const request = await consentService_js_1.policyService.handleDataRightRequest({
        tenantId,
        ...req.body
    });
    res.status(201).json({ success: true, data: request });
});
app.post('/api/data-rights/:id/fulfill', async (req, res) => {
    await consentService_js_1.policyService.fulfillDataRight({
        requestId: req.params.id,
        ...req.body
    });
    res.json({ success: true });
});
// Audit logs
app.get('/api/audit', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const logs = await consentService_js_1.policyService.exportAuditLogs({
        tenantId,
        startDate: new Date(req.query.startDate),
        endDate: new Date(req.query.endDate),
        category: req.query.category
    });
    res.json({ success: true, data: logs });
});
async function start() {
    await mongoose_1.default.connect(MONGODB_URI);
    app.listen(PORT, () => console.log(`[Hojai Policy] Running on port ${PORT}`));
}
start().catch(console.error);
exports.default = app;
