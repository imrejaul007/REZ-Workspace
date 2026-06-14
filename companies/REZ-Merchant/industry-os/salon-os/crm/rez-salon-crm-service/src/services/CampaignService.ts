import { Campaign, ICampaign, ISegmentCriteria, ICampaignMetrics, CampaignType, CampaignStatus } from '../models/Campaign';
import { Customer, ICustomer } from '../models/Customer';
import { Interaction, InteractionType } from '../models/Interaction';
import { customerService, CustomerFilters } from './CustomerService';
import { notificationService } from './NotificationService';
import { v4 as uuidv4 } from 'uuid';
import { parseISO, format, isWithinInterval, startOfDay, endOfDay, addDays } from 'date-fns';
import { logger } from '../utils/logger';

export interface CreateCampaignInput {
  name: string;
  description?: string;
  type: CampaignType;
  channel: 'sms' | 'email' | 'both';
  segmentCriteria: ISegmentCriteria;
  content: {
    subject?: string;
    templateId?: string;
    smsBody: string;
    emailHtml?: string;
    emailText?: string;
    variables?: Record<string, string>;
  };
  schedule?: {
    sendAt: string;
    timezone?: string;
    recurring?: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      endDate?: string;
    };
  };
  tags?: string[];
  createdBy: string;
}

export interface CampaignExecutionResult {
  success: boolean;
  campaignId: string;
  sent: number;
  failed: number;
  errors: string[];
}

export class CampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(input: CreateCampaignInput): Promise<ICampaign> {
    const campaignId = `CAMP-${uuidv4().slice(0, 8).toUpperCase()}`;

    const campaign = new Campaign({
      campaignId,
      name: input.name,
      description: input.description,
      type: input.type,
      status: 'draft',
      channel: input.channel,
      segmentCriteria: input.segmentCriteria,
      content: {
        subject: input.content.subject,
        templateId: input.content.templateId,
        smsBody: input.content.smsBody,
        emailHtml: input.content.emailHtml,
        emailText: input.content.emailText,
        variables: input.content.variables || {},
      },
      schedule: input.schedule
        ? {
            sendAt: parseISO(input.schedule.sendAt),
            timezone: input.schedule.timezone || 'Asia/Kolkata',
            recurring: input.schedule.recurring,
          }
        : undefined,
      metrics: {
        totalRecipients: 0,
        sent: 0,
        delivered: 0,
        converted: 0,
        revenue: 0,
        optOuts: 0,
      },
      tags: input.tags || [],
      createdBy: input.createdBy,
    });

    await campaign.save();
    logger.info(`Campaign created: ${campaignId}`);
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
    if (updates.description) updateData.description = updates.description;
    if (updates.type) updateData.type = updates.type;
    if (updates.channel) updateData.channel = updates.channel;
    if (updates.segmentCriteria) updateData.segmentCriteria = updates.segmentCriteria;
    if (updates.content) updateData.content = updates.content;
    if (updates.tags) updateData.tags = updates.tags;

    if (updates.schedule) {
      updateData.schedule = {
        sendAt: parseISO(updates.schedule.sendAt),
        timezone: updates.schedule.timezone || 'Asia/Kolkata',
        recurring: updates.schedule.recurring,
      };
    }

