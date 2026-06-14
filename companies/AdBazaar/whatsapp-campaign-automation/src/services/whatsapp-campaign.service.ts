/**
 * WhatsApp Campaign Service
 * Business logic for campaign management and sending
 */

import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  WhatsAppCampaignModel,
  CampaignMessageModel,
  IWhatsAppCampaign,
  ICampaignMessage,
} from '../models/whatsapp-campaign.model';
import {
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignListQuery,
  CampaignStatsResponse,
  WhatsAppCampaign,
  CampaignMessage,
} from '../types/whatsapp.types';
import { config } from '../config';
import logger from '../utils/logger';
import {
  setCampaignLock,
  releaseCampaignLock,
  incrementCampaignMetric,
  getCampaignMetrics,
} from '../utils/redis';

export class WhatsAppCampaignService {
  /**
   * Create a new WhatsApp campaign
   */
  async createCampaign(data: CreateCampaignRequest): Promise<WhatsAppCampaign> {
    const campaignId = `wa-${uuidv4().slice(0, 12)}`;

    const campaign = new WhatsAppCampaignModel({
      campaignId,
      merchantId: data.merchantId,
      name: data.name,
      template: data.template,
      audience: data.audience,
      scheduling: data.scheduling,
      status: data.scheduling.type === 'immediate' ? 'scheduled' : 'draft',
    });

    await campaign.save();
    logger.info('Campaign created', { campaignId, merchantId: data.merchantId });

    return this.toCampaignResponse(campaign);
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string, merchantId?: string): Promise<WhatsAppCampaign | null> {
    const query: Record<string, string> = { campaignId };
    if (merchantId) {
      query.merchantId = merchantId;
    }

    const campaign = await WhatsAppCampaignModel.findOne(query);
    if (!campaign) return null;

    return this.toCampaignResponse(campaign);
  }

