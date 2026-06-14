import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { WhatsAppSession, WhatsAppTemplate, WhatsAppMessage, WhatsAppConversation } from './models';
import { WhatsAppAPI, WhatsAppWebhookPayload } from './api-client';
import { logger } from './logger';
import { createLogger } from './logger';

// Validation schemas
const sendMessageSchema = z.object({
  to: z.string().min(10),
  body: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  caption: z.string().optional(),
  templateName: z.string().optional(),
  templateVariables: z.record(z.string()).optional(),
});

const createTemplateSchema = z.object({
  templateId: z.string().optional(),
  name: z.string().min(1),
  industry: z.enum(['restaurant', 'hotel', 'salon', 'fitness', 'healthcare', 'retail', 'generic']),
  category: z.enum(['order', 'booking', 'reminder', 'notification', 'marketing', 'otp', 'custom']),
  type: z.enum(['text', 'template', 'media', 'interactive']).default('text'),
  content: z.object({
    body: z.string().min(1),
    footer: z.string().optional(),
    mediaUrl: z.string().optional(),
    buttons: z.array(z.object({
      type: z.string(),
      text: z.string(),
      url: z.string().optional(),
      phoneNumber: z.string().optional(),
    })).optional(),
    header: z.string().optional(),
  }),
  variables: z.array(z.string()).default([]),
  createdBy: z.string().optional(),
});

const updateConversationSchema = z.object({
  state: z.string().optional(),
  context: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  blocked: z.boolean().optional(),
});

/**
 * REZ Unified WhatsApp Service
 *
 * This service provides a unified WhatsApp interface for all REZ industries.
 * It can work with:
 * 1. WhatsApp Cloud API (Meta Business API)
 * 2. WhatsApp Agent Service (internal RABTUL service)
 * 3. Venom Bot (self-hosted instance) - future
 *
 * Features:
 * - Multi-session support (one session per industry)
 * - Template management
 * - Message logging and analytics
 * - Conversation state management
 * - Industry-specific templates
 */
