/**
 * Hojai Communications Platform
 *
 * Unified messaging: WhatsApp, SMS, Email, Push, Voice
 *
 * PORT: 4570
 */

import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { tenantMiddleware } from '../../shared/middleware/tenant';
import { createLogger } from '../../shared/utils/logger';
import { createResponse, createErrorResponse } from '../../shared/types';

const logger = createLogger('hojai-communications');

// ============================================
// TYPES
// ============================================

export type Channel = 'whatsapp' | 'sms' | 'email' | 'push' | 'voice';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  tenant_id: string;
  channel: Channel;
  recipient: string;
  template_id?: string;
  subject?: string;
  content: string;
  media?: { type: string; url: string };
  status: MessageStatus;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Template {
  id: string;
  tenant_id: string;
  name: string;
  channel: Channel;
  body: string;
  variables?: string[];
  status: 'active' | 'inactive';
}

export interface Campaign {
  id: string;
  tenant_id: string;
  name: string;
  channel: Channel;
  template_id: string;
  segments: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
  stats: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
}

// ============================================
// STORAGE
// ============================================

const messages = new Map<string, Message>();
const templates = new Map<string, Template>();
const campaigns = new Map<string, Campaign>();

// ============================================
// COMMUNICATIONS PLATFORM
// ============================================

export class HojaiCommunicationsPlatform {

  // ============================================
  // MESSAGES
  // ============================================

