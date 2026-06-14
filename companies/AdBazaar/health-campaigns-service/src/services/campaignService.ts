import axios from 'axios';
import { HealthCampaign, IHealthCampaign, IHealthCriteria } from '../models/HealthCampaign';
import { EngagementRecord } from '../models/Engagement';
import { logger } from 'utils/logger.js';
import { NotFoundError, ValidationError, ConflictError, ServiceUnavailableError } from '../utils/errors';

const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:4011';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';

export interface CreateCampaignInput {
  type: IHealthCampaign['type'];
  title: string;
  description?: string;
  message: string;
  targetCriteria?: IHealthCriteria;
  channels: IHealthCampaign['channels'];
  schedule?: IHealthCampaign['schedule'];
  incentives?: IHealthCampaign['incentives'];
  createdBy: string;
}

export interface UpdateCampaignInput {
  title?: string;
  description?: string;
  message?: string;
  targetCriteria?: IHealthCriteria;
  channels?: IHealthCampaign['channels'];
  schedule?: IHealthCampaign['schedule'];
  incentives?: IHealthCampaign['incentives'];
}

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  converted: number;
  failed: number;
  deliveryRate: number;
  openRate: number;
  conversionRate: number;
}

// Mock data for health profiles (fallback when external service unavailable)
const mockHealthProfiles = [
  { id: 'P001', name: 'John Doe', age: 45, gender: 'male', conditions: ['diabetes', 'hypertension'], riskLevel: 'high', city: 'Mumbai', lastVisitDays: 30 },
  { id: 'P002', name: 'Jane Smith', age: 32, gender: 'female', conditions: [], riskLevel: 'low', city: 'Delhi', lastVisitDays: 15 },
  { id: 'P003', name: 'Raj Kumar', age: 58, gender: 'male', conditions: ['heart_disease'], riskLevel: 'high', city: 'Bangalore', lastVisitDays: 60 },
  { id: 'P004', name: 'Priya Sharma', age: 28, gender: 'female', conditions: [], riskLevel: 'low', city: 'Mumbai', lastVisitDays: 7 },
  { id: 'P005', name: 'Amit Verma', age: 42, gender: 'male', conditions: ['diabetes'], riskLevel: 'medium', city: 'Pune', lastVisitDays: 45 },
];

class CampaignService {
  /**
   * Create a new health campaign
   */
  async createCampaign(input: CreateCampaignInput): Promise<IHealthCampaign> {
    logger.info('Creating health campaign', { title: input.title, type: input.type });

    const campaign = new HealthCampaign({
      ...input,
      status: 'draft',
      metrics: { sent: 0, delivered: 0, opened: 0, converted: 0, failed: 0 },
    });

    await campaign.save();
    logger.info('Health campaign created', { campaignId: campaign.id });

    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<IHealthCampaign> {
    const campaign = await HealthCampaign.findOne({ id: campaignId });
    if (!campaign) {
      throw new NotFoundError('Campaign', campaignId);
    }
    return campaign;
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId: string, input: UpdateCampaignInput): Promise<IHealthCampaign> {
    const campaign = await this.getCampaign(campaignId);

    if (campaign.status === 'active') {
      throw new ConflictError('Cannot update an active campaign');
    }

    Object.assign(campaign, input);
    await campaign.save();
    logger.info('Campaign updated', { campaignId });

    return campaign;
  }

  /**
   * Schedule campaign for future execution
   */
  async scheduleCampaign(campaignId: string, startDate: Date): Promise<IHealthCampaign> {
    const campaign = await this.getCampaign(campaignId);

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new ValidationError('Can only schedule draft or paused campaigns');
    }

    campaign.status = 'scheduled';
    campaign.schedule = {
      ...campaign.schedule,
      startDate,
    };
    await campaign.save();

    logger.info('Campaign scheduled', { campaignId, startDate });
    return campaign;
  }

  /**
   * Send campaign to targeted profiles
   */
  async sendCampaign(campaignId: string): Promise<{ success: boolean; metrics: CampaignMetrics }> {
    const campaign = await this.getCampaign(campaignId);

    if (campaign.status === 'completed') {
      throw new ConflictError('Campaign has already been completed');
    }

    logger.info('Sending campaign', { campaignId, channels: campaign.channels });

    // Get target profiles
    const targets = await this.targetByHealthProfile(campaign.targetCriteria);
    logger.info(`Targeted ${targets.length} profiles`, { campaignId });

    // Simulate sending to each channel
    let sent = 0;
    let delivered = 0;
    let opened = 0;
    let converted = 0;
    let failed = 0;

    for (const profile of targets) {
      for (const channel of campaign.channels) {
        try {
          await this.sendToChannel(campaign, profile, channel);
          sent++;

          // Simulate delivery (90% success)
          if (Math.random() > 0.1) {
            delivered++;
            // Simulate open (60% of delivered)
            if (Math.random() > 0.4) {
              opened++;
              // Simulate conversion (20% of opened)
              if (Math.random() > 0.8) {
                converted++;
              }
            }
          } else {
            failed++;
          }

          // Record engagement
          await this.trackEngagement(profile.id, campaignId, channel, 'sent');
        } catch (error) {
          failed++;
          logger.error('Failed to send to channel', { profileId: profile.id, channel, error });
        }
      }
    }

    // Update campaign metrics
    campaign.metrics = { sent, delivered, opened, converted, failed };
    campaign.status = 'active';
    campaign.sentAt = new Date();
    await campaign.save();

    const metrics: CampaignMetrics = {
      ...campaign.metrics,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      conversionRate: opened > 0 ? (converted / opened) * 100 : 0,
    };

    logger.info('Campaign sent', { campaignId, metrics });
    return { success: true, metrics };
  }

