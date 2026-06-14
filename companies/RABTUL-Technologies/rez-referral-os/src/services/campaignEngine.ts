import { Types } from 'mongoose';
import { Campaign, ReferralCode, CampaignEnrollment } from '../models';
import { CampaignDocument } from '../models/Campaign';
import { ReferralType } from '../types/referral';
import { logger } from '../utils/logger';

export interface CreateCampaignOptions {
  type: ReferralType;
  name: string;
  description?: string;
  sponsorId?: string;
  sponsorType?: 'merchant' | 'brand';
  budget?: number;
  referrerReward: {
    type: 'fixed' | 'percentage' | 'coins' | 'discount';
    value: number;
    coinType?: string;
  };
  refereeReward?: {
    type: 'fixed' | 'percentage' | 'coins' | 'discount';
    value: number;
    coinType?: string;
  };
  targetSegments?: string[];
  categories?: string[];
  companies?: string[];
  maxRewards?: number;
  maxRewardsPerUser?: number;
  minPurchaseAmount?: number;
  startDate: Date;
  endDate?: Date;
  companyId?: string;
}

export class CampaignEngine {
  /**
   * Create a new campaign
   */
  async createCampaign(options: CreateCampaignOptions): Promise<CampaignDocument> {
    const {
      type,
      name,
      description,
      sponsorId,
      sponsorType,
      budget,
      referrerReward,
      refereeReward,
      targetSegments,
      categories,
      companies,
      maxRewards,
      maxRewardsPerUser,
      minPurchaseAmount,
      startDate,
      endDate,
      companyId = 'rez',
    } = options;

    const campaign = await Campaign.create({
      type,
      companyId,
      name,
      description,
      sponsorId: sponsorId ? new Types.ObjectId(sponsorId) : undefined,
      sponsorType,
      budget,
      spent: 0,
      referrerReward,
      refereeReward,
      targetSegments,
      categories,
      companies,
      maxRewards,
      maxRewardsPerUser,
      minPurchaseAmount,
      startDate,
      endDate,
      isActive: true,
    });

    logger.info('[CampaignEngine] Created campaign:', {
      campaignId: campaign._id,
      name,
      type,
    });

    return campaign;
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<CampaignDocument | null> {
    return Campaign.findById(campaignId);
  }

  /**
   * Get active campaigns
   */
  async getActiveCampaigns(filters?: {
    companyId?: string;
    type?: ReferralType;
    categories?: string[];
  }): Promise<CampaignDocument[]> {
    return Campaign.findActive({
      companyId: filters?.companyId,
      type: filters?.type,
    });
  }

  /**
   * Get campaigns for a sponsor
   */
  async getSponsorCampaigns(
    sponsorId: string,
    options?: { activeOnly?: boolean }
  ): Promise<CampaignDocument[]> {
    const query: Record<string, unknown> = {
      sponsorId: new Types.ObjectId(sponsorId),
    };

    if (options?.activeOnly) {
      query.isActive = true;
    }

    return Campaign.find(query).sort({ createdAt: -1 });
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    campaignId: string,
    updates: Partial<CreateCampaignOptions>
  ): Promise<CampaignDocument | null> {
    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { $set: updates },
      { new: true }
    );

    if (campaign) {
      logger.info('[CampaignEngine] Updated campaign:', { campaignId });
    }

    return campaign;
  }

  /**
   * Activate/deactivate campaign
   */
  async setCampaignActive(campaignId: string, active: boolean): Promise<void> {
    await Campaign.findByIdAndUpdate(campaignId, { isActive: active });
    logger.info('[CampaignEngine] Campaign status changed:', { campaignId, active });
  }

  /**
   * Check campaign budget
   */
  async checkBudget(campaignId: string, additionalAmount = 0): Promise<{
    hasBudget: boolean;
    remaining: number;
    total: number;
  }> {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return { hasBudget: false, remaining: 0, total: 0 };
    }

    if (!campaign.budget) {
      return { hasBudget: true, remaining: Infinity, total: Infinity };
    }

