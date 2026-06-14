import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { Referral, IReferral } from '../models/Referral';
import { CoinTransaction } from '../models/CoinTransaction';
import { logger } from '../config/logger';

// Default referral reward configuration
const DEFAULT_REFERRER_REWARD = 100;
const DEFAULT_REFERRED_REWARD = 50;
const REFERRAL_EXPIRY_DAYS = 30;

export interface ReferralConfig {
  referrerReward: number;
  referredReward: number;
  expiryDays?: number;
}

export interface GenerateCodeResult {
  code: string;
  expiresAt: Date;
}

export interface ProcessReferralResult {
  referral: IReferral;
  referrerPointsAwarded: number;
  referredPointsAwarded: number;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  expiredReferrals: number;
  totalPointsAwarded: number;
  referredUsersCount: number;
}

export class ReferralService {
  /**
   * Generate a unique referral code for a user
   */
  async generateReferralCode(userId: string, merchantId: string): Promise<GenerateCodeResult> {
    // Generate unique 8-character uppercase code
    const code = this.generateUniqueCode();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFERRAL_EXPIRY_DAYS);

    await Referral.create({
      referrerId: new Types.ObjectId(userId),
      referralCode: code,
      merchantId: new Types.ObjectId(merchantId),
      status: 'pending',
      referrerReward: { points: DEFAULT_REFERRER_REWARD },
      referredReward: { points: DEFAULT_REFERRED_REWARD },
      expiresAt,
    });

    logger.info('Generated referral code', {
      userId,
      merchantId,
      code,
      expiresAt,
    });

    return { code, expiresAt };
  }

  /**
   * Apply a referral code for a new user
   */
  async applyReferralCode(code: string, referredId: string): Promise<IReferral | null> {
    const referral = await Referral.findOne({ referralCode: code.toUpperCase() });

    if (!referral) {
      logger.warn('Invalid referral code attempted', { code });
      return null;
    }

    if (referral.status === 'completed') {
      logger.warn('Referral code already used', { code, referredId });
      return null;
    }

    if (referral.status === 'expired' || (referral.expiresAt && referral.expiresAt < new Date())) {
      logger.warn('Referral code expired', { code });
      return null;
    }

    if (referral.referrerId.toString() === referredId) {
      logger.warn('Self-referral attempted', { code, referredId });
      return null;
    }

    // Check if user already has a pending referral
    const existingReferral = await Referral.findOne({ referredId: new Types.ObjectId(referredId), status: 'pending' });
    if (existingReferral) {
      logger.warn('User already has pending referral', { referredId });
      return null;
    }

    // Update referral with the referred user
    referral.referredId = new Types.ObjectId(referredId);
    referral.status = 'pending';
    await referral.save();

    logger.info('Referral code applied', {
      code,
      referrerId: referral.referrerId,
      referredId,
    });

    return referral;
  }

  /**
   * Process a completed referral and award points
   */
  async processReferral(referralId: string): Promise<ProcessReferralResult | null> {
    const referral = await Referral.findById(referralId);

    if (!referral) {
      logger.error('Referral not found', { referralId });
      return null;
    }

    if (referral.status === 'completed') {
      logger.warn('Referral already processed', { referralId });
      return null;
    }

    const config = await this.getReferralConfig(referral.merchantId.toString());
    const now = new Date();

    // Award points to referrer
    await this.awardPoints(
      referral.referrerId.toString(),
      referral.merchantId.toString(),
      config.referrerReward,
      'Referral bonus',
      referral.referralCode
    );

    // Award points to referred user
    await this.awardPoints(
      referral.referredId.toString(),
      referral.merchantId.toString(),
      config.referredReward,
      'Welcome bonus',
      referral.referralCode
    );

    // Update referral status
    referral.status = 'completed';
    referral.referrerReward.points = config.referrerReward;
    referral.referrerReward.awardedAt = now;
    referral.referredReward.points = config.referredReward;
    referral.referredReward.awardedAt = now;
    await referral.save();

    logger.info('Referral processed successfully', {
      referralId,
      referrerId: referral.referrerId,
      referredId: referral.referredId,
      referrerPoints: config.referrerReward,
      referredPoints: config.referredReward,
    });

    return {
      referral,
      referrerPointsAwarded: config.referrerReward,
      referredPointsAwarded: config.referredReward,
    };
  }

  /**
   * Get referral configuration for a merchant
   */
  async getReferralConfig(merchantId: string): Promise<ReferralConfig> {
    // In production, this would fetch from MerchantLoyaltyConfig
    // For now, return defaults
    return {
      referrerReward: DEFAULT_REFERRER_REWARD,
      referredReward: DEFAULT_REFERRED_REWARD,
      expiryDays: REFERRAL_EXPIRY_DAYS,
    };
  }

  /**
   * Award points to a user
   */
  private async awardPoints(
    userId: string,
    merchantId: string,
    points: number,
    description: string,
    referralCode: string
  ): Promise<CoinTransaction> {
    const transaction = await CoinTransaction.create({
      user: new Types.ObjectId(userId),
      merchantId: new Types.ObjectId(merchantId),
      coinType: 'referral',
      source: 'referral_award',
      type: 'credit',
      amount: points,
      coins: points,
      description,
      status: 'completed',
      reason: 'referral',
      metadata: {
        referralCode,
        source: 'referral_system',
      },
    });

    logger.info('Awarded referral points', {
      userId,
      merchantId,
      points,
      description,
      transactionId: transaction._id,
    });

    return transaction;
  }

  /**
   * Get referral statistics for a user
   */
  async getReferralStats(userId: string): Promise<ReferralStats> {
    const stats = await Referral.aggregate([
      { $match: { referrerId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPointsAwarded: { $sum: '$referrerReward.points' },
        },
      },
    ]);

    const result: ReferralStats = {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      expiredReferrals: 0,
      totalPointsAwarded: 0,
      referredUsersCount: 0,
    };

    for (const stat of stats) {
      result.totalReferrals += stat.count;
      result.totalPointsAwarded += stat.totalPointsAwarded || 0;

      switch (stat._id) {
        case 'completed':
          result.completedReferrals = stat.count;
          break;
        case 'pending':
          result.pendingReferrals = stat.count;
          break;
        case 'expired':
          result.expiredReferrals = stat.count;
          break;
      }
    }

    // Count unique referred users
    const referredCount = await Referral.countDocuments({
      referrerId: new Types.ObjectId(userId),
      status: 'completed',
    });
    result.referredUsersCount = referredCount;

    return result;
  }

  /**
   * Get referral history for a user
   */
  async getReferralHistory(userId: string, page: number = 1, limit: number = 20): Promise<{
    referrals: IReferral[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [referrals, total] = await Promise.all([
      Referral.find({ referrerId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Referral.countDocuments({ referrerId: new Types.ObjectId(userId) }),
    ]);

    return {
      referrals: referrals as unknown as IReferral[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Expire stale pending referrals
   */
  async expireStaleReferrals(): Promise<number> {
    const result = await Referral.updateMany(
      {
        status: 'pending',
        expiresAt: { $lt: new Date() },
      },
      {
        $set: { status: 'expired' },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info('Expired stale referrals', { count: result.modifiedCount });
    }

    return result.modifiedCount;
  }

  /**
   * Generate unique 8-character referral code
   */
  private generateUniqueCode(): string {
    // Use first 8 chars of UUID without dashes, uppercase
    return uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  }
}

// Singleton instance
export const referralService = new ReferralService();