    return Campaign.findOneAndUpdate(
      { campaignId, status: 'draft' },
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Schedule a campaign for future sending
   */
  async scheduleCampaign(campaignId: string, sendAt: Date): Promise<ICampaign | null> {
    return Campaign.findOneAndUpdate(
      { campaignId, status: 'draft' },
      {
        $set: {
          status: 'scheduled',
          'schedule.sendAt': sendAt,
        },
      },
      { new: true }
    );
  }

  /**
   * Execute a campaign immediately
   */
  async executeCampaign(campaignId: string): Promise<CampaignExecutionResult> {
    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign) {
      return {
        success: false,
        campaignId,
        sent: 0,
        failed: 0,
        errors: ['Campaign not found'],
      };
    }

    if (!['draft', 'scheduled', 'active'].includes(campaign.status)) {
      return {
        success: false,
        campaignId,
        sent: 0,
        failed: 0,
        errors: [`Cannot execute campaign in ${campaign.status} status`],
      };
    }

    // Update status to active
    campaign.status = 'active';
    await campaign.save();

    // Get target customers
    const segmentFilters = this.criteriaToFilters(campaign.segmentCriteria);
    const { customers } = await customerService.segmentCustomers(segmentFilters);

    // Update metrics
    campaign.metrics.totalRecipients = customers.length;
    await campaign.save();

    logger.info(`Executing campaign ${campaignId} for ${customers.length} customers`);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send to each customer
    for (const customer of customers) {
      try {
        await this.sendCampaignToCustomer(campaign, customer);
        sent++;

        // Log interaction
        await this.logCampaignInteraction(
          customer.customerId,
          'campaign_received',
          campaign.campaignId,
          campaign.channel
        );
      } catch (error) {
        failed++;
        errors.push(`Failed to send to ${customer.customerId}: ${error}`);
        logger.error(`Failed to send campaign ${campaignId} to ${customer.customerId}`, { error });
      }
    }

    // Update metrics
    campaign.metrics.sent = sent;
    campaign.status = 'completed';
    campaign.completedAt = new Date();
    await campaign.save();

    return {
      success: failed === 0,
      campaignId,
      sent,
      failed,
      errors,
    };
  }

  /**
   * Send campaign to a single customer with personalized content
   */
  private async sendCampaignToCustomer(campaign: ICampaign, customer: ICustomer): Promise<void> {
    const personalizedContent = this.personalizeContent(campaign, customer);

    if (campaign.channel === 'sms' || campaign.channel === 'both') {
      await notificationService.sendSMS(customer.phone, personalizedContent.smsBody);
    }

    if ((campaign.channel === 'email' || campaign.channel === 'both') && customer.email) {
      await notificationService.sendEmail(
        customer.email,
        campaign.content.subject || campaign.name,
        personalizedContent.emailHtml || personalizedContent.smsBody
      );
    }
  }

  /**
   * Personalize campaign content for a customer
   */
  private personalizeContent(campaign: ICampaign, customer: ICustomer): {
    smsBody: string;
    emailHtml?: string;
  } {
    const variables: Record<string, string> = {
      customerName: customer.name,
      firstName: customer.name.split(' ')[0],
      lastVisit: customer.lastVisit
        ? format(customer.lastVisit, 'MMMM d, yyyy')
        : 'Never',
      totalSpent: `$${customer.totalSpent.toFixed(2)}`,
      visitCount: customer.visitCount.toString(),
      tier: customer.customerTier.toUpperCase(),
      preferredService: customer.preferredServices[0] || 'our services',
      daysSinceVisit: customer.daysSinceLastVisit.toString(),
      ...Object.fromEntries(
        Object.entries(campaign.content.variables || {}).map(([k, v]) => [k, v])
      ),
    };

    const replaceVariables = (text: string): string => {
      return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
    };

    return {
      smsBody: replaceVariables(campaign.content.smsBody),
      emailHtml: campaign.content.emailHtml
        ? replaceVariables(campaign.content.emailHtml)
        : undefined,
    };
  }

  /**
   * Create and execute birthday campaign
   */
  async runBirthdayCampaign(createdBy: string): Promise<CampaignExecutionResult> {
    const today = new Date();
    const birthdayCustomers = await customerService.getUpcomingBirthdays(7);

    if (birthdayCustomers.length === 0) {
      return {
        success: true,
        campaignId: 'N/A',
        sent: 0,
        failed: 0,
        errors: [],
      };
    }

    const campaign = await this.createCampaign({
      name: `Birthday Campaign - ${format(today, 'MMMM d, yyyy')}`,
      description: 'Automated birthday greetings',
      type: 'birthday',
      channel: 'sms',
      segmentCriteria: { type: 'custom' },
      content: {
        smsBody: 'Happy Birthday, {{firstName}}! 🎂 Visit us today and enjoy a special birthday discount on unknown service. We look forward to celebrating with you!',
      },
      tags: ['automated', 'birthday'],
      createdBy,
    });

    // Override recipients with birthday customers
    const result = await this.executeCampaignForCustomers(campaign, birthdayCustomers);
    return result;
  }