  /**
   * Send message
   */
  async sendMessage(
    tenantId: string,
    data: {
      channel: Channel;
      recipient: string;
      content: string;
      template_id?: string;
      subject?: string;
      media?: { type: string; url: string };
    }
  ): Promise<Message> {
    const message: Message = {
      id: this.generateId('msg'),
      tenant_id: tenantId,
      channel: data.channel,
      recipient: data.recipient,
      content: data.content,
      template_id: data.template_id,
      subject: data.subject,
      media: data.media,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    messages.set(message.id, message);

    // Simulate sending
    setTimeout(() => this.simulateSend(message.id), 100);

    await this.auditLog(tenantId, 'message.sent', 'message', message.id, { channel: data.channel });

    return message;
  }

  /**
   * Send template message
   */
  async sendTemplate(
    tenantId: string,
    data: {
      channel: Channel;
      recipient: string;
      template_id: string;
      variables?: Record<string, string>;
    }
  ): Promise<Message> {
    const template = templates.get(data.template_id);
    if (!template) {
      throw new Error('Template not found');
    }

    let content = template.body;
    if (data.variables) {
      for (const [key, value] of Object.entries(data.variables)) {
        content = content.replace(`{{${key}}}`, value);
      }
    }

    return this.sendMessage(tenantId, {
      channel: data.channel,
      recipient: data.recipient,
      content,
      template_id: data.template_id
    });
  }

  /**
   * Get message
   */
  async getMessage(tenantId: string, messageId: string): Promise<Message | null> {
    const message = messages.get(messageId);
    if (!message || message.tenant_id !== tenantId) return null;
    return message;
  }

  /**
   * List messages
   */
  async listMessages(
    tenantId: string,
    options: { channel?: Channel; status?: MessageStatus; limit?: number } = {}
  ): Promise<Message[]> {
    const results: Message[] = [];

    for (const message of messages.values()) {
      if (message.tenant_id !== tenantId) continue;
      if (options.channel && message.channel !== options.channel) continue;
      if (options.status && message.status !== options.status) continue;
      results.push(message);
    }

    return results.slice(0, options.limit || 100);
  }

  // ============================================
  // TEMPLATES
  // ============================================

  /**
   * Create template
   */
  async createTemplate(
    tenantId: string,
    data: {
      name: string;
      channel: Channel;
      body: string;
      variables?: string[];
    }
  ): Promise<Template> {
    const template: Template = {
      id: this.generateId('tpl'),
      tenant_id: tenantId,
      name: data.name,
      channel: data.channel,
      body: data.body,
      variables: data.variables,
      status: 'active'
    };

    templates.set(template.id, template);
    return template;
  }

  /**
   * List templates
   */
  async listTemplates(tenantId: string, channel?: Channel): Promise<Template[]> {
    const results: Template[] = [];
    for (const template of templates.values()) {
      if (template.tenant_id !== tenantId) continue;
      if (channel && template.channel !== channel) continue;
      results.push(template);
    }
    return results;
  }

  // ============================================
  // CAMPAIGNS
  // ============================================

  /**
   * Create campaign
   */
  async createCampaign(
    tenantId: string,
    data: {
      name: string;
      channel: Channel;
      template_id: string;
      segments: string[];
      scheduled_at?: string;
    }
  ): Promise<Campaign> {
    const campaign: Campaign = {
      id: this.generateId('camp'),
      tenant_id: tenantId,
      name: data.name,
      channel: data.channel,
      template_id: data.template_id,
      segments: data.segments,
      status: 'draft',
      stats: { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 }
    };

    if (data.scheduled_at) {
      campaign.scheduled_at = data.scheduled_at;
      campaign.status = 'scheduled';
    }

    campaigns.set(campaign.id, campaign);
    return campaign;
  }

  /**
   * Start campaign
   */
  async startCampaign(tenantId: string, campaignId: string): Promise<Campaign | null> {
    const campaign = campaigns.get(campaignId);
    if (!campaign || campaign.tenant_id !== tenantId) return null;

    campaign.status = 'sending';
    campaign.started_at = new Date().toISOString();
    campaign.stats.total = 100; // Simulated

    // Simulate sending
    setTimeout(() => this.simulateCampaign(campaignId), 1000);

    campaigns.set(campaignId, campaign);
    return campaign;
  }

  /**
   * Get campaign stats
   */
  async getCampaignStats(tenantId: string, campaignId: string): Promise<Campaign | null> {
    const campaign = campaigns.get(campaignId);
    if (!campaign || campaign.tenant_id !== tenantId) return null;
    return campaign;
  }

  // ============================================
  // HELPERS
  // ============================================

  private simulateSend(messageId: string): void {
    const message = messages.get(messageId);
    if (message) {
      message.status = 'sent';
      message.sent_at = new Date().toISOString();
      messages.set(messageId, message);
    }
  }

  private simulateCampaign(campaignId: string): void {
    const campaign = campaigns.get(campaignId);
    if (campaign) {
      campaign.status = 'completed';
      campaign.stats.sent = campaign.stats.total;
      campaign.stats.delivered = Math.floor(campaign.stats.total * 0.95);
      campaign.stats.read = Math.floor(campaign.stats.delivered * 0.4);
      campaign.stats.failed = Math.floor(campaign.stats.total * 0.02);
      campaign.completed_at = new Date().toISOString();
      campaigns.set(campaignId, campaign);
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async auditLog(tenantId: string, action: string, resourceType: string, resourceId: string, details?: Record<string, any>): Promise<void> {
    logger.info('comm_audit', { tenantId, action, resourceType, resourceId });
  }
}

// ============================================
// EXPRESS ROUTES
// ============================================

export function createCommunicationsRoutes(platform: HojaiCommunicationsPlatform) {
  const router = express.Router();

  // Send message
  router.post('/messages', tenantMiddleware(), async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantContext!.tenant_id;
      const message = await platform.sendMessage(tenantId, req.body);
      res.json(createResponse(message, { tenantId }));
    } catch (error: any) {
      res.status(500).json(createErrorResponse('SEND_ERROR', error.message));
    }
  });

  // Send template
  router.post('/messages/template', tenantMiddleware(), async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantContext!.tenant_id;
      const message = await platform.sendTemplate(tenantId, req.body);
      res.json(createResponse(message, { tenantId }));
    } catch (error: any) {
      res.status(500).json(createErrorResponse('SEND_ERROR', error.message));
    }
  });

  // List messages
  router.get('/messages', tenantMiddleware(), async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantContext!.tenant_id;
      const messages = await platform.listMessages(tenantId, {
        channel: req.query.channel as Channel,
        status: req.query.status as MessageStatus,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100
      });
      res.json(createResponse(messages, { tenantId }));
    } catch (error) {
      res.status(500).json(createErrorResponse('LIST_ERROR', 'Failed to list messages'));
    }
  });

  // Get message
  router.get('/messages/:id', tenantMiddleware(), async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantContext!.tenant_id;
      const message = await platform.getMessage(tenantId, req.params.id);
      if (!message) return res.status(404).json(createErrorResponse('NOT_FOUND', 'Message not found'));
      res.json(createResponse(message, { tenantId }));
    } catch (error) {
      res.status(500).json(createErrorResponse('GET_ERROR', 'Failed to get message'));
    }
  });

  // Templates
  router.post('/templates', tenantMiddleware(), async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantContext!.tenant_id;
      const template = await platform.createTemplate(tenantId, req.body);
      res.json(createResponse(template, { tenantId }));
    } catch (error) {
      res.status(500).json(createErrorResponse('CREATE_ERROR', 'Failed to create template'));
    }
  });

  router.get('/templates', tenantMiddleware(), async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantContext!.tenant_id;
      const templates = await platform.listTemplates(tenantId, req.query.channel as Channel);
      res.json(createResponse(templates, { tenantId }));
    } catch (error) {
      res.status(500).json(createErrorResponse('LIST_ERROR', 'Failed to list templates'));
    }
  });

  // Campaigns
  router.post('/campaigns', tenantMiddleware(), async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantContext!.tenant_id;
      const campaign = await platform.createCampaign(tenantId, req.body);
      res.json(createResponse(campaign, { tenantId }));
    } catch (error) {
      res.status(500).json(createErrorResponse('CREATE_ERROR', 'Failed to create campaign'));
    }
  });

  router.post('/campaigns/:id/start', tenantMiddleware(), async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantContext!.tenant_id;
      const campaign = await platform.startCampaign(tenantId, req.params.id);
      if (!campaign) return res.status(404).json(createErrorResponse('NOT_FOUND', 'Campaign not found'));
      res.json(createResponse(campaign, { tenantId }));
    } catch (error) {
      res.status(500).json(createErrorResponse('START_ERROR', 'Failed to start campaign'));
    }
  });

  router.get('/campaigns/:id', tenantMiddleware(), async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantContext!.tenant_id;
      const campaign = await platform.getCampaignStats(tenantId, req.params.id);
      if (!campaign) return res.status(404).json(createErrorResponse('NOT_FOUND', 'Campaign not found'));
      res.json(createResponse(campaign, { tenantId }));
    } catch (error) {
      res.status(500).json(createErrorResponse('GET_ERROR', 'Failed to get campaign'));
    }
  });

  return router;
}

export async function bootstrap(port = 4570) {
  const platform = new HojaiCommunicationsPlatform();
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'hojai-communications', version: '1.0.0' });
  });

  app.use('/api/communications', createCommunicationsRoutes(platform));

  app.listen(port, () => {
    logger.info('hojai_communications_started', { port });
  });

  return { platform, app };
}

export default { HojaiCommunicationsPlatform, createCommunicationsRoutes, bootstrap };