    const spent = campaign.spent || 0;
    const remaining = campaign.budget - spent - additionalAmount;
    return {
      hasBudget: remaining >= 0,
      remaining: Math.max(0, remaining),
      total: campaign.budget,
    };
  }

  /**
   * Track campaign spend
   */
  async trackSpend(campaignId: string, amount: number): Promise<void> {
    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { spent: amount },
    });
  }

  /**
   * Get campaign stats
   */
  async getCampaignStats(campaignId: string): Promise<{
    totalRewards: number;
    rewardsUsed: number;
    budgetUtilization: number;
    isActive: boolean;
    isWithinDate: boolean;
  } | null> {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return null;

    const now = new Date();
    const isWithinDate = now >= campaign.startDate && (!campaign.endDate || now <= campaign.endDate);
    const spent = campaign.spent || 0;
    const budgetUtilization = campaign.budget
      ? (spent / campaign.budget) * 100
      : 0;

    return {
      totalRewards: campaign.maxRewards || 0,
      rewardsUsed: spent || 0,
      budgetUtilization,
      isActive: campaign.isActive,
      isWithinDate,
    };
  }

  /**
   * Enroll user in campaign
   */
  async enrollInCampaign(
    campaignId: string,
    userId: string
  ): Promise<{
    success: boolean;
    referralCode?: string;
    enrollmentId?: string;
    error?: string;
  }> {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    // Validate campaign is active
    const validation = campaign.isValid();
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    // Check budget availability
    const budgetCheck = await this.checkBudget(campaignId, 0);
    if (!budgetCheck.hasBudget) {
      return { success: false, error: 'Campaign budget exhausted' };
    }

    try {
      // Check if already enrolled
      const existingEnrollment = await CampaignEnrollment.findOne({
        campaignId: new Types.ObjectId(campaignId),
        userId: new Types.ObjectId(userId),
      });

      if (existingEnrollment) {
        // Get existing referral code
        const existingCode = await ReferralCode.findOne({
          ownerId: new Types.ObjectId(userId),
          type: campaign.type,
          companyId: campaign.companyId,
        });

        return {
          success: true,
          referralCode: existingCode?.code,
          enrollmentId: existingEnrollment._id.toString(),
        };
      }

      // Check max rewards per user limit
      if (campaign.maxRewardsPerUser) {
        const userEnrollmentCount = await CampaignEnrollment.countDocuments({
          campaignId: new Types.ObjectId(campaignId),
          userId: new Types.ObjectId(userId),
        });

        if (userEnrollmentCount >= campaign.maxRewardsPerUser) {
          return {
            success: false,
            error: `Maximum enrollments per user (${campaign.maxRewardsPerUser}) reached`,
          };
        }
      }

      // Get or create referral code for user
      const referralCode = await ReferralCode.findOneAndUpdate(
        {
          ownerId: new Types.ObjectId(userId),
          type: campaign.type,
          companyId: campaign.companyId,
        },
        {},
        { upsert: true, new: true }
      );

      // Create campaign enrollment record
      const enrollment = new CampaignEnrollment({
        campaignId: new Types.ObjectId(campaignId),
        userId: new Types.ObjectId(userId),
        referralCodeId: referralCode._id,
        enrolledAt: new Date(),
        status: 'active',
        metadata: {
          enrollmentSource: 'direct',
          campaignType: campaign.type,
          companyId: campaign.companyId,
        },
      });

      await enrollment.save();

      logger.info('[CampaignEngine] User enrolled in campaign', {
        enrollmentId: enrollment._id.toString(),
        campaignId,
        userId,
        referralCode: referralCode.code,
      });

      return {
        success: true,
        referralCode: referralCode.code,
        enrollmentId: enrollment._id.toString(),
      };
    } catch (error) {
      logger.error('[CampaignEngine] Failed to enroll user in campaign', {
        campaignId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: `Enrollment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get campaign referrers
   */
  async getCampaignReferrers(
    campaignId: string,
    options?: { limit?: number; skip?: number }
  ): Promise<unknown[]> {
    // This would require a CampaignEnrollment model or linking referrals to campaigns
    // For now, return empty
    return [];
  }
}

export const campaignEngine = new CampaignEngine();
