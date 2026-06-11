/**
 * Unified Communication Service
 * Multi-channel messaging, templates, and webhooks for CRM
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3021;
const SERVICE_NAME = 'unified-communication-service';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// ============================================================================
// Types and Interfaces
// ============================================================================

export type ChannelType = 'email' | 'sms' | 'whatsapp' | 'push' | 'voice' | 'in_app';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'bounced';
export type WebhookEvent = 'message.sent' | 'message.delivered' | 'message.read' | 'message.failed';

export interface Message {
  id: string;
  customerId: string;
  channel: ChannelType;
  recipient: string;
  subject?: string;
  content: string;
  templateId?: string;
  templateData?: Record<string, any>;
  status: MessageStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: ChannelType;
  subject?: string;
  body: string;
  variables: string[];
  category: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  headers: Record<string, string>;
  createdAt: Date;
}

export interface ChannelPreference {
  customerId: string;
  preferredChannel: ChannelType;
  email?: string;
  phone?: string;
  whatsapp?: string;
  pushToken?: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone: string;
}

export interface AnalyticsSummary {
  totalMessages: number;
  byChannel: Record<ChannelType, number>;
  byStatus: Record<MessageStatus, number>;
  deliveryRate: number;
  readRate: number;
  averageDeliveryTime: number;
}

// ============================================================================
// In-Memory Data Stores
// ============================================================================

const messages: Map<string, Message> = new Map();
const templates: Map<string, MessageTemplate> = new Map();
const webhooks: Map<string, Webhook> = new Map();
const channelPreferences: Map<string, ChannelPreference> = new Map();
const webhookDeliveries: Map<string, any[]> = new Map();

// ============================================================================
// Default Templates
// ============================================================================

const defaultTemplates: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Welcome Email',
    channel: 'email',
    subject: 'Welcome to {{companyName}}!',
    body: 'Hello {{customerName}}, welcome to our community! We\'re excited to have you.',
    variables: ['companyName', 'customerName'],
    category: 'onboarding',
    active: true
  },
  {
    name: 'Order Confirmation',
    channel: 'email',
    subject: 'Order #{{orderId}} Confirmed',
    body: 'Your order #{{orderId}} for {{amount}} has been confirmed. Expected delivery: {{deliveryDate}}',
    variables: ['orderId', 'amount', 'deliveryDate'],
    category: 'transaction',
    active: true
  },
  {
    name: 'SMS OTP',
    channel: 'sms',
    body: 'Your verification code is {{code}}. Valid for {{validity}} minutes.',
    variables: ['code', 'validity'],
    category: 'authentication',
    active: true
  },
  {
    name: 'WhatsApp Appointment Reminder',
    channel: 'whatsapp',
    body: 'Hi {{customerName}}, this is a reminder for your appointment on {{date}} at {{time}}.',
    variables: ['customerName', 'date', 'time'],
    category: 'reminder',
    active: true
  },
  {
    name: 'Push Notification Offer',
    channel: 'push',
    body: '{{offerTitle}} - {{offerDescription}}! Use code {{code}} for {{discount}}% off.',
    variables: ['offerTitle', 'offerDescription', 'code', 'discount'],
    category: 'promotion',
    active: true
  }
];

// Initialize default templates
defaultTemplates.forEach(template => {
  const id = uuidv4();
  templates.set(id, {
    ...template,
    id,
    createdAt: new Date(),
    updatedAt: new Date()
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function renderTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}

async function triggerWebhooks(event: WebhookEvent, payload: any): Promise<void> {
  for (const webhook of webhooks.values()) {
    if (webhook.active && webhook.events.includes(event)) {
      try {
        const delivery = {
          id: uuidv4(),
          webhookId: webhook.id,
          event,
          payload,
          timestamp: new Date(),
          status: 'pending'
        };
        webhookDeliveries.set(delivery.id, [delivery]);
        logger.info(`Webhook ${webhook.id} triggered for event ${event}`);
      } catch (error) {
        logger.error(`Webhook delivery failed: ${error}`);
      }
    }
  }
}

function getChannelAnalytics(channel?: ChannelType): AnalyticsSummary {
  const allMessages = Array.from(messages.values());
  const filtered = channel
    ? allMessages.filter(m => m.channel === channel)
    : allMessages;

  const byChannel: Record<ChannelType, number> = {
    email: 0, sms: 0, whatsapp: 0, push: 0, voice: 0, in_app: 0
  };
  const byStatus: Record<MessageStatus, number> = {
    pending: 0, sent: 0, delivered: 0, read: 0, failed: 0, bounced: 0
  };

  let totalDeliveryTime = 0;
  let deliveredCount = 0;

  filtered.forEach(msg => {
    byChannel[msg.channel]++;
    byStatus[msg.status]++;
    if (msg.deliveredAt && msg.sentAt) {
      totalDeliveryTime += new Date(msg.deliveredAt).getTime() - new Date(msg.sentAt).getTime();
      deliveredCount++;
    }
  });

  return {
    totalMessages: filtered.length,
    byChannel,
    byStatus,
    deliveryRate: filtered.length > 0 ? (byStatus.delivered / filtered.length) * 100 : 0,
    readRate: filtered.length > 0 ? (byStatus.read / filtered.length) * 100 : 0,
    averageDeliveryTime: deliveredCount > 0 ? totalDeliveryTime / deliveredCount : 0
  };
}

// ============================================================================
// Message Routes
// ============================================================================

/**
 * Send a new message
 */
