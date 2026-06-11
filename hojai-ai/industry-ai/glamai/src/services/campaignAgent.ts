/**
 * GLAMAI - Campaign Agent Service
 * Salon AI Operating System
 *
 * AI Employee: Handles marketing campaigns, promotions, loyalty programs, and customer targeting.
 */

import { Campaign, Customer, Service } from '../models';
import { CAMPAIGN_TEMPLATES } from '../config';
import { CampaignResponse, CampaignType } from '../types';
import { logger } from '../middleware/logger';

/**
 * Campaign Agent Service Class
 */
export class CampaignAgentService {
  /**
   * Create a new campaign
   */
  async createCampaign(params: {
    type: CampaignType;
    targetSegment?: string;
    discount?: number;
    customMessage?: string;
    duration?: number;
  }): Promise<{ campaign: any; response: CampaignResponse }> {
    const { type, targetSegment, discount, customMessage, duration } = params;

    logger.info('Campaign Agent: Creating campaign', { type, targetSegment });

    // Get campaign template
    const template = CAMPAIGN_TEMPLATES[type] || CAMPAIGN_TEMPLATES.promotion;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (duration || 7));

    // Create campaign
    const campaign = await Campaign.create({
      type,
      subject: template.subject,
      message: customMessage || template.message,
      discount: discount || template.discount,
      validFrom: new Date(),
      validUntil,
      targetSegment: targetSegment || 'all',
      status: 'active',
      sentCount: 0,
    });

    // Count target customers
    const targetCount = await this.getTargetCustomerCount(targetSegment || 'all');
    const estimatedReach = Math.floor(targetCount * 0.7);

    logger.info('Campaign Agent: Campaign created', {
      campaignId: campaign._id,
      type,
      targetCount,
    });

    return {
      campaign,
      response: {
        id: campaign._id.toString(),
        type: campaign.type,
        subject: campaign.subject,
        discount: campaign.discount,
        targetSegment: campaign.targetSegment,
        validUntil: campaign.validUntil,
        estimatedReach,
      },
    };
  }

  /**
   * Get target customer count for a segment
   */
  private async getTargetCustomerCount(segment: string): Promise<number> {
    let query: any = {};

    switch (segment) {
      case 'inactive': {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = {
          $or: [
            { lastVisit: { $lt: thirtyDaysAgo } },
            { lastVisit: null },
          ],
        };
        break;
      }
      case 'loyal': {
        query = { loyaltyTier: { $in: ['gold', 'platinum'] } };
        break;
      }
      case 'birthday': {
        const today = new Date();
        query = {
          $expr: {
            $and: [
              { $eq: [{ $month: '$birthday' }, today.getMonth() + 1] },
              { $eq: [{ $dayOfMonth: '$birthday' }, today.getDate()] },
            ],
          },
        };
        break;
      }
      case 'new': {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = { createdAt: { $gte: sevenDaysAgo } };
        break;
      }
      case 'vip': {
        query = { totalSpent: { $gte: 10000 } };
        break;
      }
      default:
        // 'all' or any other value
        query = {};
    }

    return Customer.countDocuments(query);
  }

  /**
   * Get customers for a segment
   */
  async getTargetCustomers(segment: string, limit: number = 100): Promise<any[]> {
    const query: any = {};

    switch (segment) {
      case 'inactive': {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query.$or = [
          { lastVisit: { $lt: thirtyDaysAgo } },
          { lastVisit: null },
        ];
        break;
      }
      case 'loyal': {
        query.loyaltyTier = { $in: ['gold', 'platinum'] };
        break;
      }
      case 'birthday': {
        const today = new Date();
        query.$expr = {
          $and: [
            { $eq: [{ $month: '$birthday' }, today.getMonth() + 1] },
            { $eq: [{ $dayOfMonth: '$birthday' }, today.getDate()] },
          ],
        };
        break;
      }
      case 'new': {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query.createdAt = { $gte: sevenDaysAgo };
        break;
      }
      case 'vip': {
        query.totalSpent = { $gte: 10000 };
        break;
      }
    }

    return Customer.find(query).limit(limit);
  }

  /**
   * Get campaign insights
   */
  getCampaignInsights(type: CampaignType): {
    recommendedTiming: string;
    expectedResponse: string;
    topServices: string[];
  } {
    const insights: Record<string, any> = {
      birthday: {
        recommendedTiming: 'Send 7 days before birthday',
        expectedResponse: '35-45%',
        topServices: ['Facial', 'Massage', 'Manicure'],
      },
      loyalty: {
        recommendedTiming: 'Send on the 1st of every month',
        expectedResponse: '40-50%',
        topServices: ['Hair Coloring', 'Spa Treatment', 'Makeup'],
      },
      promotion: {
        recommendedTiming: 'Send during off-peak hours (2PM-5PM)',
        expectedResponse: '30-40%',
        topServices: ['Haircut', 'Manicure', 'Pedicure'],
      },
      winback: {
        recommendedTiming: 'Send on weekday evenings',
        expectedResponse: '20-30%',
        topServices: ['Haircut', 'Facial', 'Massage'],
      },
      seasonal: {
        recommendedTiming: 'Send 2 weeks before season starts',
        expectedResponse: '35-45%',
        topServices: ['Hair Styling', 'Makeup', 'Spa'],
      },
      referral: {
        recommendedTiming: 'Send on weekends',
        expectedResponse: '25-35%',
        topServices: ['Any Service'],
      },
    };

    return insights[type] || insights.promotion;
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(campaignId: string, status: string): Promise<any> {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    campaign.status = status as any;
    await campaign.save();

    return campaign;
  }

  /**
   * Increment sent count
   */
  async incrementSentCount(campaignId: string): Promise<void> {
    await Campaign.findByIdAndUpdate(campaignId, { $inc: { sentCount: 1 } });
  }

  /**
   * Get active campaigns
   */
  async getActiveCampaigns(): Promise<any[]> {
    const now = new Date();
    return Campaign.find({
      status: 'active',
      validUntil: { $gte: now },
    }).sort({ createdAt: -1 });
  }

  /**
   * Get campaigns by type
   */
  async getCampaignsByType(type: CampaignType): Promise<any[]> {
    return Campaign.find({ type }).sort({ createdAt: -1 });
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string): Promise<any> {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const targetCount = await this.getTargetCustomerCount(campaign.targetSegment);
    const sentCount = campaign.sentCount;
    const deliveryRate = targetCount > 0 ? (sentCount / targetCount) * 100 : 0;

    // For now, estimate response rate based on sent count
    // In production, this would track actual conversions
    const estimatedResponses = Math.floor(sentCount * 0.35);
    const responseRate = sentCount > 0 ? (estimatedResponses / sentCount) * 100 : 0;

    return {
      campaignId,
      type: campaign.type,
      targetSegment: campaign.targetSegment,
      targetCount,
      sentCount,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      estimatedResponses,
      responseRate: Math.round(responseRate * 100) / 100,
      discount: campaign.discount,
      validUntil: campaign.validUntil,
      status: campaign.status,
    };
  }
}

export default new CampaignAgentService();