  /**
   * Create and execute anniversary campaign
   */
  async runAnniversaryCampaign(createdBy: string): Promise<CampaignExecutionResult> {
    const today = new Date();
    const anniversaryCustomers = await customerService.getUpcomingAnniversaries(7);

    if (anniversaryCustomers.length === 0) {
      return {
        success: true,
        campaignId: 'N/A',
        sent: 0,
        failed: 0,
        errors: [],
      };
    }

    const campaign = await this.createCampaign({
      name: `Anniversary Campaign - ${format(today, 'MMMM d, yyyy')}`,
      description: 'Automated anniversary greetings',
      type: 'anniversary',
      channel: 'sms',
      segmentCriteria: { type: 'custom' },
      content: {
        smsBody: 'Happy Anniversary, {{firstName}}! 💕 Thank you for being a valued customer. Come celebrate with us and enjoy a special offer!',
      },
      tags: ['automated', 'anniversary'],
      createdBy,
    });

    return this.executeCampaignForCustomers(campaign, anniversaryCustomers);
  }

  /**
   * Create and execute re-engagement campaign for at-risk customers
   */
  async runReengagementCampaign(
    createdBy: string,
    inactiveDays: number = 60
  ): Promise<CampaignExecutionResult> {
    const atRiskCustomers = await customerService.getAtRiskCustomers(inactiveDays);

    if (atRiskCustomers.length === 0) {
      return {
        success: true,
        campaignId: 'N/A',
        sent: 0,
        failed: 0,
        errors: [],
      };
    }

    const campaign = await this.createCampaign({
      name: `Re-engagement Campaign - ${format(new Date(), 'MMMM yyyy')}`,
      description: `Customers inactive for ${inactiveDays}+ days`,
      type: 'reengagement',
      channel: 'sms',
      segmentCriteria: {
        type: 'days_inactive',
        minDaysInactive: inactiveDays,
      },
      content: {
        smsBody: 'Hey {{firstName}}, we miss you! It\'s been {{daysSinceVisit}} days since your last visit. Come back and enjoy 20% off your next service. Book now!',
      },
      tags: ['automated', 'reengagement'],
      createdBy,
    });

    return this.executeCampaignForCustomers(campaign, atRiskCustomers);
  }

  /**
   * Execute campaign for specific customers
   */
  async executeCampaignForCustomers(
    campaign: ICampaign,
    customers: ICustomer[]
  ): Promise<CampaignExecutionResult> {
    campaign.status = 'active';
    campaign.metrics.totalRecipients = customers.length;
    await campaign.save();

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const customer of customers) {
      try {
        await this.sendCampaignToCustomer(campaign, customer);
        sent++;

        await this.logCampaignInteraction(
          customer.customerId,
          'campaign_received',
          campaign.campaignId,
          campaign.channel
        );
      } catch (error) {
        failed++;
        errors.push(`Failed: ${customer.customerId}`);
      }
    }

    campaign.metrics.sent = sent;
    campaign.status = 'completed';
    campaign.completedAt = new Date();
    await campaign.save();