app.post('/api/messages', async (req: Request, res: Response) => {
  try {
    const { customerId, channel, recipient, subject, content, templateId, templateData, scheduledAt } = req.body;

    if (!customerId || !channel || !recipient || !content) {
      res.status(400).json({ error: 'Missing required fields: customerId, channel, recipient, content' });
      return;
    }

    let finalContent = content;
    let finalSubject = subject;

    if (templateId) {
      const template = templates.get(templateId);
      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }
      finalContent = renderTemplate(template.body, templateData || {});
      finalSubject = template.subject ? renderTemplate(template.subject, templateData || {}) : undefined;
    }

    const message: Message = {
      id: uuidv4(),
      customerId,
      channel,
      recipient,
      subject: finalSubject,
      content: finalContent,
      templateId,
      templateData,
      status: scheduledAt ? 'pending' : 'sent',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      sentAt: scheduledAt ? undefined : new Date(),
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    messages.set(message.id, message);

    if (!scheduledAt) {
      setTimeout(() => {
        message.status = 'delivered';
        message.deliveredAt = new Date();
        message.updatedAt = new Date();
        triggerWebhooks('message.delivered', message);
      }, Math.random() * 5000 + 1000);
    }

    await triggerWebhooks('message.sent', message);

    logger.info(`Message ${message.id} sent via ${channel}`);
    res.status(201).json(message);
  } catch (error) {
    logger.error(`Error sending message: ${error}`);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * Get all messages with optional filtering
 */
app.get('/api/messages', (req: Request, res: Response) => {
  const { customerId, channel, status } = req.query;

  let filtered = Array.from(messages.values());

  if (customerId) {
    filtered = filtered.filter(m => m.customerId === customerId);
  }
  if (channel) {
    filtered = filtered.filter(m => m.channel === channel);
  }
  if (status) {
    filtered = filtered.filter(m => m.status === status);
  }

  res.json(filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
});

/**
 * Get message by ID
 */
app.get('/api/messages/:id', (req: Request, res: Response) => {
  const message = messages.get(req.params.id);
  if (!message) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }
  res.json(message);
});

/**
 * Update message status
 */
app.patch('/api/messages/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const message = messages.get(req.params.id);

  if (!message) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  const validStatuses: MessageStatus[] = ['pending', 'sent', 'delivered', 'read', 'failed', 'bounced'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  message.status = status;
  message.updatedAt = new Date();

  if (status === 'delivered') message.deliveredAt = new Date();
  if (status === 'read') message.readAt = new Date();

  const eventMap: Record<string, WebhookEvent> = {
    sent: 'message.sent',
    delivered: 'message.delivered',
    read: 'message.read',
    failed: 'message.failed'
  };

  if (eventMap[status]) {
    triggerWebhooks(eventMap[status], message);
  }

  res.json(message);
});

// ============================================================================
// Template Routes
// ============================================================================

/**
 * Create a new template
 */
app.post('/api/templates', (req: Request, res: Response) => {
  const { name, channel, subject, body, variables, category } = req.body;

  if (!name || !channel || !body) {
    res.status(400).json({ error: 'Missing required fields: name, channel, body' });
    return;
  }

  const template: MessageTemplate = {
    id: uuidv4(),
    name,
    channel,
    subject,
    body,
    variables: variables || [],
    category: category || 'general',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  templates.set(template.id, template);
  res.status(201).json(template);
});

/**
 * Get all templates
 */
app.get('/api/templates', (req: Request, res: Response) => {
  const { channel, category, active } = req.query;

  let filtered = Array.from(templates.values());

  if (channel) {
    filtered = filtered.filter(t => t.channel === channel);
  }
  if (category) {
    filtered = filtered.filter(t => t.category === category);
  }
  if (active !== undefined) {
    filtered = filtered.filter(t => t.active === (active === 'true'));
  }

  res.json(filtered);
});

/**
 * Get template by ID
 */
app.get('/api/templates/:id', (req: Request, res: Response) => {
  const template = templates.get(req.params.id);
  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  res.json(template);
});

/**
 * Update template
 */
app.put('/api/templates/:id', (req: Request, res: Response) => {
  const template = templates.get(req.params.id);
  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  const { name, subject, body, variables, category, active } = req.body;
  if (name) template.name = name;
  if (subject !== undefined) template.subject = subject;
  if (body) template.body = body;
  if (variables) template.variables = variables;
  if (category) template.category = category;
  if (active !== undefined) template.active = active;
  template.updatedAt = new Date();

  res.json(template);
});

// ============================================================================
// Webhook Routes
// ============================================================================

/**
 * Create a new webhook
 */
app.post('/api/webhooks', (req: Request, res: Response) => {
  const { name, url, events, headers } = req.body;

  if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
    res.status(400).json({ error: 'Missing required fields: name, url, events (array)' });
    return;
  }

  const webhook: Webhook = {
    id: uuidv4(),
    name,
    url,
    events,
    secret: uuidv4(),
    active: true,
    headers: headers || {},
    createdAt: new Date()
  };

  webhooks.set(webhook.id, webhook);
  res.status(201).json(webhook);
});

/**
 * Get all webhooks
 */
app.get('/api/webhooks', (req: Request, res: Response) => {
  res.json(Array.from(webhooks.values()));
});

/**
 * Get webhook by ID
 */
app.get('/api/webhooks/:id', (req: Request, res: Response) => {
  const webhook = webhooks.get(req.params.id);
  if (!webhook) {
    res.status(404).json({ error: 'Webhook not found' });
    return;
  }
  res.json(webhook);
});

/**
 * Delete webhook
 */
app.delete('/api/webhooks/:id', (req: Request, res: Response) => {
  if (!webhooks.has(req.params.id)) {
    res.status(404).json({ error: 'Webhook not found' });
    return;
  }
  webhooks.delete(req.params.id);
  res.status(204).send();
});

// ============================================================================
// Channel Preference Routes
// ============================================================================

/**
 * Set channel preference for customer
 */
app.post('/api/preferences', (req: Request, res: Response) => {
  const { customerId, preferredChannel, email, phone, whatsapp, pushToken, quietHoursStart, quietHoursEnd, timezone } = req.body;

  if (!customerId || !preferredChannel) {
    res.status(400).json({ error: 'Missing required fields: customerId, preferredChannel' });
    return;
  }

  const preference: ChannelPreference = {
    customerId,
    preferredChannel,
    email,
    phone,
    whatsapp,
    pushToken,
    quietHoursStart,
    quietHoursEnd,
    timezone: timezone || 'UTC'
  };

  channelPreferences.set(customerId, preference);
  res.status(201).json(preference);
});

/**
 * Get channel preference for customer
 */
app.get('/api/preferences/:customerId', (req: Request, res: Response) => {
  const preference = channelPreferences.get(req.params.customerId);
  if (!preference) {
    res.status(404).json({ error: 'Preference not found' });
    return;
  }
  res.json(preference);
});

// ============================================================================
// Analytics Routes
// ============================================================================

/**
 * Get communication analytics
 */
app.get('/api/analytics', (req: Request, res: Response) => {
  const { channel } = req.query;
  const summary = getChannelAnalytics(channel as ChannelType | undefined);
  res.json(summary);
});

/**
 * Get channel breakdown
 */
app.get('/api/analytics/channels', (req: Request, res: Response) => {
  const channels: ChannelType[] = ['email', 'sms', 'whatsapp', 'push', 'voice', 'in_app'];
  const breakdown = channels.map(channel => ({
    channel,
    ...getChannelAnalytics(channel)
  }));
  res.json(breakdown);
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    stats: {
      messages: messages.size,
      templates: templates.size,
      webhooks: webhooks.size,
      preferences: channelPreferences.size
    }
  });
});

// ============================================================================
// Error Handler
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// Server Start
// ============================================================================

app.listen(PORT, () => {
  logger.info(`${SERVICE_NAME} running on port ${PORT}`);
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});

export default app;
