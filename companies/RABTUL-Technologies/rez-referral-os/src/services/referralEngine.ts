import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  ReferralCode,
  Referral,
  ReferralCodeDocument,
  ReferralDocument,
} from '../models';
import { ITouchpoint, ReferralType, ReferralStatus, DEFAULT_REFERRAL_REWARDS } from '../types/referral';
import { logger } from '../utils/logger';

export interface GenerateCodeOptions {
  ownerId: string;
  ownerType: 'user' | 'merchant' | 'creator';
  type: ReferralType;
  companyId?: string;
  isPublic?: boolean;
}

export interface TrackReferralOptions {
  code: string;
  refereeId?: string;
  touchpoint: Partial<ITouchpoint>;
}

export interface RegisterReferralOptions {
  referrerId: string;
  refereeId: string;
  code: string;
  type: ReferralType;
  companyId?: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
}

export interface QualifyReferralOptions {
  refereeId: string;
  action: 'first_order' | 'first_payment' | 'account_verified';
  actionId?: string;
  idempotencyKey?: string;
}

export class ReferralEngine {
  /**
   * Generate a unique referral code for a user/merchant/creator
   */
  async generateCode(options: GenerateCodeOptions): Promise<ReferralCodeDocument> {
    const { ownerId, ownerType, type, companyId = 'rez', isPublic = false } = options;

    // Check if user already has a code for this type
    const existing = await ReferralCode.findOne({
      ownerId: new Types.ObjectId(ownerId),
      type,
      companyId,
    });

    if (existing) {
      return existing;
    }

    // Generate new code
    const code = await ReferralCode.generateCode(type);

    const referralCode = await ReferralCode.create({
      code,
      type,
      ownerId: new Types.ObjectId(ownerId),
      ownerType,
      companyId,
      isPublic,
      totalReferrals: 0,
      qualifiedReferrals: 0,
      lifetimeEarnings: 0,
      trustScore: 100,
    });

    logger.info('[ReferralEngine] Generated code:', { code, type, ownerId });
    return referralCode;
  }

  /**
   * Get referral code by code string
   */
  async getCodeByCode(code: string): Promise<ReferralCodeDocument | null> {
    return ReferralCode.findOne({ code: code.toUpperCase(), isActive: true });
  }

  /**
   * Get referral code for a user
   */
  async getCodeForUser(
    userId: string,
    type: ReferralType,
    companyId = 'rez'
  ): Promise<ReferralCodeDocument | null> {
    return ReferralCode.findOne({
      ownerId: new Types.ObjectId(userId),
      type,
      companyId,
    });
  }

  /**
   * Track a referral touchpoint (click, scan, etc.)
   */
  async trackTouchpoint(options: TrackReferralOptions): Promise<ReferralDocument | null> {
    const { code, refereeId, touchpoint } = options;

    const referralCode = await this.getCodeByCode(code);
    if (!referralCode) {
      logger.warn('[ReferralEngine] Invalid referral code:', code);
      return null;
    }

    // If we have a referee ID, update the referral record
    if (refereeId) {
      let referral = await Referral.findOne({
        referralCodeId: referralCode._id,
        refereeId: new Types.ObjectId(refereeId),
      });

      if (referral) {
        // Add touchpoint to existing referral
        await referral.addTouchpoint({
          source: touchpoint.source || 'link',
          medium: touchpoint.medium || 'click',
          timestamp: new Date(),
          ip: touchpoint.ip,
          deviceId: touchpoint.deviceId,
          userAgent: touchpoint.userAgent,
          location: touchpoint.location,
        });
      }

      return referral;
    }

    return null;
  }

  /**
   * Register a new referral (when referee signs up)
   */
  async registerReferral(options: RegisterReferralOptions): Promise<ReferralDocument | null> {
    const { referrerId, refereeId, code, type, companyId = 'rez', campaignId, metadata } = options;

    // Get referral code
    const referralCode = await this.getCodeByCode(code);
    if (!referralCode) {
      logger.warn('[ReferralEngine] Invalid referral code:', code);
      return null;
    }

    // Check self-referral
    if (referrerId === refereeId) {
      logger.warn('[ReferralEngine] Self-referral attempt:', { referrerId, refereeId });
      return null;
    }

    // Check if referral already exists (for consumer type)
    if (type === 'consumer') {
      const existing = await Referral.findOne({
        referrerId: new Types.ObjectId(referrerId),
        refereeId: new Types.ObjectId(refereeId),
        type,
      });

      if (existing) {
        logger.info('[ReferralEngine] Referral already exists:', existing._id);
        return existing;
      }
    }

    // Create referral record
    const referral = await Referral.create({
      type,
      campaignId: campaignId ? new Types.ObjectId(campaignId) : undefined,
      referrerId: new Types.ObjectId(referrerId),
      refereeId: new Types.ObjectId(refereeId),
      referralCodeId: referralCode._id,
      firstTouch: {
        source: metadata?.source as string || 'direct',
        timestamp: new Date(),
      },
      lastTouch: {
        source: metadata?.source as string || 'direct',
        timestamp: new Date(),
      },
      touchpoints: [],
      riskScore: 0,
      riskFlags: [],
      status: 'registered',
      rewardAmount: 0,
      rewardType: 'coins',
      coinType: 'referral',
      companyId,
      metadata: metadata || {},
    });

    // Increment referral count on code
    await referralCode.incrementReferrals();

    logger.info('[ReferralEngine] Registered referral:', {
      referralId: referral._id,
      referrerId,
      refereeId,
    });

    return referral;
  }

