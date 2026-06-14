import { Types } from 'mongoose';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Referral, ReferralCode, ReferralReward, Campaign } from '../models';
import { ReferralDocument } from '../models/Referral';
import { DEFAULT_REFERRAL_REWARDS, AMBASSADOR_THRESHOLDS, AMBASSADOR_TIER } from '../types/referral';
import { validateEnv } from '../config/env';
import { logger } from '../utils/logger';

export interface IssueRewardOptions {
  referralId: string;
  referrerId: string;
  refereeId: string;
  type: 'coins' | 'cashback' | 'discount' | 'commission';
  amount?: number;
  coinType?: string;
  source?: 'referral' | 'ambassador_bonus' | 'team_bonus' | 'campaign';
  campaignId?: string;
  companyId?: string;
  idempotencyKey?: string;
}

export interface RewardCalculation {
  referrerReward: number;
  refereeReward: number;
  referrerCoinType: string;
  refereeCoinType: string;
}

export class RewardEngine {
  private readonly MAX_REFERRALS_PER_MONTH = 50;
  private readonly MAX_COIN_OPERATION = 1_000_000;

  /**
   * Calculate rewards for a referral
   */
  async calculateRewards(
    referral: ReferralDocument,
    campaignId?: string
  ): Promise<RewardCalculation> {
    // Check for campaign-specific rewards
    if (campaignId) {
      const campaign = await Campaign.findById(campaignId);
      if (campaign && campaign.isActive) {
        return {
          referrerReward: campaign.referrerReward.value,
          refereeReward: campaign.refereeReward?.value || 0,
          referrerCoinType: campaign.referrerReward.coinType || 'referral',
          refereeCoinType: campaign.refereeReward?.coinType || 'referral',
        };
      }
    }

    // Use default rewards
    const defaults = DEFAULT_REFERRAL_REWARDS[referral.type] || DEFAULT_REFERRAL_REWARDS.consumer;
    return {
      referrerReward: defaults.referrer.value,
      refereeReward: defaults.referee.value,
      referrerCoinType: defaults.referrer.coinType || 'referral',
      refereeCoinType: defaults.referee.coinType || 'referral',
    };
  }

  /**
   * Validate before issuing reward
   */
  async validateReward(referrerId: string, refereeId: string): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    // Check monthly cap
    const monthlyCount = await this.getMonthlyReferralCount(referrerId);
    if (monthlyCount >= this.MAX_REFERRALS_PER_MONTH) {
      return {
        valid: false,
        reason: `Monthly referral limit (${this.MAX_REFERRALS_PER_MONTH}) exceeded`,
      };
    }

    // Check self-referral
    if (referrerId === refereeId) {
      return { valid: false, reason: 'Self-referral not allowed' };
    }

