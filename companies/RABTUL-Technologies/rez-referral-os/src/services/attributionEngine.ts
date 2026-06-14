import { Types } from 'mongoose';
import { Referral, ReferralCode } from '../models';
import { ReferralDocument } from '../models/Referral';
import { ITouchpoint } from '../types/referral';
import { logger } from '../utils/logger';

export interface AttributionResult {
  firstTouch: {
    source: string;
    timestamp: Date;
    referrerId?: string;
  } | null;
  lastTouch: {
    source: string;
    timestamp: Date;
    referrerId?: string;
  } | null;
  touchpoints: ITouchpoint[];
  attributionModel: 'first_touch' | 'last_touch' | 'multi_touch';
  creditedReferrerId?: string;
}

export class AttributionEngine {
  /**
   * Track a new touchpoint for a user
   */
  async trackTouchpoint(data: {
    refereeId: string;
    referrerId: string;
    referralCodeId: Types.ObjectId;
    source: string;
    medium: string;
    ip?: string;
    deviceId?: string;
    userAgent?: string;
    location?: { lat: number; lng: number };
    campaignId?: string;
  }): Promise<ReferralDocument | null> {
    const { refereeId, referrerId, referralCodeId, source, medium, ip, deviceId, userAgent, location, campaignId } = data;

    // Find existing referral or create new one
    let referral = await Referral.findOne({
      refereeId: new Types.ObjectId(refereeId),
    });

    if (!referral) {
      // Create new referral
      referral = await Referral.create({
        type: 'consumer',
        referrerId: new Types.ObjectId(referrerId),
        refereeId: new Types.ObjectId(refereeId),
        referralCodeId,
        campaignId: campaignId ? new Types.ObjectId(campaignId) : undefined,
        firstTouch: {
          source,
          timestamp: new Date(),
        },
        lastTouch: {
          source,
          timestamp: new Date(),
        },
        touchpoints: [],
        riskScore: 0,
        riskFlags: [],
        status: 'pending',
        rewardAmount: 0,
        rewardType: 'coins',
        coinType: 'referral',
        companyId: 'rez',
        metadata: {},
      });
    } else {
      // Update last touch
      referral.lastTouch = {
        source,
        timestamp: new Date(),
      };
    }

    // Add touchpoint
    const touchpoint: ITouchpoint = {
      source,
      medium,
      timestamp: new Date(),
      ip,
      deviceId,
      userAgent,
      location,
    };

    referral.touchpoints.push(touchpoint);
    await referral.save();

    logger.debug('[AttributionEngine] Tracked touchpoint:', {
      refereeId,
      source,
      medium,
      totalTouchpoints: referral.touchpoints.length,
    });

    return referral;
  }

  /**
   * Get full attribution report for a user
   */
  async getAttributionReport(refereeId: string): Promise<AttributionResult | null> {
    const referral = await Referral.findOne({
      refereeId: new Types.ObjectId(refereeId),
    });

    if (!referral) {
      return null;
    }

    return {
      firstTouch: referral.firstTouch,
      lastTouch: referral.lastTouch,
      touchpoints: referral.touchpoints,
      attributionModel: 'multi_touch',
      creditedReferrerId: referral.referrerId.toString(),
    };
  }

  /**
   * Get attribution based on model
   */
  async getAttribution(refereeId: string, model: 'first_touch' | 'last_touch' = 'last_touch'): Promise<string | null> {
    const referral = await Referral.findOne({
      refereeId: new Types.ObjectId(refereeId),
    });

    if (!referral) {
      return null;
    }

    if (model === 'first_touch' && referral.firstTouch) {
      return referral.referrerId.toString();
    }

    return referral.referrerId.toString();
  }

  /**
   * Get referral chain (for team referrals)
   */
  async getReferralChain(userId: string, maxDepth = 3): Promise<{
    depth: number;
    chain: Array<{
      referrerId: string;
      referralCode: string;
      timestamp: Date;
      level: number;
    }>;
  } | null> {
    const chain: Array<{
      referrerId: string;
      referralCode: string;
      timestamp: Date;
      level: number;
    }> = [];

    let currentUserId = userId;
    let depth = 0;

    while (depth < maxDepth) {
      const referral = await Referral.findOne({
        refereeId: new Types.ObjectId(currentUserId),
      }).populate('referralCodeId');

      if (!referral) {
        break;
      }

      const referralCode = await ReferralCode.findById(referral.referralCodeId);
      chain.push({
        referrerId: referral.referrerId.toString(),
        referralCode: referralCode?.code || '',
        timestamp: referral.createdAt,
        level: depth + 1,
      });

      currentUserId = referral.referrerId.toString();
      depth++;
    }

    if (chain.length === 0) {
      return null;
    }

    return { depth: chain.length, chain };
  }

  /**
   * Calculate rewards for team referrals (multi-level)
   */
  async calculateTeamRewards(baseReward: number, refereeId: string): Promise<Array<{
    referrerId: string;
    level: number;
    reward: number;
    percentage: number;
  }>> {
    const chain = await this.getReferralChain(refereeId, 3);
    if (!chain) return [];

    const levels = [
      { level: 1, percentage: 1.0 },   // 100% of base
      { level: 2, percentage: 0.1 },   // 10% of base
      { level: 3, percentage: 0.05 },  // 5% of base
    ];

    const rewards: Array<{
      referrerId: string;
      level: number;
      reward: number;
      percentage: number;
    }> = [];

    for (const levelConfig of levels) {
      const chainMember = chain.chain.find((c) => c.level === levelConfig.level);
      if (chainMember) {
        const reward = Math.floor(baseReward * levelConfig.percentage);
        rewards.push({
          referrerId: chainMember.referrerId,
          level: levelConfig.level,
          reward,
          percentage: levelConfig.percentage * 100,
        });
      }
    }

    return rewards;
  }
}

export const attributionEngine = new AttributionEngine();
