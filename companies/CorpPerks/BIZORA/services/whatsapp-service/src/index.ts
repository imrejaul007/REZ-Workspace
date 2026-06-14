/**
 * BIZORA WhatsApp Service
 * WhatsApp Business API Integration
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import { z } from 'zod';

// ============================================================================
// Configuration
// ============================================================================

const PORT = parseInt(process.env.PORT || '4035', 10);
const WHATSAPP_PHONE = process.env.WHATSAPP_PHONE_ID || '';
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

// ============================================================================
// Types
// ============================================================================

interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text' | 'image' | 'document' | 'template';
  text?: { body: string };
  image?: { id: string; caption?: string };
  template?: TemplateMessage;
}

interface TemplateMessage {
  name: string;
  language: { code: string };
  components: TemplateComponent[];
}

interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  text?: string;
  buttons?: { type: string; text: string }[];
}

interface Conversation {
  id: string;
  userId: string;
  phone: string;
  status: 'active' | 'closed';
  lastMessage?: string;
  lastMessageAt: Date;
  context: Record<string, unknown>;
  createdAt: Date;
}

interface MessageLog {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  type: 'text' | 'image' | 'document' | 'template';
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
}

// ============================================================================
// Validation
// ============================================================================

const SendMessageSchema = z.object({
  to: z.string().regex(/^\d{10,15}$/),
  type: z.enum(['text', 'image', 'document', 'template']).default('text'),
  content: z.string(),
});

const SendTemplateSchema = z.object({
  to: z.string().regex(/^\d{10,15}$/),
  templateName: z.string(),
  templateData: z.record(z.any()).optional(),
});

// ============================================================================
// Store
// ============================================================================

const conversations = new Map<string, Conversation>();
const messageLogs: MessageLog[] = [];

// Initialize with sample conversation
const sampleConversation: Conversation = {
  id: 'conv-001',
  userId: 'user-001',
  phone: '919876543210',
  status: 'active',
  lastMessage: 'Hi, I need help with GST filing',
  lastMessageAt: new Date(),
  context: { businessId: 'biz-001' },
  createdAt: new Date(),
};
conversations.set(sampleConversation.id, sampleConversation);

// ============================================================================
// WhatsApp API Functions
// ============================================================================

async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<{ messageId: string }> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE) {
    logger.info('[WhatsApp] Mock send:', message);
    return { messageId: `msg_${Date.now()}` };
  }

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE}/messages`,
      message,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { messageId: response.data.messages[0].id };
  } catch (error) {
    logger.error('[WhatsApp] Send error:', error);
    throw error;
  }
}

async function markAsRead(messageId: string): Promise<void> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE) return;

  try {
    await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE}/messages`,
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        },
      }
    );
  } catch (error) {
    logger.error('[WhatsApp] Mark read error:', error);
  }
}

// ============================================================================
// Bot Logic
// ============================================================================

interface BotResponse {
  message: string;
  actions?: { type: string; payload: unknown }[];
  route?: string;
}

function processMessage(userMessage: string, context: Record<string, unknown>): BotResponse {
  const lower = userMessage.toLowerCase();

  // Intent detection
  if (lower.includes('gst') || lower.includes('tax') || lower.includes('filing')) {
    return {
      message: `📜 *GST Filing Help*

I can help you with:
• GSTR-1 filing - Due 11th monthly
• GSTR-3B filing - Due 20th monthly
• GSTR-9 annual - Due Dec 31st

What would you like help with?`,
      actions: [
        { type: 'quick_reply', payload: 'File GSTR-3B' },
        { type: 'quick_reply', payload: 'Check deadlines' },
        { type: 'quick_reply', payload: 'Talk to expert' },
      ],
      route: 'compliance',
    };
  }

  if (lower.includes('invoice') || lower.includes('billing')) {
    return {
      message: `📄 *Invoice Help*

I can help you:
• Create a new invoice
• Check invoice status
• Send reminder to customer

What do you need?`,
      actions: [
        { type: 'quick_reply', payload: 'Create Invoice' },
        { type: 'quick_reply', payload: 'Check Status' },
      ],
      route: 'invoice',
    };
  }

  if (lower.includes('marketing') || lower.includes('ads') || lower.includes('branding')) {
    return {
      message: `📢 *Marketing Services*

I can connect you with:
• Social media experts
• Branding agencies
• Ad campaign managers
• Content creators

What's your marketing goal?`,
      actions: [
        { type: 'quick_reply', payload: 'Find Agency' },
        { type: 'quick_reply', payload: 'Social Media' },
      ],
      route: 'marketing',
    };
  }

  if (lower.includes('register') || lower.includes('start') || lower.includes('company')) {
    return {
      message: `📋 *Business Registration*

I can help you:
• Register Pvt Ltd / LLP / Partnership
• Get GST number
• Get FSSAI license
• Trade license

What type of business are you starting?`,
      actions: [
        { type: 'quick_reply', payload: 'Pvt Ltd' },
        { type: 'quick_reply', payload: 'GST Registration' },
        { type: 'quick_reply', payload: 'Talk to Expert' },
      ],
      route: 'business_setup',
    };
  }

  if (lower.includes('payment') || lower.includes('pay') || lower.includes('upi')) {
    return {
      message: `💳 *Payment Options*

You can pay via:
• UPI / Google Pay / PhonePe
• Credit / Debit Card
• Net Banking
• Bank Transfer

Would you like to see your pending payments?`,
      actions: [
        { type: 'quick_reply', payload: 'View Payments' },
        { type: 'quick_reply', payload: 'Pay Now' },
      ],
    };
  }

  // Default greeting
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
    return {
      message: `👋 *Welcome to BIZORA!*

I'm your business assistant on WhatsApp.

I can help you with:
• 📜 Tax & GST filing
• 📄 Invoices & billing
• 💰 Payments
• 📢 Marketing services
• 📋 Business registration
• 💻 Technology solutions

What do you need help with today?`,
      actions: [
        { type: 'quick_reply', payload: 'GST Filing' },
        { type: 'quick_reply', payload: 'Create Invoice' },
        { type: 'quick_reply', payload: 'Find Services' },
      ],
    };
  }

  // Fallback
  return {
    message: `I understand you need help with "${userMessage}". Let me connect you with the right service.

Type one of these for quick help:
• "GST Filing" - For tax compliance
• "Create Invoice" - For billing
• "Marketing" - For growth
• "Register" - For business setup`,
  };
}

// ============================================================================
// Express App
// ============================================================================

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WhatsApp webhook verification
app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'bizora_whatsapp_verify_token';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    logger.info('[WhatsApp] Webhook verified');
    res.status(200).send(challenge);
  } else {
    logger.info('[WhatsApp] Verification failed');
    res.sendStatus(403);
  }
});

// WhatsApp webhook (receives messages)
app.post('/webhook', async (req: Request, res: Response) => {
  logger.info('[WhatsApp] Webhook received:', JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const phone = message.from;
    const messageId = message.id;
    const userMessage = message.text?.body || '';

    // Mark as read
    await markAsRead(messageId);

    // Find or create conversation
    let conversation = Array.from(conversations.values())
      .find(c => c.phone === phone.replace('91', ''));

    if (!conversation) {
      conversation = {
        id: `conv_${Date.now()}`,
        userId: `user_${phone}`,
        phone: phone.replace('91', ''),
        status: 'active',
        lastMessage: userMessage,
        lastMessageAt: new Date(),
        context: {},
        createdAt: new Date(),
      };
      conversations.set(conversation.id, conversation);
    }

    // Process message
    const response = processMessage(userMessage, conversation.context);

    // Log inbound message
    messageLogs.push({
      id: messageId,
      conversationId: conversation.id,
      direction: 'inbound',
      type: 'text',
      content: userMessage,
      status: 'received',
      timestamp: new Date(),
    });

    // Send response
    await sendWhatsAppMessage({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: response.message },
    });

    // Log outbound message
    messageLogs.push({
      id: `msg_${Date.now()}`,
      conversationId: conversation.id,
      direction: 'outbound',
      type: 'text',
      content: response.message,
      status: 'sent',
      timestamp: new Date(),
    });

    // Update conversation
    conversation.lastMessage = response.message.slice(0, 100);
    conversation.lastMessageAt = new Date();
    conversations.set(conversation.id, conversation);

    res.sendStatus(200);
  } catch (error) {
    logger.error('[WhatsApp] Webhook error:', error);
    res.sendStatus(500);
  }
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'whatsapp-service',
    timestamp: new Date().toISOString(),
    configured: !!(WHATSAPP_TOKEN && WHATSAPP_PHONE),
    conversations: conversations.size,
    messages: messageLogs.length,
  });
});

// ============================================================================
// API Routes
// ============================================================================

// Send message to user
app.post('/api/send', async (req: Request, res: Response) => {
  try {
    const data = SendMessageSchema.parse(req.body);

    const result = await sendWhatsAppMessage({
      messaging_product: 'whatsapp',
      to: `91${data.to}`,
      type: data.type as 'text',
      text: { body: data.content },
    });

    res.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    logger.error('Send error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Send template message
app.post('/api/send-template', async (req: Request, res: Response) => {
  try {
    const data = SendTemplateSchema.parse(req.body);

    const result = await sendWhatsAppMessage({
      messaging_product: 'whatsapp',
      to: `91${data.to}`,
      type: 'template',
      template: {
        name: data.templateName,
        language: { code: 'en' },
        components: data.templateData ? [
          { type: 'body', text: JSON.stringify(data.templateData) },
        ] : [],
      },
    });

    res.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send template' });
  }
});

// Get conversations
app.get('/api/conversations', (_req: Request, res: Response) => {
  const convs = Array.from(conversations.values())
    .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

  res.json({ conversations: convs, total: convs.length });
});

// Get single conversation with messages
app.get('/api/conversations/:id', (req: Request, res: Response) => {
  const conversation = conversations.get(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const messages = messageLogs.filter(m => m.conversationId === req.params.id);

  res.json({ conversation, messages });
});

// Send proactive message
app.post('/api/conversations/:id/send', async (req: Request, res: Response) => {
  try {
    const conversation = conversations.get(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const { message } = req.body;

    await sendWhatsAppMessage({
      messaging_product: 'whatsapp',
      to: `91${conversation.phone}`,
      type: 'text',
      text: { body: message },
    });

    messageLogs.push({
      id: `msg_${Date.now()}`,
      conversationId: conversation.id,
      direction: 'outbound',
      type: 'text',
      content: message,
      status: 'sent',
      timestamp: new Date(),
    });

    conversation.lastMessage = message.slice(0, 100);
    conversation.lastMessageAt = new Date();
    conversations.set(conversation.id, conversation);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get templates
app.get('/api/templates', (_req: Request, res: Response) => {
  const templates = [
    {
      name: 'hello_greeting',
      category: 'MARKETING',
      language: 'English',
      components: ['header', 'body'],
    },
    {
      name: 'order_confirmation',
      category: 'UTILITY',
      language: 'English',
      components: ['header', 'body', 'buttons'],
    },
    {
      name: 'payment_reminder',
      category: 'UTILITY',
      language: 'English',
      components: ['header', 'body'],
    },
    {
      name: 'appointment_reminder',
      category: 'UTILITY',
      language: 'English',
      components: ['header', 'body', 'buttons'],
    },
  ];

  res.json({ templates });
});

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   💬 BIZORA WhatsApp Service                          ║
║   WhatsApp Business API Integration                    ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   Status: Running                                      ║
║                                                           ║
║   Webhook: POST /webhook                               ║
║   Verify: GET /webhook                                  ║
║                                                           ║
║   Features:                                             ║
║   • Inbound message handling                          ║
║   • Bot responses                                     ║
║   • Proactive messaging                              ║
║   • Template messages                                 ║
║   • Conversation management                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
