"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const eventService_js_1 = require("../services/eventService.js");
const router = express_1.default.Router();
// Signal types
const SIGNAL_TYPES = [
    'chat.engaged',
    'chat.intent.detected',
    'chat.conversion.order',
    'chat.conversion.booking',
    'chat.feedback.received',
    'loyalty.points.earned',
    'engagement.click',
    'engagement.view'
];
// Receive signal from Hojai
router.post('/signals', async (req, res) => {
    const { type, userId, merchantId, data, confidence, source } = req.body;
    if (!type || !userId) {
        return res.status(400).json({ error: 'type and userId required' });
    }
    try {
        // Store signal
        const { id } = await eventService_js_1.eventBusService.publish({
            type: `signal.${type}`,
            userId,
            tenantId: merchantId,
            data: { signal: data, source, confidence }
        });
        // Forward to intelligence services
        if (source === 'hojai') {
            await eventService_js_1.eventBusService.forwardToRez({
                type: `signal.${type}`,
                userId,
                merchantId,
                data,
                source: 'hojai-whatsapp'
            });
        }
        res.json({ success: true, id });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to process signal' });
    }
});
// Receive engagement event
router.post('/engagement', async (req, res) => {
    const { userId, merchantId, action, metadata } = req.body;
    try {
        const { id } = await eventService_js_1.eventBusService.publish({
            type: `engagement.${action}`,
            userId,
            tenantId: merchantId,
            data: metadata
        });
        res.json({ success: true, id });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});
// Receive commerce event
router.post('/commerce', async (req, res) => {
    const { userId, merchantId, event, amount, items } = req.body;
    try {
        const { id } = await eventService_js_1.eventBusService.publish({
            type: `commerce.${event}`,
            userId,
            tenantId: merchantId,
            data: { amount, items }
        });
        res.json({ success: true, id });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});
exports.default = router;
//# sourceMappingURL=signals.js.map