import logger from './utils/logger';

import { Campaign, ICampaign, ICampaignTarget, ICampaignMetrics } from '../models/Campaign';
import { Customer, ICustomer } from '../models/Customer';
import { SEGMENTATION, CAMPAIGN_TYPES, OutreachChannel } from '../config/constants';
import { TWilioClient } from './NotificationService';

/**
 * FIX (security): Generate secure campaign ID using crypto
 */
function generateCampaignId(): string {
  try {
    const { randomUUID } = require('crypto');
    return `CAMP-${Date.now()}-${randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()}`;
  } catch {
    return `CAMP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  type: string;
  target: ICampaignTarget;
  message: {
    subject?: string;
    body: string;
    templateId?: string;
  };
  channels: OutreachChannel[];
  scheduledAt?: Date;
  createdBy: string;
}

export interface CampaignFilters {
  type?: string;
  status?: string;
  createdBy?: string;
  startDate?: Date;
  endDate?: Date;
}

export class CampaignService {
  /**
   * Create a new campaign (draft status)
   */
  async createCampaign(input: CreateCampaignInput): Promise<ICampaign> {
    const campaign = new Campaign({
      campaignId: generateCampaignId(),
      name: input.name,
      description: input.description,
      type: input.type,
      status: 'draft',
      target: input.target,
      message: input.message,
      channels: input.channels,
      scheduledAt: input.scheduledAt,
      createdBy: input.createdBy,
    });

    await campaign.save();
    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: string): Promise<ICampaign | null> {
    return Campaign.findOne({ campaignId });
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    campaignId: string,
    updates: Partial<CreateCampaignInput>
  ): Promise<ICampaign | null> {
    const updateData: Record<string, unknown> = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.target) updateData.target = updates.target;
    if (updates.message) updateData.message = updates.message;
    if (updates.channels) updateData.channels = updates.channels;
    if (updates.scheduledAt !== undefined) updateData.scheduledAt = updates.scheduledAt;

    return Campaign.findOneAndUpdate(
      { campaignId },
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Change campaign status
   */
  async updateStatus(
    campaignId: string,
    status: ICampaign['status']
  ): Promise<ICampaign | null> {
    const updateData: Record<string, unknown> = { status };

    if (status === 'active') {
      updateData.startedAt = new Date();
    } else if (status === 'completed' || status === 'cancelled') {
      updateData.completedAt = new Date();
    }

    return Campaign.findOneAndUpdate(
      { campaignId },
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * List campaigns with filters
   */
  async listCampaigns(
    filters: CampaignFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ campaigns: ICampaign[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, unknown> = {};

    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.createdBy) query.createdBy = filters.createdBy;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) (query.createdAt as Record<string, Date>).$gte = filters.startDate;
      if (filters.endDate) (query.createdAt as Record<string, Date>).$lte = filters.endDate;
    }

    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      Campaign.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Campaign.countDocuments(query),
    ]);

    return {
      campaigns,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get target customers for a campaign
   */
  async getTargetCustomers(target: ICampaignTarget): Promise<ICustomer[]> {
    const query: Record<string, unknown> = { isActive: true };

    // Segment targeting
    if (target.segment && target.segment !== 'ALL') {
      query.segment = target.segment;
    }

    // Specific customer IDs
    if (target.customerIds && target.customerIds.length > 0) {
      query.customerId = { $in: target.customerIds };
      return Customer.find(query);
    }

    // Criteria-based targeting
    if (target.criteria) {
      if (target.criteria.minLifetimeValue) {
        query.lifetimeValue = { ...((query.lifetimeValue as Record<string, number>) || {}), $gte: target.criteria.minLifetimeValue };
      }
      if (target.criteria.maxLifetimeValue) {
        query.lifetimeValue = { ...((query.lifetimeValue as Record<string, number>) || {}), $lte: target.criteria.maxLifetimeValue };
      }
      if (target.criteria.birthdayThisMonth) {
        const now = new Date();
        query.$expr = {
          $and: [
            { $eq: [{ $month: '$dateOfBirth' }, now.getMonth() + 1] },
            { $ne: ['$dateOfBirth', null] },
          ],
        };
      }
      if (target.criteria.anniversaryThisMonth) {
        const now = new Date();
        if (query.$expr) {
          query.$expr.$and.push(
            { $eq: [{ $month: '$anniversary' }, now.getMonth() + 1] },
            { $ne: ['$anniversary', null] }
          );
        } else {
          query.$expr = {
            $and: [
              { $eq: [{ $month: '$anniversary' }, now.getMonth() + 1] },
              { $ne: ['$anniversary', null] },
            ],
          };
        }
      }
      if (target.criteria.minVisits) {
        query.totalVisits = { $gte: target.criteria.minVisits };
      }
    }

    return Customer.find(query);
  }

  /**
   * Execute a campaign - send messages to target customers
   */
  async executeCampaign(campaignId: string): Promise<ICampaignMetrics> {
    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign) throw new Error('Campaign not found');
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new Error('Campaign cannot be executed in current status');
    }

    await this.updateStatus(campaignId, 'active');

    const customers = await this.getTargetCustomers(campaign.target);
    const metrics: ICampaignMetrics = {
      totalTargeted: customers.length,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      revenue: 0,
    };

    // Process each customer based on channels
    for (const customer of customers) {
      for (const channel of campaign.channels) {
        try {
          await this.sendMessage(customer, campaign.message, channel);
          metrics.sent++;

          // Track delivery (simplified - actual tracking would require webhook updates)
          if (channel === 'whatsapp' || channel === 'sms') {
            metrics.delivered++;
          }
        } catch (error) {
          console.error(`Failed to send ${channel} message to ${customer.customerId}:`, error);
        }
      }
    }

    // Update campaign metrics
    await Campaign.updateOne({ campaignId }, { $set: { metrics } });
    await this.updateStatus(campaignId, 'completed');

    return metrics;
  }

  /**
   * Send a message to a customer via the specified channel
   */
  private async sendMessage(
    customer: ICustomer,
    message: ICampaign['message'],
    channel: OutreachChannel
  ): Promise<void> {
    const personalizedBody = this.personalizeMessage(message.body, customer);

    switch (channel) {
      case 'whatsapp':
        await this.sendWhatsApp(customer.phone, personalizedBody);
        break;
      case 'sms':
        await this.sendSMS(customer.phone, personalizedBody);
        break;
      case 'email':
        await this.sendEmail(customer.email!, personalizedBody, message.subject);
        break;
    }
  }

  /**
   * Personalize message with customer data
   */
  private personalizeMessage(template: string, customer: ICustomer): string {
    return template
      .replace(/\{\{name\}\}/g, customer.name)
      .replace(/\{\{phone\}\}/g, customer.phone)
      .replace(/\{\{points\}\}/g, customer.loyaltyPoints.toString())
      .replace(/\{\{segment\}\}/g, customer.segment)
      .replace(/\{\{lifetimeValue\}\}/g, (customer.lifetimeValue / 100).toFixed(2));
  }

  /**
   * Send WhatsApp message
   */
  private async sendWhatsApp(phone: string, message: string): Promise<void> {
    const twilio = new TWilioClient();
    await twilio.sendWhatsApp(phone, message);
  }

  /**
   * Send SMS
   */
  private async sendSMS(phone: string, message: string): Promise<void> {
    const twilio = new TWilioClient();
    await twilio.sendSMS(phone, message);
  }

  /**
   * Send Email
   */
  private async sendEmail(email: string, body: string, subject?: string): Promise<void> {
    // Email implementation would go here
    logger.info(`Sending email to ${email}: ${subject}`);
  }

  /**
   * Update campaign metrics
   */
  async updateMetrics(
    campaignId: string,
    metrics: Partial<ICampaignMetrics>
  ): Promise<ICampaign | null> {
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metrics)) {
      updateData[`metrics.${key}`] = value;
    }

    return Campaign.findOneAndUpdate(
      { campaignId },
      { $inc: updateData },
      { new: true }
    );
  }

  /**
   * Track conversion (visit/revenue from campaign)
   */
  async trackConversion(campaignId: string, revenue: number): Promise<void> {
    await Campaign.updateOne(
      { campaignId },
      {
        $inc: {
          'metrics.converted': 1,
          'metrics.revenue': revenue,
        },
      }
    );
  }

  /**
   * Create automated birthday campaign
   */
  async createBirthdayCampaign(
    name: string,
    message: string,
    channels: OutreachChannel[],
    createdBy: string
  ): Promise<ICampaign> {
    return this.createCampaign({
      name,
      type: CAMPAIGN_TYPES.BIRTHDAY,
      target: {
        criteria: {
          birthdayThisMonth: true,
        },
      },
      message: {
        body: message,
      },
      channels,
      createdBy,
    });
  }

  /**
   * Create reengagement campaign for lapsed customers
   */
  async createReengagementCampaign(
    name: string,
    message: string,
    channels: OutreachChannel[],
    createdBy: string
  ): Promise<ICampaign> {
    return this.createCampaign({
      name,
      type: CAMPAIGN_TYPES.REENGAGEMENT,
      target: {
        segment: 'LAPSED',
      },
      message: {
        body: message,
      },
      channels,
      createdBy,
    });
  }

  /**
   * Get campaign performance report
   */
  async getCampaignReport(campaignId: string): Promise<{
    campaign: ICampaign;
    conversionRate: number;
    revenuePerMessage: number;
    roi: number; // Assuming campaign cost is stored in metadata
  } | null> {
    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign) return null;

    const conversionRate = campaign.metrics.totalTargeted > 0
      ? (campaign.metrics.converted / campaign.metrics.totalTargeted) * 100
      : 0;

    const revenuePerMessage = campaign.metrics.sent > 0
      ? campaign.metrics.revenue / campaign.metrics.sent
      : 0;

    const campaignCost = (campaign.metadata?.cost as number) || 0;
    const roi = campaignCost > 0
      ? ((campaign.metrics.revenue - campaignCost) / campaignCost) * 100
      : 0;

    return {
      campaign,
      conversionRate: Math.round(conversionRate * 100) / 100,
      revenuePerMessage: Math.round(revenuePerMessage),
      roi: Math.round(roi * 100) / 100,
    };
  }
}

export const campaignService = new CampaignService();
