"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const notificationService_js_1 = require("./services/notificationService.js");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT || 4590;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-communications';
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'hojai-communications' }));
// Send message
app.post('/api/messages', async (req, res) => {
    const message = await notificationService_js_1.communicationsService.sendMessage({
        tenantId: req.headers['x-tenant-id'],
        ...req.body
    });
    res.status(201).json({ success: true, data: message });
});
// Webhook (from providers)
app.post('/api/webhooks/:channel', async (req, res) => {
    const { channel } = req.params;
    const { externalId, status, metadata } = req.body;
    await notificationService_js_1.communicationsService.handleWebhook({
        tenantId: req.headers['x-tenant-id'],
        channel: channel,
        externalId,
        event: status,
        metadata
    });
    res.sendStatus(200);
});
// Templates
app.post('/api/templates', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const template = await notificationService_js_1.communicationsService.createTemplate({ ...req.body, tenantId });
    res.status(201).json({ success: true, data: template });
});
app.get('/api/templates', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const templates = await notificationService_js_1.communicationsService.getTemplates(tenantId, req.query.channel);
    res.json({ success: true, data: templates });
});
// Campaigns
app.post('/api/campaigns', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const campaign = await notificationService_js_1.communicationsService.createCampaign({ ...req.body, tenantId });
    res.status(201).json({ success: true, data: campaign });
});
app.get('/api/campaigns', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const CampaignModel = mongoose_1.default.model('Campaign');
    const campaigns = await CampaignModel.find({ tenantId }).sort({ createdAt: -1 });
    res.json({ success: true, data: campaigns });
});
app.get('/api/campaigns/:id', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const CampaignModel = mongoose_1.default.model('Campaign');
    const campaign = await CampaignModel.findOne({ _id: req.params.id, tenantId });
    if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    res.json({ success: true, data: campaign });
});
app.post('/api/campaigns/:id/execute', async (req, res) => {
    try {
        const result = await notificationService_js_1.communicationsService.executeCampaign(req.params.id);
        res.json({ success: true, data: result });
    }
    catch (error) {
        console.error('[Campaign] Execution failed:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});
app.get('/api/campaigns/:id/stats', async (req, res) => {
    const tenantId = req.headers['x-tenant-id'];
    const stats = await notificationService_js_1.communicationsService.getCampaignStats(tenantId, req.params.id);
    res.json({ success: true, data: stats });
});
// Process scheduled messages (for cron job)
app.post('/api/messages/process-scheduled', async (req, res) => {
    try {
        const result = await notificationService_js_1.communicationsService.processScheduledMessages();
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});
async function start() {
    await mongoose_1.default.connect(MONGODB_URI);
    app.listen(PORT, () => console.log(`[Hojai Communications] Running on port ${PORT}`));
}
start().catch(console.error);
exports.default = app;
