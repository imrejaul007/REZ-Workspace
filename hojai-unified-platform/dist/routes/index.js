import { Router } from 'express';
import { platformService } from '../services';
const router = Router();
// ============ WEBHOOKS ============
// WhatsApp webhook verification
router.get('/webhooks/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'verify_token';
    if (mode === 'subscribe' && token === verifyToken) {
        console.log('WhatsApp webhook verified');
        res.status(200).send(challenge);
    }
    else {
        res.sendStatus(403);
    }
});
// WhatsApp webhook callback
router.post('/webhooks/whatsapp', async (req, res) => {
    try {
        const entry = req.body.entry?.[0];
        if (!entry)
            return res.sendStatus(200);
        const changes = entry.changes || [];
        for (const change of changes) {
            const value = change.value;
            if (value.messages) {
                for (const msg of value.messages) {
                    await platformService.handleIncomingMessage({
                        tenantId: 'default',
                        channel: 'whatsapp',
                        from: {
                            id: msg.from,
                            name: value.contacts?.find((c) => c.wa_id === msg.from)?.profile?.name || 'Unknown',
                            phone: msg.from
                        },
                        type: msg.type,
                        content: {
                            text: msg.text?.body,
                            mediaUrl: msg.image?.url,
                            mediaType: msg.image?.mime_type
                        },
                        metadata: { messageId: msg.id }
                    });
                }
            }
        }
        res.sendStatus(200);
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    }
});
// ============ MESSAGES ============
router.post('/messages/send', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const message = await platformService.sendMessage({ tenantId, ...req.body });
        res.json({ success: true, data: message });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ============ CONVERSATIONS ============
router.get('/conversations', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const { state, channel, agentId, limit, offset } = req.query;
        const result = await platformService.getConversations(tenantId, {
            state: state,
            channel: channel,
            agentId: agentId,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/conversations/:id/assign', async (req, res) => {
    try {
        const { agentId, agentName } = req.body;
        await platformService.assignConversation(req.params.id, agentId, agentName);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/conversations/:id/resolve', async (req, res) => {
    try {
        await platformService.resolveConversation(req.params.id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ============ AGENTS ============
router.post('/agents', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const agent = await platformService.createAgent({ tenantId, ...req.body });
        res.status(201).json({ success: true, data: agent });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/agents', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const { status } = req.query;
        const agents = await platformService.getAgents(tenantId, status);
        res.json({ success: true, data: agents });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/agents/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await platformService.setAgentStatus(req.params.id, status);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ============ CART & COMMERCE ============
router.post('/cart', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const cart = await platformService.createCart({ tenantId, ...req.body });
        res.status(201).json({ success: true, data: cart });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/cart/:id', async (req, res) => {
    try {
        const cart = await platformService.getCart(req.params.id);
        if (!cart)
            return res.status(404).json({ success: false, error: 'Cart not found' });
        res.json({ success: true, data: cart });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/cart/:id/items', async (req, res) => {
    try {
        const cart = await platformService.addToCart(req.params.id, req.body);
        if (!cart)
            return res.status(404).json({ success: false, error: 'Cart not found' });
        res.json({ success: true, data: cart });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/cart/:id/checkout', async (req, res) => {
    try {
        const order = await platformService.checkout(req.params.id, req.body);
        res.status(201).json({ success: true, data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/orders/:id/pay', async (req, res) => {
    try {
        const { customerPhone } = req.body;
        const result = await platformService.initiatePayment(req.params.id, customerPhone);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ============ CAMPAIGNS ============
router.post('/campaigns', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const campaign = await platformService.createCampaign({ tenantId, ...req.body });
        res.status(201).json({ success: true, data: campaign });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/campaigns/:id/start', async (req, res) => {
    try {
        await platformService.startCampaign(req.params.id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ============ ANALYTICS ============
router.get('/analytics', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        const analytics = await platformService.getAnalytics(tenantId);
        res.json({ success: true, data: analytics });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
export default router;
//# sourceMappingURL=index.js.map