  /**
   * List campaigns with filtering and pagination
   */
  async listCampaigns(query: CampaignListQuery): Promise<{
    campaigns: WhatsAppCampaign[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const {
      merchantId,
      status,
      page = 1,
      limit = 20,
      startDate,
      endDate,
    } = query;

    const filter: Record<string, unknown> = {};

    if (merchantId) filter.merchantId = merchantId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) (filter.createdAt as Record<string, Date>).$gte = startDate;
      if (endDate) (filter.createdAt as Record<string, Date>).$lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      WhatsAppCampaignModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WhatsAppCampaignModel.countDocuments(filter),
    ]);

    return {
      campaigns: campaigns.map((c) => this.toCampaignResponse(c as IWhatsAppCampaign)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Update a campaign
   */
  async updateCampaign(
    campaignId: string,
    data: UpdateCampaignRequest,
    merchantId?: string
  ): Promise<WhatsAppCampaign | null> {
    const query: Record<string, string> = { campaignId };
    if (merchantId) query.merchantId = merchantId;

    const campaign = await WhatsAppCampaignModel.findOne(query);
    if (!campaign) return null;

    // Can only update draft campaigns
    if (campaign.status !== 'draft') {
      throw new Error('Can only update draft campaigns');
    }

    if (data.name) campaign.name = data.name;
    if (data.template) campaign.template = data.template;
    if (data.audience) campaign.audience = data.audience;
    if (data.scheduling) campaign.scheduling = data.scheduling;

    await campaign.save();
    logger.info('Campaign updated', { campaignId });

    return this.toCampaignResponse(campaign);
  }

  /**
   * Delete a campaign (only draft campaigns)
   */
  async deleteCampaign(campaignId: string, merchantId?: string): Promise<boolean> {
    const query: Record<string, string> = { campaignId };
    if (merchantId) query.merchantId = merchantId;

    const campaign = await WhatsAppCampaignModel.findOne(query);
    if (!campaign) return false;

    if (campaign.status !== 'draft') {
      throw new Error('Can only delete draft campaigns');
    }

    await WhatsAppCampaignModel.deleteOne({ campaignId });
    logger.info('Campaign deleted', { campaignId });

    return true;
  }

  /**
   * Send a campaign - processes audience and sends messages
   */
  async sendCampaign(campaignId: string, merchantId?: string): Promise<WhatsAppCampaign> {
    // Acquire lock to prevent duplicate sends
    const locked = await setCampaignLock(campaignId, 600);
    if (!locked) {
      throw new Error('Campaign is already being processed');
    }

    try {
      const query: Record<string, string> = { campaignId };
      if (merchantId) query.merchantId = merchantId;

      const campaign = await WhatsAppCampaignModel.findOne(query);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (!['draft', 'scheduled', 'paused'].includes(campaign.status)) {
        throw new Error(`Cannot send campaign with status: ${campaign.status}`);
      }

      // Update status to sending
      campaign.status = 'sending';
      campaign.sentAt = new Date();
      await campaign.save();

      // Get audience - in production this would call user service
      const recipients = await this.getAudience(campaign.audience, campaign.merchantId);

      logger.info('Starting campaign send', {
        campaignId,
        recipientCount: recipients.length,
      });

      // Process in batches
      const batchSize = config.campaign.maxBatchSize;
      const intervalMs = config.campaign.sendIntervalMs;

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);

        // Check if campaign is still sending
        const currentCampaign = await WhatsAppCampaignModel.findOne({ campaignId });
        if (currentCampaign?.status === 'paused') {
          logger.info('Campaign paused', { campaignId, processed: i });
          break;
        }

        await this.sendBatch(campaign, batch);

        // Rate limiting delay
        if (i + batchSize < recipients.length) {
          await this.delay(intervalMs);
        }
      }

      // Refresh campaign
      const updatedCampaign = await WhatsAppCampaignModel.findOne({ campaignId });
      if (updatedCampaign && updatedCampaign.status === 'sending') {
        updatedCampaign.status = 'completed';
        updatedCampaign.completedAt = new Date();
        await updatedCampaign.save();
      }

      logger.info('Campaign send completed', { campaignId });
      return this.toCampaignResponse(updatedCampaign!);
    } finally {
      await releaseCampaignLock(campaignId);
    }
  }

  /**
   * Pause a running campaign
   */
  async pauseCampaign(campaignId: string, merchantId?: string): Promise<WhatsAppCampaign | null> {
    const query: Record<string, string> = { campaignId };
    if (merchantId) query.merchantId = merchantId;

    const campaign = await WhatsAppCampaignModel.findOne(query);
    if (!campaign) return null;

    if (campaign.status !== 'sending') {
      throw new Error('Can only pause campaigns that are sending');
    }

    campaign.status = 'paused';
    await campaign.save();

    logger.info('Campaign paused', { campaignId });
    return this.toCampaignResponse(campaign);
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(campaignId: string, merchantId?: string): Promise<WhatsAppCampaign | null> {
    const query: Record<string, string> = { campaignId };
    if (merchantId) query.merchantId = merchantId;

    const campaign = await WhatsAppCampaignModel.findOne(query);
    if (!campaign) return null;

    if (campaign.status !== 'paused') {
      throw new Error('Can only resume paused campaigns');
    }

    campaign.status = 'sending';
    await campaign.save();

    logger.info('Campaign resumed', { campaignId });
    return this.toCampaignResponse(campaign);
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string, merchantId?: string): Promise<CampaignStatsResponse | null> {
    const query: Record<string, string> = { campaignId };
    if (merchantId) query.merchantId = merchantId;

    const campaign = await WhatsAppCampaignModel.findOne(query);
    if (!campaign) return null;

    // Try to get real-time metrics from Redis
    let redisMetrics = { sent: 0, delivered: 0, read: 0, clicked: 0, responded: 0, optOut: 0, failed: 0 };
    try {
      redisMetrics = await getCampaignMetrics(campaignId);
    } catch {
      // Redis not available, use DB metrics
    }

    // Use Redis metrics if available, otherwise DB
    const metrics = Object.keys(redisMetrics).some((k) => redisMetrics[k as keyof typeof redisMetrics] > 0)
      ? redisMetrics
      : campaign.metrics;

    const sent = metrics.sent || campaign.metrics.sent;
    const deliveryRate = sent > 0 ? ((metrics.delivered || campaign.metrics.delivered) / sent) * 100 : 0;
    const readRate = sent > 0 ? ((metrics.read || campaign.metrics.read) / sent) * 100 : 0;
    const responseRate = sent > 0 ? ((metrics.responded || campaign.metrics.responded) / sent) * 100 : 0;
    const optOutRate = sent > 0 ? ((metrics.optOut || campaign.metrics.optOut) / sent) * 100 : 0;

    return {
      campaignId,
      metrics: metrics as CampaignStatsResponse['metrics'],
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      readRate: Math.round(readRate * 100) / 100,
      responseRate: Math.round(responseRate * 100) / 100,
      optOutRate: Math.round(optOutRate * 100) / 100,
    };
  }

  /**
   * Process webhook update from WhatsApp
   */
  async processWebhookUpdate(
    messageId: string,
    status: string,
    timestamp: string
  ): Promise<void> {
    const message = await CampaignMessageModel.findOne({ messageId });
    if (!message) {
      logger.warn('Message not found for webhook', { messageId });
      return;
    }

    message.status = this.mapWebhookStatus(status);

    switch (status) {
      case 'sent':
        message.sentAt = new Date(parseInt(timestamp, 10) * 1000);
        await incrementCampaignMetric(message.campaignId, 'sent');
        break;
      case 'delivered':
        message.deliveredAt = new Date(parseInt(timestamp, 10) * 1000);
        await incrementCampaignMetric(message.campaignId, 'delivered');
        break;
      case 'read':
        message.readAt = new Date(parseInt(timestamp, 10) * 1000);
        await incrementCampaignMetric(message.campaignId, 'read');
        break;
      case 'failed':
        await incrementCampaignMetric(message.campaignId, 'failed');
        break;
    }

    await message.save();
    logger.debug('Webhook processed', { messageId, status });
  }

  // Private helper methods

  private async getAudience(
    audience: WhatsAppCampaign['audience'],
    merchantId: string
  ): Promise<{ userId: string; phoneNumber: string }[]> {
    // In production, this would call user service based on audience type
    // For now, return empty array - implement based on your user service
    switch (audience.type) {
      case 'all_customers':
        // Fetch all customers for merchant
        return [];
      case 'segment':
        // Fetch customers in segment
        return [];
      case 'custom':
        // Use provided userIds
        return (audience.userIds || []).map((userId) => ({
          userId,
          phoneNumber: '', // Would be fetched from user service
        }));
      default:
        return [];
    }
  }

  private async sendBatch(
    campaign: IWhatsAppCampaign,
    recipients: { userId: string; phoneNumber: string }[]
  ): Promise<void> {
    const messages: ICampaignMessage[] = [];

    for (const recipient of recipients) {
      try {
        // Send via WhatsApp API
        if (config.whatsapp.accessToken) {
          await this.sendWhatsAppMessage(recipient.phoneNumber, campaign.template);
        }

        const message = new CampaignMessageModel({
          messageId: `msg-${uuidv4().slice(0, 12)}`,
          campaignId: campaign.campaignId,
          userId: recipient.userId,
          phoneNumber: recipient.phoneNumber,
          status: 'sent',
          sentAt: new Date(),
        });

        messages.push(message);
        await incrementCampaignMetric(campaign.campaignId, 'sent');
      } catch (error) {
        logger.error('Failed to send message', {
          campaignId: campaign.campaignId,
          userId: recipient.userId,
          error: error instanceof Error ? error.message : 'Unknown',
        });

        const failedMessage = new CampaignMessageModel({
          messageId: `msg-${uuidv4().slice(0, 12)}`,
          campaignId: campaign.campaignId,
          userId: recipient.userId,
          phoneNumber: recipient.phoneNumber,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown',
        });
        messages.push(failedMessage);
        await incrementCampaignMetric(campaign.campaignId, 'failed');
      }
    }

    if (messages.length > 0) {
      await CampaignMessageModel.insertMany(messages);
    }
  }

  private async sendWhatsAppMessage(
    phoneNumber: string,
    template: WhatsAppCampaign['template']
  ): Promise<void> {
    if (!config.whatsapp.accessToken || !config.whatsapp.phoneNumberId) {
      logger.debug('WhatsApp not configured, skipping send', { phoneNumber });
      return;
    }

    try {
      const payload = this.buildWhatsAppPayload(phoneNumber, template);

      await axios.post(
        `${config.whatsapp.apiUrl}/${config.whatsapp.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${config.whatsapp.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(
        `WhatsApp API error: ${axiosError.response?.status} - ${axiosError.message}`
      );
    }
  }

  private buildWhatsAppPayload(
    phoneNumber: string,
    template: WhatsAppCampaign['template']
  ): Record<string, unknown> {
    // Format phone number
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    const to = formattedPhone.startsWith('91') ? formattedPhone : `91${formattedPhone}`;

    return {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: `${template.type}_message`,
        language: { code: 'en' },
        components: [
          ...(template.header
            ? [{ type: 'header' as const, text: template.header }]
            : []),
          {
            type: 'body' as const,
            parameters: [{ type: 'text' as const, text: template.body }],
          },
          ...(template.buttons
            ? [
                {
                  type: 'button' as const,
                  sub_type: 'quick_reply' as const,
                  index: '0',
                  parameters: template.buttons.map((btn) => ({
                    type: 'payload' as const,
                    payload: btn.action,
                  })),
                },
              ]
            : []),
        ],
      },
    };
  }

  private mapWebhookStatus(status: string): CampaignMessage['status'] {
    const statusMap: Record<string, CampaignMessage['status']> = {
      sent: 'sent',
      delivered: 'delivered',
      read: 'read',
      failed: 'failed',
      deleted: 'opt_out',
    };
    return statusMap[status] || 'pending';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private toCampaignResponse(doc: IWhatsAppCampaign): WhatsAppCampaign {
    return {
      campaignId: doc.campaignId,
      merchantId: doc.merchantId,
      name: doc.name,
      template: doc.template,
      audience: doc.audience,
      scheduling: doc.scheduling,
      metrics: doc.metrics,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      sentAt: doc.sentAt,
      completedAt: doc.completedAt,
    };
  }
}

export const whatsAppCampaignService = new WhatsAppCampaignService();