export class WhatsAppService {
  private app: express.Application;
  private api: WhatsAppAPI;
  private sessions: Map<string, WhatsAppAPI> = new Map();
  private dbConnected: boolean = false;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.api = new WhatsAppAPI({
      apiUrl: process.env.WHATSAPP_API_URL,
      apiToken: process.env.WHATSAPP_API_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    });
  }

  private setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        body: req.body,
      });
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      res.json({
        status: 'healthy',
        service: 'whatsapp-service',
        version: '1.0.0',
        database: this.dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      });
    });

    // Webhook endpoint (for WhatsApp Cloud API)
    this.app.get('/webhook', (req, res) => {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (this.api.verifyWebhook(mode as string, token as string, challenge as string)) {
        logger.info('WhatsApp webhook verified');
        res.status(200).send(challenge);
      } else {
        logger.warn('WhatsApp webhook verification failed');
        res.sendStatus(403);
      }
    });

    this.app.post('/webhook', async (req: Request, res: Response) => {
      try {
        const payload = req.body as WhatsAppWebhookPayload;
        const messages = this.api.parseWebhookMessage(payload);

        for (const msg of messages) {
          await this.handleIncomingMessage(msg);
        }

        res.sendStatus(200);
      } catch (error) {
        logger.error('Webhook processing error:', error);
        res.sendStatus(500);
      }
    });

    // Internal webhook (from WhatsApp Agent Service)
    this.app.post('/internal/webhook', async (req: Request, res: Response) => {
      try {
        const { from, body, type, sessionId } = req.body;

        // Look up conversation
        let conversation = await WhatsAppConversation.findOne({ phone: from, sessionId });

        if (!conversation) {
          conversation = await WhatsAppConversation.create({
            phone: from,
            sessionId: sessionId || 'default',
            industry: 'generic',
            state: 'initial',
            context: {},
            lastMessageAt: new Date(),
            lastMessageType: type,
            messageCount: 1,
          });
        }

        // Log message
        await WhatsAppMessage.create({
          messageId: uuidv4(),
          sessionId: sessionId || 'default',
          from,
          to: process.env.WHATSAPP_PHONE_NUMBER || '',
          direction: 'inbound',
          type: type || 'text',
          content: { body },
          status: 'delivered',
        });

        // Update conversation
        conversation.lastMessageAt = new Date();
        conversation.lastMessageType = type || 'text';
        conversation.messageCount += 1;
        await conversation.save();

        res.json({ success: true, conversationId: conversation._id });
      } catch (error) {
        logger.error('Internal webhook error:', error);
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    });

    // Sessions
    this.app.get('/api/sessions', async (req, res) => {
      try {
        const sessions = await WhatsAppSession.find().sort({ createdAt: -1 });
        res.json({ success: true, data: sessions });
      } catch (error) {
        logger.error('Error fetching sessions:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
      }
    });

    this.app.get('/api/sessions/:sessionId', async (req, res) => {
      try {
        const session = await WhatsAppSession.findOne({ sessionId: req.params.sessionId });
        if (!session) {
          return res.status(404).json({ success: false, error: 'Session not found' });
        }
        res.json({ success: true, data: session });
      } catch (error) {
        logger.error('Error fetching session:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch session' });
      }
    });

    this.app.post('/api/sessions', async (req, res) => {
      try {
        const { name, industry, metadata } = req.body;
        const sessionId = uuidv4();

        const session = await WhatsAppSession.create({
          sessionId,
          name: name || industry,
          industry: industry || 'generic',
          status: 'pending',
          metadata,
        });

        res.json({ success: true, data: session });
      } catch (error) {
        logger.error('Error creating session:', error);
        res.status(500).json({ success: false, error: 'Failed to create session' });
      }
    });

    // Templates
    this.app.get('/api/templates', async (req, res) => {
      try {
        const { industry, category, active } = req.query;
        const filter: any = {};

        if (industry) filter.industry = industry;
        if (category) filter.category = category;
        if (active !== undefined) filter.active = active === 'true';

        const templates = await WhatsAppTemplate.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: templates });
      } catch (error) {
        logger.error('Error fetching templates:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch templates' });
      }
    });

    this.app.get('/api/templates/:templateId', async (req, res) => {
      try {
        const template = await WhatsAppTemplate.findOne({ templateId: req.params.templateId });
        if (!template) {
          return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, data: template });
      } catch (error) {
        logger.error('Error fetching template:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch template' });
      }
    });

    this.app.post('/api/templates', async (req, res) => {
      try {
        const validated = createTemplateSchema.parse(req.body);
        const templateId = validated.templateId || validated.name.toLowerCase().replace(/\s+/g, '_');

        const template = await WhatsAppTemplate.create({
          ...validated,
          templateId,
        });

        res.json({ success: true, data: template });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
        }
        logger.error('Error creating template:', error);
        res.status(500).json({ success: false, error: 'Failed to create template' });
      }
    });

    this.app.patch('/api/templates/:templateId', async (req, res) => {
      try {
        const template = await WhatsAppTemplate.findOneAndUpdate(
          { templateId: req.params.templateId },
          { $set: req.body },
          { new: true }
        );

        if (!template) {
          return res.status(404).json({ success: false, error: 'Template not found' });
        }

        res.json({ success: true, data: template });
      } catch (error) {
        logger.error('Error updating template:', error);
        res.status(500).json({ success: false, error: 'Failed to update template' });
      }
    });

    // Send message
    this.app.post('/api/messages/send', async (req, res) => {
      try {
        const validated = sendMessageSchema.parse(req.body);
        let messageId: string;

        if (validated.templateName) {
          const result = await this.api.sendTemplate({
            templateName: validated.templateName,
            to: validated.to,
            variables: validated.templateVariables || {},
          });
          messageId = result.messageId;
        } else if (validated.mediaUrl) {
          const mediaType = validated.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' as const :
            validated.mediaUrl.match(/\.(mp4|mov|avi)$/i) ? 'video' as const :
            validated.mediaUrl.match(/\.(mp3|wav|ogg)$/i) ? 'audio' as const :
            'document' as const;

          const result = await this.api.sendMedia(validated.to, mediaType, validated.mediaUrl, {
            caption: validated.caption,
          });
          messageId = result.messageId;
        } else {
          const result = await this.api.sendText(validated.to, validated.body || '');
          messageId = result.messageId;
        }

        // Log the message
        await WhatsAppMessage.create({
          messageId,
          sessionId: 'default',
          from: process.env.WHATSAPP_PHONE_NUMBER || '',
          to: validated.to,
          direction: 'outbound',
          type: validated.templateName ? 'template' : validated.mediaUrl ? 'media' : 'text',
          content: {
            body: validated.body,
            mediaUrl: validated.mediaUrl,
            caption: validated.caption,
          },
          status: 'sent',
          sentAt: new Date(),
        });

        res.json({ success: true, data: { messageId } });
      } catch (error) {
        logger.error('Error sending message:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send message',
        });
      }
    });

    // Send bulk messages
    this.app.post('/api/messages/send/bulk', async (req, res) => {
      try {
        const { recipients, templateName, templateVariables, mediaUrl, caption } = req.body;

        if (!Array.isArray(recipients)) {
          return res.status(400).json({ success: false, error: 'Recipients must be an array' });
        }

        const results: Array<{ to: string; success: boolean; messageId?: string; error?: string }> = [];
        const messageIds: string[] = [];

        for (const recipient of recipients) {
          try {
            let messageId: string;
            if (templateName) {
              const result = await this.api.sendTemplate({
                templateName,
                to: recipient.phone,
                variables: templateVariables || {},
              });
              messageId = result.messageId;
            } else {
              const result = await this.api.sendText(recipient.phone, recipient.body || '');
              messageId = result.messageId;
            }

            messageIds.push(messageId);
            results.push({ to: recipient.phone, success: true, messageId });

            // Rate limit: 1 message per second for WhatsApp
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            results.push({
              to: recipient.phone,
              success: false,
              error: error instanceof Error ? error.message : 'Failed to send',
            });
          }
        }

        res.json({
          success: true,
          data: {
            total: recipients.length,
            sent: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results,
          },
        });
      } catch (error) {
        logger.error('Error sending bulk messages:', error);
        res.status(500).json({ success: false, error: 'Failed to send bulk messages' });
      }
    });

    // Message history
    this.app.get('/api/messages', async (req, res) => {
      try {
        const { phone, sessionId, direction, status, limit = 50, offset = 0 } = req.query;
        const filter: any = {};

        if (phone) filter.to = phone;
        if (sessionId) filter.sessionId = sessionId;
        if (direction) filter.direction = direction;
        if (status) filter.status = status;

        const messages = await WhatsAppMessage.find(filter)
          .sort({ createdAt: -1 })
          .skip(Number(offset))
          .limit(Number(limit));

        res.json({ success: true, data: messages });
      } catch (error) {
        logger.error('Error fetching messages:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch messages' });
      }
    });

    // Conversations
    this.app.get('/api/conversations', async (req, res) => {
      try {
        const { industry, sessionId, merchantId, limit = 50, offset = 0 } = req.query;
        const filter: any = {};

        if (industry) filter.industry = industry;
        if (sessionId) filter.sessionId = sessionId;
        if (merchantId) filter.merchantId = merchantId;

        const conversations = await WhatsAppConversation.find(filter)
          .sort({ lastMessageAt: -1 })
          .skip(Number(offset))
          .limit(Number(limit));

        res.json({ success: true, data: conversations });
      } catch (error) {
        logger.error('Error fetching conversations:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
      }
    });

    this.app.patch('/api/conversations/:phone', async (req, res) => {
      try {
        const validated = updateConversationSchema.parse(req.body);
        const conversation = await WhatsAppConversation.findOneAndUpdate(
          { phone: req.params.phone },
          { $set: validated },
          { new: true }
        );

        if (!conversation) {
          return res.status(404).json({ success: false, error: 'Conversation not found' });
        }

        res.json({ success: true, data: conversation });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
        }
        logger.error('Error updating conversation:', error);
        res.status(500).json({ success: false, error: 'Failed to update conversation' });
      }
    });

    // Analytics
    this.app.get('/api/analytics', async (req, res) => {
      try {
        const { from, to } = req.query;
        const dateFilter: any = {};

        if (from) dateFilter.$gte = new Date(from as string);
        if (to) dateFilter.$lte = new Date(to as string);

        const baseQuery = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

        const [totalMessages, sentMessages, deliveredMessages, readMessages, failedMessages] = await Promise.all([
          WhatsAppMessage.countDocuments(baseQuery),
          WhatsAppMessage.countDocuments({ ...baseQuery, status: 'sent' }),
          WhatsAppMessage.countDocuments({ ...baseQuery, status: 'delivered' }),
          WhatsAppMessage.countDocuments({ ...baseQuery, status: 'read' }),
          WhatsAppMessage.countDocuments({ ...baseQuery, status: 'failed' }),
        ]);

        const messageTrend = await WhatsAppMessage.aggregate([
          { $match: baseQuery },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        res.json({
          success: true,
          data: {
            total: totalMessages,
            sent: sentMessages,
            delivered: deliveredMessages,
            read: readMessages,
            failed: failedMessages,
            deliveryRate: sentMessages > 0 ? (deliveredMessages / sentMessages * 100).toFixed(2) + '%' : '0%',
            readRate: deliveredMessages > 0 ? (readMessages / deliveredMessages * 100).toFixed(2) + '%' : '0%',
            trend: messageTrend,
          },
        });
      } catch (error) {
        logger.error('Error fetching analytics:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
      }
    });

    // Seed default templates
    this.seedDefaultTemplates().catch(err => logger.error('Error seeding templates:', err));
  }

  /**
   * Handle incoming messages from WhatsApp
   */
  private async handleIncomingMessage(msg: { from: string; type: string; body?: string; mediaUrl?: string; caption?: string; location?: any; context?: any }) {
    const messageId = uuidv4();

    // Log message
    await WhatsAppMessage.create({
      messageId,
      sessionId: 'default',
      from: msg.from,
      to: process.env.WHATSAPP_PHONE_NUMBER || '',
      direction: 'inbound',
      type: msg.type,
      content: msg,
      status: 'delivered',
      metadata: msg.context,
    });

    // Update or create conversation
    const filter: any = { phone: msg.from };
    await WhatsAppConversation.findOneAndUpdate(
      filter,
      {
        $set: {
          lastMessageAt: new Date(),
          lastMessageType: msg.type,
        },
        $inc: { messageCount: 1 },
      },
      { upsert: true, new: true }
    );

    // Auto-reply with acknowledgment for now
    if (msg.type === 'text' && msg.body) {
      await this.api.sendText(msg.from, `Thanks for your message! We'll get back to you soon.`);
    }

    // Mark as read
    if (msg.context?.id) {
      await this.api.markAsRead(msg.context.id);
    }
  }

  /**
   * Seed default templates for common use cases
   */
  private async seedDefaultTemplates() {
    const templates = [
      // Restaurant templates
      {
        templateId: 'order_confirmation',
        name: 'Order Confirmation',
        industry: 'restaurant',
        category: 'order',
        content: {
          body: 'Your order #{{order_id}} has been confirmed! Total: ₹{{total_amount}}. Expected delivery: {{delivery_time}} minutes.',
        },
        variables: ['order_id', 'total_amount', 'delivery_time'],
      },
      {
        templateId: 'order_ready',
        name: 'Order Ready',
        industry: 'restaurant',
        category: 'order',
        content: {
          body: 'Your order #{{order_id}} is ready for {{order_type}}! Visit the counter {{location}}.',
        },
        variables: ['order_id', 'order_type', 'location'],
      },
      {
        templateId: 'booking_confirmation',
        name: 'Booking Confirmation',
        industry: 'restaurant',
        category: 'booking',
        content: {
          body: 'Table reserved for {{guest_count}} at {{restaurant_name}} on {{date}} at {{time}}. Confirmation: {{confirmation_code}}',
        },
        variables: ['guest_count', 'restaurant_name', 'date', 'time', 'confirmation_code'],
      },
      // Hotel templates
      {
        templateId: 'checkin_reminder',
        name: 'Check-in Reminder',
        industry: 'hotel',
        category: 'reminder',
        content: {
          body: 'Hi {{guest_name}}, your reservation at {{hotel_name}} is confirmed for {{checkin_date}}. Check-in: {{checkin_time}}. We look forward to hosting you!',
        },
        variables: ['guest_name', 'hotel_name', 'checkin_date', 'checkin_time'],
      },
      {
        templateId: 'checkout_reminder',
        name: 'Check-out Reminder',
        industry: 'hotel',
        category: 'reminder',
        content: {
          body: 'Reminder: Check-out from {{hotel_name}} is at {{checkout_time}} today. Total bill: ₹{{total_amount}}. Late check-out available at ₹{{late_fee}}/hour.',
        },
        variables: ['hotel_name', 'checkout_time', 'total_amount', 'late_fee'],
      },
      // Salon templates
      {
        templateId: 'appointment_reminder',
        name: 'Appointment Reminder',
        industry: 'salon',
        category: 'booking',
        content: {
          body: 'Hi {{customer_name}}! Reminder: Your appointment at {{salon_name}} is on {{date}} at {{time}} for {{service}}. See you soon!',
        },
        variables: ['customer_name', 'salon_name', 'date', 'time', 'service'],
      },
      {
        templateId: 'birthday_offer',
        name: 'Birthday Offer',
        industry: 'salon',
        category: 'marketing',
        content: {
          body: 'Happy Birthday, {{customer_name}}! 🎂 Enjoy 30% off on any service at {{salon_name}}. Use code: BIRTHDAY30. Valid for {{validity}} days.',
        },
        variables: ['customer_name', 'salon_name', 'validity'],
      },
      // Generic templates
      {
        templateId: 'otp_verification',
        name: 'OTP Verification',
        industry: 'generic',
        category: 'otp',
        content: {
          body: 'Your verification code is {{otp}}. Valid for {{validity}} minutes. Do not share this code with anyone.',
        },
        variables: ['otp', 'validity'],
      },
    ];

    for (const template of templates) {
      try {
        const existing = await WhatsAppTemplate.findOne({ templateId: template.templateId });
        if (!existing) {
          await WhatsAppTemplate.create(template);
          logger.info(`Seeded template: ${template.templateId}`);
        }
      } catch (error) {
        logger.error(`Error seeding template ${template.templateId}:`, error);
      }
    }
  }

  /**
   * Connect to MongoDB
   */
  async connectDatabase(mongoUrl: string) {
    try {
      await mongoose.connect(mongoUrl, {
        maxPoolSize: 10,
        minPoolSize: 2,
      });
      this.dbConnected = true;
      logger.info('Connected to MongoDB');
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Start the service
   */
  async start(port: number = 4014) {
    // Connect to database if URL provided
    if (process.env.MONGO_URL) {
      await this.connectDatabase(process.env.MONGO_URL);
    }

    return new Promise<express.Application>((resolve) => {
      this.app.listen(port, () => {
        logger.info(`WhatsApp service started on port ${port}`);
        resolve(this.app);
      });
    });
  }
}

// CLI entry point
const service = new WhatsAppService();

if (require.main === module) {
  const port = parseInt(process.env.PORT || '4014');
  service.start(port).catch(err => {
    logger.error('Failed to start service:', err);
    process.exit(1);
  });
}

export default WhatsAppService;