    return { success: failed === 0, campaignId: campaign.campaignId, sent, failed, errors };
  }

  /**
   * Get campaigns with filters
   */
  async getCampaigns(filters: {
    type?: CampaignType;
    status?: CampaignStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<ICampaign[]> {
    const query: Record<string, unknown> = {};

    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) (query.createdAt as Record<string, Date>).$gte = parseISO(filters.startDate);
      if (filters.endDate) (query.createdAt as Record<string, Date>).$lte = parseISO(filters.endDate);
    }

    return Campaign.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<ICampaign | null> {
    return Campaign.findOne({ campaignId });
  }

  /**
   * Track campaign conversion (when a customer takes action)
   */
  async trackConversion(
    campaignId: string,
    customerId: string,
    revenue?: number
  ): Promise<void> {
    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign) return;

    campaign.metrics.converted += 1;
    if (revenue) {
      campaign.metrics.revenue += revenue;
    }
    await campaign.save();

    await this.logCampaignInteraction(
      customerId,
      'campaign_converted',
      campaignId,
      undefined,
      { revenue }
    );
  }

  /**
   * Get customers matching segment criteria
   */
  async getTargetCustomers(criteria: ISegmentCriteria): Promise<ICustomer[]> {
    const filters = this.criteriaToFilters(criteria);
    const { customers } = await customerService.segmentCustomers(filters);
    return customers;
  }

  /**
   * Preview campaign - see who would receive it
   */
  async previewCampaign(campaignId: string, limit: number = 10): Promise<{
    campaign: ICampaign;
    sampleCustomers: ICustomer[];
    totalTargeted: number;
  }> {
    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const filters = this.criteriaToFilters(campaign.segmentCriteria);
    const { customers, totalCount } = await customerService.segmentCustomers(filters);

    return {
      campaign,
      sampleCustomers: customers.slice(0, limit),
      totalTargeted: totalCount,
    };
  }

  /**
   * Cancel a campaign
   */
  async cancelCampaign(campaignId: string): Promise<ICampaign | null> {
    return Campaign.findOneAndUpdate(
      { campaignId, status: { $in: ['draft', 'scheduled'] } },
      { $set: { status: 'cancelled' } },
      { new: true }
    );
  }

  /**
   * Pause a running campaign
   */
  async pauseCampaign(campaignId: string): Promise<ICampaign | null> {
    return Campaign.findOneAndUpdate(
      { campaignId, status: 'active' },
      { $set: { status: 'paused' } },
      { new: true }
    );
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(campaignId: string): Promise<ICampaign | null> {
    return Campaign.findOneAndUpdate(
      { campaignId, status: 'paused' },
      { $set: { status: 'active' } },
      { new: true }
    );
  }

  // Helper methods

  private criteriaToFilters(criteria: ISegmentCriteria): CustomerFilters {
    const filters: CustomerFilters = {};

    switch (criteria.type) {
      case 'all':
        break;
      case 'tier':
        filters.tier = criteria.tiers?.[0];
        break;
      case 'spend_range':
        filters.minSpend = criteria.minSpend;
        filters.maxSpend = criteria.maxSpend;
        break;
      case 'visit_frequency':
        filters.minVisits = criteria.minVisits;
        filters.maxVisits = criteria.maxVisits;
        break;
      case 'days_inactive':
        filters.daysInactiveMin = criteria.minDaysInactive;
        filters.daysInactiveMax = criteria.maxDaysInactive;
        break;
      case 'service_preference':
        filters.services = criteria.services;
        break;
      case 'tags':
        filters.tags = criteria.tags;
        break;
      case 'custom':
        // Custom queries handled separately
        break;
    }

    return filters;
  }

  private async logCampaignInteraction(
    customerId: string,
    type: InteractionType,
    campaignId: string,
    channel?: 'sms' | 'email' | 'both',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const interaction = new Interaction({
        interactionId: `INT-${uuidv4().slice(0, 8).toUpperCase()}`,
        customerId,
        type,
        channel: channel === 'both' ? 'sms' : channel as 'sms' | 'email' | undefined,
        campaignId,
        metadata: metadata || {},
      });
      await interaction.save();
    } catch (error) {
      logger.error('Failed to log campaign interaction', { customerId, type, campaignId, error });
    }
  }
}

export const campaignService = new CampaignService();
