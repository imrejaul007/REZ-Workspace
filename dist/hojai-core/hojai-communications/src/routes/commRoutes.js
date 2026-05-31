import { Router } from 'express';
import { messageService, templateService, campaignService, subscriberService } from '../services';
const router = Router();
// ============ MESSAGES ============
router.post('/messages', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const message = await messageService.send({ tenantId, ...req.body });
        res.status(201).json({ success: true, data: message });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/messages/template', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const message = await messageService.sendTemplate({ tenantId, ...req.body });
        res.status(201).json({ success: true, data: message });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/messages', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const { channel, status, limit, offset } = req.query;
        const result = await messageService.list(tenantId, {
            channel: channel,
            status: status,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/messages/:id', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const message = await messageService.get(req.params.id, tenantId);
        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found' });
        }
        res.json({ success: true, data: message });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/messages/stats', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const { channel } = req.query;
        const stats = await messageService.getStats(tenantId, channel);
        res.json({ success: true, data: stats });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ============ TEMPLATES ============
router.post('/templates', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const template = await templateService.create({ tenantId, ...req.body });
        res.status(201).json({ success: true, data: template });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/templates', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const { channel, category, status } = req.query;
        const result = await templateService.list(tenantId, {
            channel: channel,
            category: category,
            status: status
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/templates/:id', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const template = await templateService.get(req.params.id, tenantId);
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, data: template });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.put('/templates/:id', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const template = await templateService.update(req.params.id, tenantId, req.body);
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, data: template });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.delete('/templates/:id', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const deleted = await templateService.delete(req.params.id, tenantId);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ============ CAMPAIGNS ============
router.post('/campaigns', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const campaign = await campaignService.create({ tenantId, ...req.body });
        res.status(201).json({ success: true, data: campaign });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/campaigns', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const { channel, status, limit, offset } = req.query;
        const result = await campaignService.list(tenantId, {
            channel: channel,
            status: status,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/campaigns/:id', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const campaign = await campaignService.get(req.params.id, tenantId);
        if (!campaign) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }
        res.json({ success: true, data: campaign });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/campaigns/:id/start', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const campaign = await campaignService.start(req.params.id, tenantId);
        if (!campaign) {
            return res.status(404).json({ success: false, error: 'Campaign not found or cannot be started' });
        }
        res.json({ success: true, data: campaign });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/campaigns/:id/pause', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const campaign = await campaignService.pause(req.params.id, tenantId);
        if (!campaign) {
            return res.status(404).json({ success: false, error: 'Campaign not found or cannot be paused' });
        }
        res.json({ success: true, data: campaign });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/campaigns/:id/cancel', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const campaign = await campaignService.cancel(req.params.id, tenantId);
        if (!campaign) {
            return res.status(404).json({ success: false, error: 'Campaign not found or cannot be cancelled' });
        }
        res.json({ success: true, data: campaign });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ============ SUBSCRIBERS ============
router.post('/subscribers', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const subscriber = await subscriberService.create({ tenantId, ...req.body });
        res.status(201).json({ success: true, data: subscriber });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/subscribers', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const { segment, tag, subscribed } = req.query;
        const result = await subscriberService.list(tenantId, {
            segment: segment,
            tag: tag,
            subscribed: subscribed === 'true' ? true : subscribed === 'false' ? false : undefined
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/subscribers/:id', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const subscriber = await subscriberService.get(req.params.id, tenantId);
        if (!subscriber) {
            return res.status(404).json({ success: false, error: 'Subscriber not found' });
        }
        res.json({ success: true, data: subscriber });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/subscribers/:id/unsubscribe', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const { channel } = req.body;
        const subscriber = await subscriberService.unsubscribe(req.params.id, tenantId, channel);
        if (!subscriber) {
            return res.status(404).json({ success: false, error: 'Subscriber not found' });
        }
        res.json({ success: true, data: subscriber });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
export default router;
//# sourceMappingURL=commRoutes.js.map