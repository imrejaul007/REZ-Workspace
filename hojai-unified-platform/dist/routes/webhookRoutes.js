import { Router } from 'express';
import crypto from 'crypto';
import { paymentWebhookService } from '../services/PaymentWebhookService';
import { whatsAppIntegration } from '../services/WhatsAppIntegration';
import { ConversationModel, MessageModel } from '../models';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
// ============ RAZORPAY WEBHOOK ============
router.post('/webhooks/razorpay', async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret';
        // Verify signature
        const body = JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');
        if (signature !== expectedSignature) {
            console.warn('[Webhook] Invalid signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }
        await paymentWebhookService.handleRazorpayWebhook(req.body);
        res.json({ status: 'ok' });
    }
    catch (error) {
        console.error('[Webhook] Razorpay error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
// ============ WHATSAPP WEBHOOK ============
router.get('/webhooks/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'verify_token';
    if (mode === 'subscribe' && token === verifyToken) {
        console.log('[Webhook] WhatsApp webhook verified');
        res.status(200).send(challenge);
    }
    else {
        console.warn('[Webhook] WhatsApp verification failed');
        res.sendStatus(403);
    }
});
router.post('/webhooks/whatsapp', async (req, res) => {
    try {
        // Verify signature
        const signature = req.headers['x-hub-signature-256'];
        if (signature) {
            const appSecret = process.env.WHATSAPP_APP_SECRET || '';
            const expected = 'sha256=' + crypto
                .createHmac('sha256', appSecret)
                .update(JSON.stringify(req.body))
                .digest('hex');
            if (signature !== expected) {
                console.warn('[Webhook] Invalid WhatsApp signature');
                return res.sendStatus(403);
            }
        }
        const entry = req.body.entry?.[0];
        if (!entry) {
            return res.sendStatus(200);
        }
        const changes = entry.changes || [];
        for (const change of changes) {
            const value = change.value;
            // Handle messages
            if (value.messages) {
                for (const msg of value.messages) {
                    await handleIncomingMessage(msg, value, entry.id);
                }
            }
            // Handle status updates
            if (value.statuses) {
                for (const status of value.statuses) {
                    await handleStatusUpdate(status);
                }
            }
            // Handle opt-ins
            if (value.optins) {
                for (const optin of value.optins) {
                    console.log(`[Webhook] Opt-in from ${optin.phone_number_id}`);
                }
            }
        }
        res.sendStatus(200);
    }
    catch (error) {
        console.error('[Webhook] WhatsApp error:', error);
        res.sendStatus(500);
    }
});
/**
 * Handle incoming WhatsApp message
 */
async function handleIncomingMessage(msg, value, igUserId) {
    const tenantId = 'default';
    const contact = value.contacts?.find((c) => c.wa_id === msg.from);
    const customerName = contact?.profile?.name || 'Unknown';
    // Find or create conversation
    let conversation = await ConversationModel.findOne({
        'customer.id': msg.from,
        channel: 'whatsapp',
        state: { $in: ['active', 'assigned'] }
    });
    if (!conversation) {
        conversation = new ConversationModel({
            conversationId: uuidv4(),
            tenantId,
            channel: 'whatsapp',
            state: 'active',
            customer: {
                id: msg.from,
                name: customerName,
                phone: msg.from,
                tier: 'standard'
            },
            messageCount: 0,
            priority: 'normal'
        });
        await conversation.save();
    }
    // Store message
    const message = new MessageModel({
        messageId: uuidv4(),
        tenantId,
        conversationId: conversation.conversationId,
        channel: 'whatsapp',
        direction: 'inbound',
        type: msg.type,
        from: { id: msg.from, name: customerName, phone: msg.from },
        to: { id: igUserId, name: 'Business' },
        content: {
            text: msg.text?.body,
            mediaUrl: msg.image?.url,
            mediaType: msg.image?.mime_type
        },
        status: 'delivered',
        timestamp: new Date(parseInt(msg.timestamp) * 1000)
    });
    await message.save();
    // Update conversation
    conversation.lastMessage = msg.text?.body || `[${msg.type}]`;
    conversation.lastMessageAt = new Date();
    conversation.messageCount++;
    await conversation.save();
    // Handle commands
    await handleCommand(msg.from, msg.text?.body || '', conversation);
}
/**
 * Handle status updates
 */
async function handleStatusUpdate(status) {
    const { id, status: msgStatus, recipient_id } = status;
    await MessageModel.findOneAndUpdate({ 'metadata.providerMessageId': id }, {
        status: msgStatus === 'read' ? 'read' : msgStatus === 'delivered' ? 'delivered' : 'sent'
    });
    console.log(`[Webhook] Message ${id} status: ${msgStatus} for ${recipient_id}`);
}
/**
 * Handle commands from messages
 */
async function handleCommand(phone, text, conversation) {
    const lowerText = text.toLowerCase().trim();
    // Help
    if (lowerText === 'hi' || lowerText === 'hello' || lowerText === 'help') {
        const response = `👋 Hi ${conversation.customer.name}!

Welcome to our store. Here's what you can do:

🛒 *Shop* - Browse our products
📦 *Orders* - View your orders
🛒 *Cart* - View your cart
❓ *Help* - Get support

Just type a command or ask me anything!`;
        await whatsAppIntegration.sendText(phone, response);
        return;
    }
    // Order status
    if (lowerText.startsWith('order') || lowerText === 'orders') {
        await whatsAppIntegration.sendText(phone, '📦 To check your order status, please visit: https://yourstore.com/orders\n\nOr share your order number.');
        return;
    }
    // Checkout
    if (lowerText === 'checkout' || lowerText === 'pay') {
        await whatsAppIntegration.sendText(phone, '🛒 To checkout, add items to your cart first and then type "checkout".');
        return;
    }
    // Default: echo with suggestions
    await whatsAppIntegration.sendButtons(phone, `I didn't understand that. How can I help you?`, [
        { id: 'shop', title: '🛒 Shop' },
        { id: 'orders', title: '📦 Orders' },
        { id: 'help', title: '❓ Help' }
    ]);
}
export default router;
//# sourceMappingURL=webhookRoutes.js.map