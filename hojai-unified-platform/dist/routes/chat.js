import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { requireAuth, successResponse } from '../middleware/auth.js';
import { handleError } from '../utils/errors.js';
// ============================================================================
// IN-MEMORY STORAGE (Replace with MongoDB in production)
// ============================================================================
const conversations = new Map();
const messages = new Map();
const conversationMessages = new Map();
// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
const SendMessageSchema = z.object({
    conversationId: z.string().optional(),
    customerId: z.string(),
    customerName: z.string(),
    customerPhone: z.string().optional(),
    customerEmail: z.string().email().optional(),
    channel: z.enum(['whatsapp', 'instagram', 'webchat', 'sms', 'email']),
    type: z.enum(['text', 'image', 'video', 'audio', 'document', 'buttons', 'location']),
    content: z.object({
        text: z.string().optional(),
        mediaUrl: z.string().url().optional(),
        mediaType: z.string().optional(),
        caption: z.string().optional(),
        buttons: z.array(z.object({
            id: z.string(),
            title: z.string(),
            type: z.enum(['url', 'quick_reply', 'phone']).optional()
        })).optional()
    })
});
const CreateConversationSchema = z.object({
    customerId: z.string(),
    customerName: z.string(),
    customerPhone: z.string().optional(),
    customerEmail: z.string().email().optional(),
    channel: z.enum(['whatsapp', 'instagram', 'webchat', 'sms', 'email']),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    tags: z.array(z.string()).optional(),
    initialMessage: z.string().optional()
});
const UpdateConversationSchema = z.object({
    state: z.enum(['active', 'queued', 'assigned', 'resolved', 'closed']).optional(),
    assignedAgentId: z.string().optional(),
    assignedAgentName: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    tags: z.array(z.string()).optional()
});
// ============================================================================
// ROUTER
// ============================================================================
const router = Router();
// ============================================================================
// WHATSAPP WEBHOOK (Public)
// ============================================================================
// WhatsApp webhook verification
router.get('/webhooks/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'hojai_verify_token';
    if (mode === 'subscribe' && token === verifyToken) {
        console.log('[WhatsApp] Webhook verified');
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
        if (!entry) {
            res.sendStatus(200);
            return;
        }
        const changes = entry.changes || [];
        for (const change of changes) {
            const value = change.value;
            if (!value)
                continue;
            // Handle incoming messages
            if (value.messages) {
                for (const msg of value.messages) {
                    const phone = msg.from;
                    const name = value.contacts?.find((c) => c.wa_id === phone)?.profile?.name || 'Unknown';
                    await handleIncomingWhatsAppMessage({
                        phone,
                        name,
                        type: msg.type,
                        content: {
                            text: msg.text?.body,
                            mediaUrl: msg.image?.url || msg.video?.url || msg.audio?.url || msg.document?.url,
                            mediaType: msg.type
                        },
                        messageId: msg.id,
                        timestamp: new Date(msg.timestamp * 1000)
                    });
                }
            }
            // Handle message status updates
            if (value.statuses) {
                for (const status of value.statuses) {
                    await handleMessageStatusUpdate(status);
                }
            }
        }
        res.sendStatus(200);
    }
    catch (error) {
        console.error('[WhatsApp] Webhook error:', error);
        res.sendStatus(500);
    }
});
// Instagram webhook verification
router.get('/webhooks/instagram', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'hojai_verify_token';
    if (mode === 'subscribe' && token === verifyToken) {
        console.log('[Instagram] Webhook verified');
        res.status(200).send(challenge);
    }
    else {
        res.sendStatus(403);
    }
});
// Instagram webhook callback
router.post('/webhooks/instagram', async (req, res) => {
    try {
        const { entry } = req.body;
        if (!entry?.[0]) {
            res.sendStatus(200);
            return;
        }
        const messaging = entry[0].messaging;
        if (messaging) {
            for (const msg of messaging) {
                const senderId = msg.sender.id;
                const recipientId = msg.recipient.id;
                if (msg.message) {
                    await handleIncomingInstagramMessage({
                        instagramId: senderId,
                        name: 'Instagram User',
                        type: msg.message.is_echo ? 'sent' : 'received',
                        content: {
                            text: msg.message.text,
                            mediaUrl: msg.message.attachments?.find((a) => a.type === 'image')?.payload?.url,
                            mediaType: msg.message.attachments?.[0]?.type
                        },
                        messageId: msg.message.mid,
                        timestamp: new Date()
                    });
                }
            }
        }
        res.sendStatus(200);
    }
    catch (error) {
        console.error('[Instagram] Webhook error:', error);
        res.sendStatus(500);
    }
});
// ============================================================================
// CONVERSATION ENDPOINTS
// ============================================================================
// Create or get conversation
router.post('/conversations', requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const validated = CreateConversationSchema.parse(req.body);
        // Check for existing active conversation
        let conversation = Array.from(conversations.values()).find(c => c.customerId === validated.customerId &&
            c.channel === validated.channel &&
            c.state !== 'closed');
        if (!conversation) {
            conversation = {
                id: uuidv4(),
                tenantId: authReq.tenant.tenantId,
                customerId: validated.customerId,
                customerName: validated.customerName,
                customerPhone: validated.customerPhone,
                customerEmail: validated.customerEmail,
                channel: validated.channel,
                state: 'active',
                aiHandled: true,
                messageCount: 0,
                priority: validated.priority,
                tags: validated.tags,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            conversations.set(conversation.id, conversation);
            conversationMessages.set(conversation.id, []);
            // Add initial message if provided
            if (validated.initialMessage) {
                const initialMsg = {
                    id: uuidv4(),
                    tenantId: authReq.tenant.tenantId,
                    conversationId: conversation.id,
                    senderId: validated.customerId,
                    senderType: 'customer',
                    senderName: validated.customerName,
                    content: { text: validated.initialMessage },
                    type: 'text',
                    status: 'delivered',
                    channel: validated.channel,
                    createdAt: new Date()
                };
                messages.set(initialMsg.id, initialMsg);
                conversationMessages.get(conversation.id)?.push(initialMsg.id);
                conversation.lastMessage = validated.initialMessage;
                conversation.lastMessageAt = new Date();
                conversation.messageCount = 1;
            }
        }
        successResponse(res, conversation, 201);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return handleError(res, error, 400);
        }
        handleError(res, error);
    }
});
// List conversations
router.get('/conversations', requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const { state, channel, agentId, limit = '50', offset = '0' } = req.query;
        let filtered = Array.from(conversations.values()).filter(c => c.tenantId === authReq.tenant.tenantId);
        if (state) {
            filtered = filtered.filter(c => c.state === state);
        }
        if (channel) {
            filtered = filtered.filter(c => c.channel === channel);
        }
        if (agentId) {
            filtered = filtered.filter(c => c.assignedAgentId === agentId);
        }
        // Sort by priority and last message time
        filtered.sort((a, b) => {
            const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0)
                return priorityDiff;
            return (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0);
        });
        const total = filtered.length;
        const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));
        successResponse(res, {
            conversations: paginated,
            total,
            limit: Number(limit),
            offset: Number(offset)
        });
    }
    catch (error) {
        handleError(res, error);
    }
});
// Get single conversation
router.get('/conversations/:id', requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const conversation = conversations.get(req.params.id);
        if (!conversation || conversation.tenantId !== authReq.tenant.tenantId) {
            return handleError(res, 'Conversation not found', 404);
        }
        successResponse(res, conversation);
    }
    catch (error) {
        handleError(res, error);
    }
});
// Update conversation
router.patch('/conversations/:id', requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const conversation = conversations.get(req.params.id);
        if (!conversation || conversation.tenantId !== authReq.tenant.tenantId) {
            return handleError(res, 'Conversation not found', 404);
        }
        const validated = UpdateConversationSchema.parse(req.body);
        if (validated.state)
            conversation.state = validated.state;
        if (validated.assignedAgentId)
            conversation.assignedAgentId = validated.assignedAgentId;
        if (validated.assignedAgentName)
            conversation.assignedAgentName = validated.assignedAgentName;
        if (validated.priority)
            conversation.priority = validated.priority;
        if (validated.tags)
            conversation.tags = validated.tags;
        conversation.updatedAt = new Date();
        successResponse(res, conversation);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return handleError(res, error, 400);
        }
        handleError(res, error);
    }
});
// Assign conversation to agent
router.post('/conversations/:id/assign', requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const conversation = conversations.get(req.params.id);
        if (!conversation || conversation.tenantId !== authReq.tenant.tenantId) {
            return handleError(res, 'Conversation not found', 404);
        }
        const { agentId, agentName } = req.body;
        if (!agentId || !agentName) {
            return handleError(res, 'agentId and agentName are required', 400);
        }
        conversation.assignedAgentId = agentId;
        conversation.assignedAgentName = agentName;
        conversation.state = 'assigned';
        conversation.aiHandled = false;
        conversation.updatedAt = new Date();
        successResponse(res, conversation);
    }
    catch (error) {
        handleError(res, error);
    }
});
// ============================================================================
// MESSAGE ENDPOINTS
// ============================================================================
// Send message
router.post('/messages/send', requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const validated = SendMessageSchema.parse(req.body);
        // Find or create conversation
        let conversation = validated.conversationId
            ? conversations.get(validated.conversationId)
            : Array.from(conversations.values()).find(c => c.customerId === validated.customerId &&
                c.channel === validated.channel &&
                c.state !== 'closed');
        if (!conversation) {
            conversation = {
                id: uuidv4(),
                tenantId: authReq.tenant.tenantId,
                customerId: validated.customerId,
                customerName: validated.customerName,
                customerPhone: validated.customerPhone,
                customerEmail: validated.customerEmail,
                channel: validated.channel,
                state: 'active',
                aiHandled: true,
                messageCount: 0,
                priority: 'normal',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            conversations.set(conversation.id, conversation);
            conversationMessages.set(conversation.id, []);
        }
        // Create message
        const message = {
            id: uuidv4(),
            tenantId: authReq.tenant.tenantId,
            conversationId: conversation.id,
            senderId: authReq.tenant.userId || 'system',
            senderType: authReq.tenant.role === 'agent' ? 'agent' : authReq.tenant.role === 'admin' ? 'agent' : 'bot',
            senderName: authReq.tenant.role === 'agent' ? 'Agent' : 'Hojai Bot',
            content: {
                text: validated.content.text,
                mediaUrl: validated.content.mediaUrl,
                mediaType: validated.content.mediaType,
                buttons: validated.content.buttons?.map(b => ({
                    id: b.id,
                    title: b.title,
                    type: b.type || 'quick_reply'
                }))
            },
            type: validated.type,
            status: 'sent',
            channel: validated.channel,
            createdAt: new Date()
        };
        messages.set(message.id, message);
        conversationMessages.get(conversation.id)?.push(message.id);
        // Update conversation
        conversation.lastMessage = validated.content.text || `[${validated.type}]`;
        conversation.lastMessageAt = new Date();
        conversation.messageCount++;
        conversation.updatedAt = new Date();
        // TODO: Send via actual WhatsApp/Instagram API
        // await sendViaWhatsApp(conversation.customerPhone, message);
        // await sendViaInstagram(conversation.customerId, message);
        successResponse(res, message, 201);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return handleError(res, error, 400);
        }
        handleError(res, error);
    }
});
// Get messages for conversation
router.get('/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
        const authReq = req;
        const conversation = conversations.get(req.params.id);
        if (!conversation || conversation.tenantId !== authReq.tenant.tenantId) {
            return handleError(res, 'Conversation not found', 404);
        }
        const { limit = '50', before } = req.query;
        const messageIds = conversationMessages.get(conversation.id) || [];
        let msgs = messageIds
            .map(id => messages.get(id))
            .filter((m) => m !== undefined);
        if (before) {
            const beforeDate = new Date(before);
            msgs = msgs.filter(m => m.createdAt < beforeDate);
        }
        // Sort by newest first, then limit
        msgs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        msgs = msgs.slice(0, Number(limit));
        successResponse(res, {
            messages: msgs,
            total: messageIds.length
        });
    }
    catch (error) {
        handleError(res, error);
    }
});
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
async function handleIncomingWhatsAppMessage(data) {
    const tenantId = 'default';
    // Find or create conversation
    let conversation = Array.from(conversations.values()).find(c => c.customerId === data.phone &&
        c.channel === 'whatsapp' &&
        c.state !== 'closed');
    if (!conversation) {
        conversation = {
            id: uuidv4(),
            tenantId,
            customerId: data.phone,
            customerName: data.name,
            customerPhone: data.phone,
            channel: 'whatsapp',
            state: 'active',
            aiHandled: true,
            messageCount: 0,
            priority: 'normal',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        conversations.set(conversation.id, conversation);
        conversationMessages.set(conversation.id, []);
    }
    // Create message
    const message = {
        id: data.messageId,
        tenantId,
        conversationId: conversation.id,
        senderId: data.phone,
        senderType: 'customer',
        senderName: data.name,
        content: {
            text: data.content.text,
            mediaUrl: data.content.mediaUrl,
            mediaType: data.content.mediaType
        },
        type: data.type,
        status: 'delivered',
        channel: 'whatsapp',
        createdAt: data.timestamp
    };
    messages.set(message.id, message);
    conversationMessages.get(conversation.id)?.push(message.id);
    // Update conversation
    conversation.lastMessage = data.content.text || `[${data.type}]`;
    conversation.lastMessageAt = data.timestamp;
    conversation.messageCount++;
    conversation.updatedAt = new Date();
    // TODO: Trigger AI response
    // await unifiedBrain.processMessage(conversation, message);
    return conversation;
}
async function handleIncomingInstagramMessage(data) {
    return handleIncomingWhatsAppMessage({
        phone: data.instagramId,
        name: data.name,
        type: data.type,
        content: data.content,
        messageId: data.messageId,
        timestamp: data.timestamp
    });
}
async function handleMessageStatusUpdate(status) {
    const message = messages.get(status.id);
    if (message) {
        message.status = status.status;
    }
}
// ============================================================================
// EXPORT
// ============================================================================
export default router;
//# sourceMappingURL=chat.js.map