    return { valid: true };
  }

  /**
   * Issue reward to referrer
   */
  async issueReward(options: IssueRewardOptions): Promise<{
    success: boolean;
    rewardId?: string;
    error?: string;
  }> {
    const { referralId, referrerId, refereeId, type, amount, source = 'referral', campaignId, companyId = 'rez', idempotencyKey } = options;

    // Validate
    const validation = await this.validateReward(referrerId, refereeId);
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    // Get referral to calculate amount
    const referral = await Referral.findById(referralId);
    if (!referral) {
      return { success: false, error: 'Referral not found' };
    }

    // Calculate amount if not provided
    const calculatedAmount = amount || referral.rewardAmount || (await this.calculateRewards(referral, campaignId)).referrerReward;

    // Check max operation
    if (calculatedAmount > this.MAX_COIN_OPERATION) {
      return { success: false, error: 'Reward amount exceeds maximum allowed' };
    }

    // Create reward record
    const idempotency = idempotencyKey || `reward:${referralId}:${referrerId}:${uuidv4()}`;
    const result = await ReferralReward.findOrCreate({
      referralId: new Types.ObjectId(referralId),
      referrerId: new Types.ObjectId(referrerId),
      refereeId: new Types.ObjectId(refereeId),
      type,
      amount: calculatedAmount,
      coinType: options.coinType || 'referral',
      source: source as 'referral' | 'ambassador_bonus' | 'team_bonus' | 'campaign',
      campaignId: campaignId ? new Types.ObjectId(campaignId) : undefined,
      companyId,
      idempotencyKey: idempotency,
    });

    if (!result.created && result.existing) {
      return { success: true, rewardId: result.existing._id.toString() }; // Already exists
    }

    if (!result.created) {
      return { success: false, error: 'Failed to create reward' };
    }

    const reward = result.reward!;

    // Update referral status
    referral.status = 'rewarded';
    referral.rewardedAt = new Date();
    referral.rewardAmount = calculatedAmount;
    referral.rewardType = type;
    referral.coinType = options.coinType || 'referral';
    await referral.save();

    // Update referral code stats
    const referralCode = await ReferralCode.findById(referral.referralCodeId);
    if (referralCode) {
      await referralCode.addEarnings(calculatedAmount);
    }

    // Credit wallet via wallet service
    await this.creditWallet(referrerId, calculatedAmount, options.coinType || 'referral', 'referral', idempotency);

    // Track campaign spend if applicable
    if (campaignId) {
      const campaign = await Campaign.findById(campaignId);
      if (campaign) {
        await campaign.trackSpend(calculatedAmount);
      }
    }

    logger.info('[RewardEngine] Issued reward:', {
      rewardId: reward._id,
      referralId,
      referrerId,
      amount: calculatedAmount,
    });

    return { success: true, rewardId: reward._id.toString() };
  }

  /**
   * Credit wallet via wallet service
   */
  private async creditWallet(
    userId: string,
    amount: number,
    coinType: string,
    source: string,
    idempotencyKey: string
  ): Promise<void> {
    const env = validateEnv();
    const walletUrl = env.WALLET_SERVICE_URL;

    try {
      await axios.post(
        `${walletUrl}/internal/credit`,
        {
          userId,
          amount,
          coinType,
          source,
          description: 'Referral reward',
          idempotencyKey,
        },
        {
          headers: {
            'X-Internal-Token': env.INTERNAL_SERVICE_TOKEN || '',
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );
      logger.info('[RewardEngine] Wallet credited:', { userId, amount, coinType });
    } catch (error) {
      logger.error('[RewardEngine] Failed to credit wallet:', {
        userId,
        amount,
        error: (error as Error).message,
      });
      // Don't fail the reward, just log
    }
  }

  /**
   * Revoke reward
   */
  async revokeReward(rewardId: string, reason: string): Promise<void> {
    const reward = await ReferralReward.findById(rewardId);
    if (!reward) {
      throw new Error('Reward not found');
    }

    if (reward.status === 'reversed') {
      return; // Already reversed
    }

    // Reverse the reward
    await reward.reverse();

    // Debit wallet
    await this.debitWallet(
      reward.referrerId.toString(),
      reward.amount,
      reward.coinType || 'referral',
      `revoked:${rewardId}`,
      reason
    );

    // Update referral status
    const referral = await Referral.findById(reward.referralId);
    if (referral) {
      referral.status = 'rejected';
      referral.rewardAmount = 0;
      await referral.save();
    }

    // Update referral code stats
    const referralCode = await ReferralCode.findOne({ ownerId: reward.referrerId });
    if (referralCode) {
      referralCode.lifetimeEarnings = Math.max(0, referralCode.lifetimeEarnings - reward.amount);
      await referralCode.save();
    }

    logger.info('[RewardEngine] Revoked reward:', { rewardId, reason });
  }

  /**
   * Debit wallet via wallet service
   */
  private async debitWallet(
    userId: string,
    amount: number,
    coinType: string,
    source: string,
    reason: string
  ): Promise<void> {
    const env = validateEnv();
    const walletUrl = env.WALLET_SERVICE_URL;

    try {
      await axios.post(
        `${walletUrl}/internal/debit`,
        {
          userId,
          amount,
          coinType,
          source,
          description: `Referral reward revoked: ${reason}`,
        },
        {
          headers: {
            'X-Internal-Token': env.INTERNAL_SERVICE_TOKEN || '',
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );
    } catch (error) {
      logger.error('[RewardEngine] Failed to debit wallet:', {
        userId,
        amount,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get monthly referral count for a user
   */
  private async getMonthlyReferralCount(referrerId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const rewards = await ReferralReward.countDocuments({
      referrerId: new Types.ObjectId(referrerId),
      status: { $nin: ['reversed', 'rejected'] },
      source: 'referral',
      createdAt: { $gte: startOfMonth },
    });

    return rewards;
  }

  /**
   * Get ambassador bonus multiplier
   */
  async getAmbassadorMultiplier(referrerId: string): Promise<number> {
    const referralCode = await ReferralCode.findOne({
      ownerId: new Types.ObjectId(referrerId),
    });

    if (!referralCode) return 1.0;

    const qualifiedCount = referralCode.qualifiedReferrals;

    // Determine tier
    let tier: typeof AMBASSADOR_TIER[keyof typeof AMBASSADOR_TIER] = 'bronze';
    if (qualifiedCount >= AMBASSADOR_THRESHOLDS.diamond) tier = 'diamond';
    else if (qualifiedCount >= AMBASSADOR_THRESHOLDS.platinum) tier = 'platinum';
    else if (qualifiedCount >= AMBASSADOR_THRESHOLDS.gold) tier = 'gold';
    else if (qualifiedCount >= AMBASSADOR_THRESHOLDS.silver) tier = 'silver';

    // Return multiplier based on tier
    const multipliers = {
      bronze: 1.0,
      silver: 1.05,
      gold: 1.1,
      platinum: 1.15,
      diamond: 1.2,
    };

    return multipliers[tier] || 1.0;
  }

  /**
   * Get pending rewards summary for a user
   */
  async getPendingRewardsSummary(userId: string): Promise<{
    pending: number;
    approved: number;
    lifetime: number;
  }> {
    const referralCode = await ReferralCode.findOne({
      ownerId: new Types.ObjectId(userId),
    });

    const rewards = await ReferralReward.find({
      referrerId: new Types.ObjectId(userId),
    });

    const pending = rewards.filter((r) => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
    const approved = rewards.filter((r) => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0);
    const lifetime = referralCode?.lifetimeEarnings || 0;

    return { pending, approved, lifetime };
  }
}

export const rewardEngine = new RewardEngine();