  /**
   * Qualify a referral (when referee completes qualifying action)
   */
  async qualifyReferral(options: QualifyReferralOptions): Promise<ReferralDocument | null> {
    const { refereeId, action, actionId, idempotencyKey } = options;

    // Find pending referral for this referee
    let referral = await Referral.findOne({
      refereeId: new Types.ObjectId(refereeId),
      status: { $in: ['pending', 'registered', 'clicked'] },
    });

    if (!referral) {
      // Try to find by the referrer's referral code if referee registered directly
      referral = await Referral.findOne({
        refereeId: new Types.ObjectId(refereeId),
      });
    }

    if (!referral) {
      logger.warn('[ReferralEngine] No referral found for qualification:', refereeId);
      return null;
    }

    // Check idempotency
    if (idempotencyKey && referral.metadata?.idempotencyKey === idempotencyKey) {
      logger.info('[ReferralEngine] Duplicate qualification:', idempotencyKey);
      return referral;
    }

    // Update referral
    referral.status = 'qualified';
    referral.qualifiedAt = new Date();
    if (idempotencyKey) {
      referral.metadata = { ...referral.metadata, idempotencyKey, qualifyingAction: action, qualifyingActionId: actionId };
    }
    await referral.save();

    // Update referral code stats
    const referralCode = await ReferralCode.findById(referral.referralCodeId);
    if (referralCode) {
      await referralCode.incrementReferrals(true);
    }

    logger.info('[ReferralEngine] Qualified referral:', {
      referralId: referral._id,
      refereeId,
      action,
    });

    return referral;
  }

  /**
   * Get referral by ID
   */
  async getReferralById(referralId: string): Promise<ReferralDocument | null> {
    return Referral.findById(referralId);
  }

  /**
   * Get referrals for a referrer
   */
  async getReferralsByReferrer(
    referrerId: string,
    options?: { status?: ReferralStatus; limit?: number; skip?: number }
  ): Promise<ReferralDocument[]> {
    const query: Record<string, unknown> = { referrerId: new Types.ObjectId(referrerId) };
    if (options?.status) {
      query.status = options.status;
    }

    return Referral.find(query)
      .sort({ createdAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50);
  }

  /**
   * Get referral status for a user (referee)
   */
  async getReferralStatus(refereeId: string): Promise<{
    hasReferral: boolean;
    status?: ReferralStatus;
    referrerId?: string;
  }> {
    const referral = await Referral.findOne({
      refereeId: new Types.ObjectId(refereeId),
    });

    if (!referral) {
      return { hasReferral: false };
    }

    return {
      hasReferral: true,
      status: referral.status,
      referrerId: referral.referrerId.toString(),
    };
  }

  /**
   * Get referral stats for a user
   */
  async getReferralStats(referrerId: string): Promise<{
    totalReferrals: number;
    qualifiedReferrals: number;
    pendingReferrals: number;
    rewardedReferrals: number;
    conversionRate: number;
    lifetimeEarnings: number;
  }> {
    const referrals = await Referral.find({
      referrerId: new Types.ObjectId(referrerId),
    });

    const totalReferrals = referrals.length;
    const qualifiedReferrals = referrals.filter((r) => ['qualified', 'rewarded'].includes(r.status)).length;
    const pendingReferrals = referrals.filter((r) => ['pending', 'clicked', 'registered'].includes(r.status)).length;
    const rewardedReferrals = referrals.filter((r) => r.status === 'rewarded').length;
    const conversionRate = totalReferrals > 0 ? (qualifiedReferrals / totalReferrals) * 100 : 0;

    const referralCode = await ReferralCode.findOne({
      ownerId: new Types.ObjectId(referrerId),
    });

    return {
      totalReferrals,
      qualifiedReferrals,
      pendingReferrals,
      rewardedReferrals,
      conversionRate,
      lifetimeEarnings: referralCode?.lifetimeEarnings || 0,
    };
  }

  /**
   * Get leaderboard of top referrers
   */
  async getLeaderboard(
    type: ReferralType,
    companyId = 'rez',
    limit = 10
  ): Promise<ReferralCodeDocument[]> {
    return ReferralCode.find({
      type,
      companyId,
      isActive: true,
      isPublic: true,
    })
      .sort({ qualifiedReferrals: -1, totalReferrals: -1 })
      .limit(limit);
  }

  /**
   * Deactivate a referral code
   */
  async deactivateCode(codeId: string): Promise<void> {
    await ReferralCode.findByIdAndUpdate(codeId, { isActive: false });
  }

  /**
   * Get or create default referral code for user
   */
  async getOrCreateCode(userId: string, type: ReferralType = 'consumer', companyId = 'rez'): Promise<ReferralCodeDocument> {
    const existing = await this.getCodeForUser(userId, type, companyId);
    if (existing) return existing;

    return this.generateCode({
      ownerId: userId,
      ownerType: 'user',
      type,
      companyId,
    });
  }
}

export const referralEngine = new ReferralEngine();