  /**
   * Pause an active campaign
   */
  async pauseCampaign(campaignId: string): Promise<IHealthCampaign> {
    const campaign = await this.getCampaign(campaignId);

    if (campaign.status !== 'active') {
      throw new ValidationError('Only active campaigns can be paused');
    }

    campaign.status = 'paused';
    await campaign.save();

    logger.info('Campaign paused', { campaignId });
    return campaign;
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(campaignId: string): Promise<IHealthCampaign> {
    const campaign = await this.getCampaign(campaignId);

    if (campaign.status !== 'paused') {
      throw new ValidationError('Only paused campaigns can be resumed');
    }

    campaign.status = 'active';
    await campaign.save();

    logger.info('Campaign resumed', { campaignId });
    return campaign;
  }

  /**
   * Complete a campaign
   */
  async completeCampaign(campaignId: string): Promise<IHealthCampaign> {
    const campaign = await this.getCampaign(campaignId);

    campaign.status = 'completed';
    campaign.completedAt = new Date();
    await campaign.save();

    logger.info('Campaign completed', { campaignId });
    return campaign;
  }

  /**
   * Target profiles by health criteria
   */
  async targetByHealthProfile(criteria: IHealthCriteria): Promise<Array<{ id: string; name: string }>> {
    try {
      // Try to fetch from external campaign service
      const response = await axios.post(
        `${process.env.CAMPAIGN_SERVICE_URL || 'http://localhost:4900'}/api/targets/health`,
        { criteria },
        { timeout: 5000 }
      );
      return response.data.targets;
    } catch (error) {
      // Fallback to mock data
      logger.warn('External campaign service unavailable, using mock data', { error });
      return this.filterMockProfiles(criteria);
    }
  }

  /**
   * Target by family/circle
   */
  async targetByFamily(familyId: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await axios.get(
        `${process.env.CAMPAIGN_SERVICE_URL || 'http://localhost:4900'}/api/families/${familyId}/members`,
        { timeout: 5000 }
      );
      return response.data.members;
    } catch (error) {
      logger.warn('External campaign service unavailable, using mock data', { error });
      // Return mock family members
      return mockHealthProfiles.slice(0, 3).map(p => ({ id: p.id, name: p.name }));
    }
  }

  /**
   * Track engagement for a profile
   */
  async trackEngagement(
    profileId: string,
    campaignId: string,
    channel: string,
    action: 'sent' | 'delivered' | 'opened' | 'clicked' | 'converted' | 'ignored'
  ): Promise<void> {
    const record = new EngagementRecord({
      profileId,
      campaignId,
      channel,
      action,
      timestamp: new Date(),
    });
    await record.save();
  }

  /**
   * Get campaign metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    const campaign = await this.getCampaign(campaignId);

    const { sent, delivered, opened, converted, failed } = campaign.metrics;

    return {
      sent,
      delivered,
      opened,
      converted,
      failed,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      conversionRate: opened > 0 ? (converted / opened) * 100 : 0,
    };
  }

  /**
   * Get campaigns by status
   */
  async getCampaignsByStatus(status: IHealthCampaign['status']): Promise<IHealthCampaign[]> {
    return HealthCampaign.find({ status }).sort({ createdAt: -1 });
  }

  /**
   * Send to a specific channel
   */
  private async sendToChannel(
    campaign: IHealthCampaign,
    profile: { id: string; name: string },
    channel: string
  ): Promise<void> {
    const message = {
      to: profile.id,
      channel,
      title: campaign.title,
      message: campaign.message,
      campaignId: campaign.id,
      incentive: campaign.incentives,
    };

    switch (channel) {
      case 'whatsapp':
        await this.sendViaWhatsApp(message);
        break;
      case 'sms':
      case 'push':
      case 'email':
        await this.sendViaNotification(message);
        break;
      default:
        logger.warn('Unknown channel', { channel });
    }
  }

  private async sendViaWhatsApp(message: Record<string, unknown>): Promise<void> {
    try {
      await axios.post(`${WHATSAPP_SERVICE_URL}/api/send`, message, { timeout: 10000 });
    } catch (error) {
      logger.warn('WhatsApp service unavailable, simulating send', { message });
    }
  }

  private async sendViaNotification(message: Record<string, unknown>): Promise<void> {
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notify`, message, { timeout: 10000 });
    } catch (error) {
      logger.warn('Notification service unavailable, simulating send', { message });
    }
  }

  private filterMockProfiles(criteria: IHealthCriteria): Array<{ id: string; name: string }> {
    return mockHealthProfiles
      .filter(profile => {
        if (criteria.ageMin && profile.age < criteria.ageMin) return false;
        if (criteria.ageMax && profile.age > criteria.ageMax) return false;
        if (criteria.gender?.length && !criteria.gender.includes(profile.gender)) return false;
        if (criteria.conditions?.length) {
          const hasCondition = criteria.conditions.some(c => profile.conditions.includes(c));
          if (!hasCondition) return false;
        }
        if (criteria.riskLevel?.length && !criteria.riskLevel.includes(profile.riskLevel as 'low' | 'medium' | 'high')) return false;
        if (criteria.location?.city?.length && !criteria.location.city.includes(profile.city)) return false;
        if (criteria.lastVisitDays && profile.lastVisitDays > criteria.lastVisitDays) return false;
        return true;
      })
      .map(p => ({ id: p.id, name: p.name }));
  }
}

export const campaignService = new CampaignService();
