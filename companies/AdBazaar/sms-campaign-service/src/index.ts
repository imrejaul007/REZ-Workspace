/**
 * SMS Campaign Service
 *
 * Bulk SMS campaigns with templates and tracking.
 *
 * Port: 5031
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import crypto from 'crypto';
import winston from 'winston';
import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { z } from 'zod';
import axios from 'axios';

// ============================================================================
// LOGGING
// ============================================================================

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ============================================================================
// METRICS
// ============================================================================

const register = new Registry();
register.setDefaultLabels({ service: 'sms-campaign-service' });

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register]
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const smsSentTotal = new Counter({
  name: 'sms_sent_total',
  help: 'Total SMS sent',
  labelNames: ['campaign_id', 'status'],
  registers: [register]
});

const campaignMetrics = new Gauge({
  name: 'campaign_metrics',
  help: 'Campaign metrics',
  labelNames: ['campaign_id', 'metric'],
  registers: [register]
});

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, path: req.path }, duration);
  });
  next();
});

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = parseInt(process.env.PORT || '5031', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sms_campaign';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+1234567890';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

// ============================================================================
// MONGODB MODELS
// ============================================================================

// Campaign Model
const CampaignSchema = new mongoose.Schema({
  campaignId: { type: String, required: true, unique: true, index: true },
  advertiserId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  message: { type: String, required: true },
  templateId: String,
  recipients: {
    type: { type: String, enum: ['all', 'segment', 'list'] },
    ids: [String]
  },
  status: { type: String, enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'failed'], default: 'draft' },
  stats: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },
  scheduledAt: Date,
  sentAt: Date,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Campaign = mongoose.model('Campaign', CampaignSchema);

// Template Model
const TemplateSchema = new mongoose.Schema({
  templateId: { type: String, required: true, unique: true, index: true },
  advertiserId: String,
  name: { type: String, required: true },
  message: { type: String, required: true },
  variables: [String],
  category: { type: String, enum: ['promotional', 'transactional', 'alert', 'reminder'] },
  status: { type: String, enum: ['active', 'archived'], default: 'active' }
}, { timestamps: true });

const Template = mongoose.model('Template', TemplateSchema);

// Contact Model
const ContactSchema = new mongoose.Schema({
  contactId: { type: String, required: true, unique: true, index: true },
  advertiserId: { type: String, index: true },
  phone: { type: String, required: true, index: true },
  name: String,
  tags: [String],
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Contact = mongoose.model('Contact', ContactSchema);

// Send Model
const SendSchema = new mongoose.Schema({
  sendId: { type: String, required: true, unique: true, index: true },
  campaignId: { type: String, required: true, index: true },
  contactId: String,
  phone: { type: String, required: true },
  status: { type: String, enum: ['pending', 'sent', 'delivered', 'failed', 'undelivered'] },
  sentAt: Date,
  deliveredAt: Date,
  error: String,
  twilioSid: String
}, { timestamps: true });

const Send = mongoose.model('Send', SendSchema);

// Analytics Model
const AnalyticsSchema = new mongoose.Schema({
  campaignId: { type: String, required: true, unique: true, index: true },
  sent: { type: Number, default: 0 },
  delivered: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  deliveryRate: { type: Number, default: 0 },
  updatedAt: Date
});

const Analytics = mongoose.model('Analytics', AnalyticsSchema);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createCampaignSchema = z.object({
  advertiserId: z.string(),
  name: z.string().min(1),
  message: z.string().min(1).max(1600),
  templateId: z.string().optional(),
  recipients: z.object({
    type: z.enum(['all', 'segment', 'list']),
    ids: z.array(z.string()).optional()
  }).optional(),
  scheduledAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional()
});

const createTemplateSchema = z.object({
  advertiserId: z.string().optional(),
  name: z.string().min(1),
  message: z.string().min(1).max(1600),
  variables: z.array(z.string()).optional(),
  category: z.enum(['promotional', 'transactional', 'alert', 'reminder']).optional()
});

// ============================================================================
// UTILITIES
// ============================================================================

function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return rendered;
}

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, '');
}

async function sendViaTwilio(to: string, body: string): Promise<{ sid: string; status: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    logger.warn(`Twilio not configured - mock send to ${to}`);
    return { sid: `mock_${Date.now()}`, status: 'queued' };
  }

  try {
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: normalizePhone(to),
        Body: body
      }),
      {
        auth: {
          username: TWILIO_ACCOUNT_SID,
          password: TWILIO_AUTH_TOKEN
        }
      }
    );

    return { sid: response.data.sid, status: response.data.status };
  } catch (error: any) {
    logger.error('Twilio error', { error: error.response?.data || error.message });
    throw error;
  }
}

// ============================================================================
// HEALTH
// ============================================================================

app.get('/health', (_: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'sms-campaign-service',
    twilio: TWILIO_ACCOUNT_SID ? 'configured' : 'mock',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', async (_: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ready', mongodb: mongoStatus });
});

app.get('/metrics', async (_: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// ============================================================================
// TEMPLATES
// ============================================================================

app.post('/api/templates', async (req: Request, res: Response) => {
  try {
    const validated = createTemplateSchema.parse(req.body);

    const template = await Template.create({
      templateId: generateId('TMPL'),
      ...validated,
      variables: validated.variables || []
    });

    logger.info('Template created', { templateId: template.templateId });
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Create template error', { error });
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

app.get('/api/templates', async (req: Request, res: Response) => {
  try {
    const { advertiserId, category } = req.query;
    const filter: Record<string, unknown> = { status: 'active' };
    if (advertiserId) filter.advertiserId = advertiserId;
    if (category) filter.category = category;

    const templates = await Template.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: templates });
  } catch (error) {
    logger.error('List templates error', { error });
    res.status(500).json({ success: false, error: 'Failed to list templates' });
  }
});

app.get('/api/templates/:id', async (req: Request, res: Response) => {
  try {
    const template = await Template.findOne({ templateId: req.params.id });
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    logger.error('Get template error', { error });
    res.status(500).json({ success: false, error: 'Failed to get template' });
  }
});

app.put('/api/templates/:id', async (req: Request, res: Response) => {
  try {
    const { name, message, variables, status } = req.body;
    const template = await Template.findOneAndUpdate(
      { templateId: req.params.id },
      { name, message, variables, status },
      { new: true }
    );
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    logger.error('Update template error', { error });
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

app.delete('/api/templates/:id', async (req: Request, res: Response) => {
  try {
    await Template.findOneAndUpdate(
      { templateId: req.params.id },
      { status: 'archived' }
    );
    res.json({ success: true, message: 'Template archived' });
  } catch (error) {
    logger.error('Delete template error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

// ============================================================================
// CONTACTS
// ============================================================================

app.post('/api/contacts', async (req: Request, res: Response) => {
  try {
    const { advertiserId, phone, name, tags, metadata } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone required' });
    }

    const normalizedPhone = normalizePhone(phone);
    let contact = await Contact.findOne({ phone: normalizedPhone });
    if (contact) {
      return res.json({ success: true, data: contact, message: 'Contact exists' });
    }

    contact = await Contact.create({
      contactId: generateId('CNT'),
      advertiserId,
      phone: normalizedPhone,
      name,
      tags: tags || [],
      metadata
    });

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    logger.error('Create contact error', { error });
    res.status(500).json({ success: false, error: 'Failed to create contact' });
  }
});

app.get('/api/contacts', async (req: Request, res: Response) => {
  try {
    const { advertiserId } = req.query;
    const filter: Record<string, unknown> = {};
    if (advertiserId) filter.advertiserId = advertiserId;

    const contacts = await Contact.find(filter).sort({ createdAt: -1 }).limit(1000);
    res.json({ success: true, data: contacts, count: contacts.length });
  } catch (error) {
    logger.error('List contacts error', { error });
    res.status(500).json({ success: false, error: 'Failed to list contacts' });
  }
});

// ============================================================================
// CAMPAIGNS
// ============================================================================

app.post('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const validated = createCampaignSchema.parse(req.body);

    const campaign = await Campaign.create({
      campaignId: generateId('CMP'),
      ...validated,
      recipients: validated.recipients || { type: 'all' },
      scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : undefined,
      status: validated.scheduledAt ? 'scheduled' : 'draft'
    });

    logger.info('Campaign created', { campaignId: campaign.campaignId });
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Create campaign error', { error });
    res.status(500).json({ success: false, error: 'Failed to create campaign' });
  }
});

app.get('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const { advertiserId, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (advertiserId) filter.advertiserId = advertiserId;
    if (status) filter.status = status;

    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: campaigns });
  } catch (error) {
    logger.error('List campaigns error', { error });
    res.status(500).json({ success: false, error: 'Failed to list campaigns' });
  }
});

app.get('/api/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.findOne({ campaignId: req.params.id });
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    logger.error('Get campaign error', { error });
    res.status(500).json({ success: false, error: 'Failed to get campaign' });
  }
});

app.put('/api/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const { name, message, recipients, status, scheduledAt } = req.body;
    const campaign = await Campaign.findOneAndUpdate(
      { campaignId: req.params.id },
      { name, message, recipients, status, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined },
      { new: true }
    );
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    logger.error('Update campaign error', { error });
    res.status(500).json({ success: false, error: 'Failed to update campaign' });
  }
});

app.delete('/api/campaigns/:id', async (req: Request, res: Response) => {
  try {
    await Campaign.findOneAndDelete({ campaignId: req.params.id });
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    logger.error('Delete campaign error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete campaign' });
  }
});

// ============================================================================
// SEND CAMPAIGN
// ============================================================================

app.post('/api/campaigns/:id/send', async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.findOne({ campaignId: req.params.id });
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    if (campaign.status === 'sending') {
      return res.status(400).json({ success: false, error: 'Campaign already sending' });
    }

    campaign.status = 'sending';
    await campaign.save();

    let contacts: Array<{ contactId: string; phone: string; advertiserId: string }> = [];

    if (campaign.recipients.type === 'all') {
      contacts = await Contact.find({ advertiserId: campaign.advertiserId });
    } else if (campaign.recipients.ids?.length) {
      contacts = await Contact.find({ contactId: { $in: campaign.recipients.ids } });
    }

    logger.info(`Sending SMS campaign ${campaign.campaignId} to ${contacts.length} contacts`);

    let sent = 0;
    let failed = 0;

    const batchSize = 50;
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);

      for (const contact of batch) {
        try {
          const sendId = generateId('SMS');
          const result = await sendViaTwilio(contact.phone, campaign.message);

          await Send.create({
            sendId,
            campaignId: campaign.campaignId,
            contactId: contact.contactId,
            phone: contact.phone,
            status: 'sent',
            sentAt: new Date(),
            twilioSid: result.sid
          });

          sent++;
          smsSentTotal.inc({ campaign_id: campaign.campaignId, status: 'sent' });
        } catch (error) {
          logger.error(`Failed to send SMS to ${contact.phone}`, { error });
          failed++;
          smsSentTotal.inc({ campaign_id: campaign.campaignId, status: 'failed' });
        }
      }

      campaign.stats.sent = sent;
      campaign.stats.failed = failed;
      await campaign.save();
    }

    campaign.status = 'sent';
    campaign.stats.sent = sent;
    campaign.stats.failed = failed;
    campaign.sentAt = new Date();
    await campaign.save();

    campaignMetrics.set({ campaign_id: campaign.campaignId, metric: 'sent' }, sent);
    campaignMetrics.set({ campaign_id: campaign.campaignId, metric: 'failed' }, failed);

    logger.info(`SMS Campaign ${campaign.campaignId} sent`, { sent, failed });

    res.json({
      success: true,
      data: { campaignId: campaign.campaignId, sent, failed, total: contacts.length }
    });
  } catch (error) {
    logger.error('Send campaign error', { error });
    res.status(500).json({ success: false, error: 'Failed to send campaign' });
  }
});

// ============================================================================
// ANALYTICS
// ============================================================================

app.get('/api/campaigns/:id/analytics', async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.findOne({ campaignId: req.params.id });
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const sends = await Send.find({ campaignId: campaign.campaignId });
    const analytics = await Analytics.findOne({ campaignId: campaign.campaignId });

    const stats = campaign.stats;
    const deliveredCount = sends.filter(s => s.status === 'delivered').length;

    const response = {
      campaignId: campaign.campaignId,
      name: campaign.name,
      status: campaign.status,
      sentAt: campaign.sentAt,
      stats: {
        sent: stats.sent,
        delivered: stats.delivered || deliveredCount,
        failed: stats.failed,
        deliveryRate: stats.sent > 0 ? ((stats.delivered || deliveredCount) / stats.sent * 100).toFixed(2) : 0
      },
      timeline: sends.slice(0, 10).map(s => ({
        phone: s.phone,
        status: s.status,
        sentAt: s.sentAt,
        deliveredAt: s.deliveredAt
      }))
    };

    res.json({ success: true, data: response });
  } catch (error) {
    logger.error('Get analytics error', { error });
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

// ============================================================================
// SENDS
// ============================================================================

app.get('/api/sends', async (req: Request, res: Response) => {
  try {
    const { campaignId, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (campaignId) filter.campaignId = campaignId;
    if (status) filter.status = status;

    const sends = await Send.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: sends });
  } catch (error) {
    logger.error('List sends error', { error });
    res.status(500).json({ success: false, error: 'Failed to list sends' });
  }
});

app.get('/api/sends/:id', async (req: Request, res: Response) => {
  try {
    const send = await Send.findOne({ sendId: req.params.id });
    if (!send) {
      return res.status(404).json({ success: false, error: 'Send not found' });
    }
    res.json({ success: true, data: send });
  } catch (error) {
    logger.error('Get send error', { error });
    res.status(500).json({ success: false, error: 'Failed to get send' });
  }
});

// ============================================================================
// WEBHOOKS (For Twilio callbacks)
// ============================================================================

app.post('/api/webhooks/twilio', async (req: Request, res: Response) => {
  try {
    const { MessageSid, MessageStatus, To } = req.body;

    if (MessageStatus === 'delivered') {
      await Send.findOneAndUpdate(
        { twilioSid: MessageSid },
        { status: 'delivered', deliveredAt: new Date() }
      );
    } else if (['failed', 'undelivered'].includes(MessageStatus)) {
      await Send.findOneAndUpdate(
        { twilioSid: MessageSid },
        { status: MessageStatus }
      );
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error('Twilio webhook error', { error });
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

// ============================================================================
// STARTUP
// ============================================================================

async function start() {
  logger.info('Starting SMS Campaign Service', { port: PORT });

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected');

    app.listen(PORT, () => {
      logger.info(`SMS Campaign Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Startup failed', { error });
    process.exit(1);
  }
}

start();

export default app;