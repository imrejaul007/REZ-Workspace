import { v4 as uuidv4 } from 'uuid';
import { UnifiedAccount, LoyaltyTransactionModel, CrossIndustryRedemptionModel } from '../models';
import { tierService } from './tierService';
import { crossIndustryService } from './crossIndustryService';
import { sendLoyaltyNotification } from '../integrations/rabtul';
import { logger } from '../utils/logger';
import { EarnPointsRequest, RedeemPointsRequest, TransferPointsRequest } from '../types';
import { config } from '../config';

export class LoyaltyEngine {
  /**
   * Create a new unified loyalty account
   */
  async createAccount(
    userId: string,
    phone: string,
    email?: string
  ): Promise<any> {
    try {
      // Check if account already exists
      const existing = await UnifiedAccount.findOne({
        $or: [{ userId }, { phone }, ...(email ? [{ email }] : [])]
      });

      if (existing) {
        throw new Error('Account already exists for this userId or phone');
      }

      const accountId = `acc_${uuidv4()}`;

      const account = new UnifiedAccount({
        accountId,
        userId,
        phone,
        email,
        totalPoints: 0,
        tier: 'bronze',
        verticals: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await account.save();

      logger.info(`Created new loyalty account: ${accountId}`);

      return account;
    } catch (error) {
      logger.error('Error creating loyalty account:', error);
      throw error;
    }
  }

  /**
   * Earn points for an account
   */
  async earnPoints(request: EarnPointsRequest): Promise<any> {
    try {
      const { accountId, userId, merchantId, vertical, points, source, sourceId, description, expiresInDays } = request;

      // Find the account
      const account = await UnifiedAccount.findOne({ accountId });
      if (!account) {
        throw new Error('Account not found');
      }

      // Apply campaign multiplier
      const campaignMultiplier = await this.applyCampaignMultiplier(accountId, merchantId, vertical);
      const finalPoints = Math.floor(points * campaignMultiplier);

      // Get tier multiplier
      const tier = await tierService.getUserTier(account.totalPoints);
      const tierBonus = Math.floor(finalPoints * (tier.multiplier - 1));
      const totalPointsToEarn = finalPoints + tierBonus;

      // Create transaction
      const transactionId = `txn_${uuidv4()}`;
      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;

      const transaction = new LoyaltyTransactionModel({
        transactionId,
        accountId,
        userId,
        merchantId,
        vertical,
        type: 'earn',
        points: totalPointsToEarn,
        source,
        sourceId,
        description,
        expiresAt,
        createdAt: new Date()
      });

      await transaction.save();

      // Update account vertical
      account.updateVertical(vertical, totalPointsToEarn);

      // Recalculate tier
      const newTier = await tierService.getUserTier(account.totalPoints);
      if (newTier && newTier.name !== account.tier) {
        account.tier = newTier.name;
        logger.info(`Account ${accountId} upgraded to tier: ${newTier.name}`);
      }

      await account.save();

      // Send notification
      await sendLoyaltyNotification({
        type: 'points_earned',
        accountId,
        userId,
        points: totalPointsToEarn,
        vertical,
        merchantId
      });

      logger.info(`Earned ${totalPointsToEarn} points for account ${accountId}`);

      return {
        transaction,
        account,
        pointsEarned: totalPointsToEarn,
        campaignMultiplier,
        tierMultiplier: tier.multiplier
      };
    } catch (error) {
      logger.error('Error earning points:', error);
      throw error;
    }
  }

  /**
   * Redeem points for an account
   */
  async redeemPoints(request: RedeemPointsRequest): Promise<any> {
    try {
      const { accountId, merchantId, vertical, points, sourceId, description } = request;

      // Find the account
      const account = await UnifiedAccount.findOne({ accountId });
      if (!account) {
        throw new Error('Account not found');
      }

      // Check available points in this vertical
      const verticalPoints = account.getPointsByVertical(vertical);
      if (verticalPoints < points) {
        throw new Error(`Insufficient points. Available: ${verticalPoints}, Required: ${points}`);
      }

      // Create transaction
      const transactionId = `txn_${uuidv4()}`;

      const transaction = new LoyaltyTransactionModel({
        transactionId,
        accountId,
        userId: account.userId,
        merchantId,
        vertical,
        type: 'redeem',
        points: -points,
        source: 'redemption',
        sourceId,
        description,
        createdAt: new Date()
      });

      await transaction.save();

      // Update account vertical
      account.updateVertical(vertical, -points);
      await account.save();

      // Send notification
      await sendLoyaltyNotification({
        type: 'points_redeemed',
        accountId,
        userId: account.userId,
        points,
        vertical,
        merchantId
      });

      logger.info(`Redeemed ${points} points for account ${accountId}`);

      return {
        transaction,
        account,
        pointsRedeemed: points
      };
    } catch (error) {
      logger.error('Error redeeming points:', error);
      throw error;
    }
  }

  /**
   * Transfer points between verticals
   */
  async transferPoints(request: TransferPointsRequest): Promise<any> {
    try {
      const { accountId, fromVertical, toVertical, points } = request;

      // Find the account
      const account = await UnifiedAccount.findOne({ accountId });
      if (!account) {
        throw new Error('Account not found');
      }

      // Check available points
      const fromVerticalPoints = account.getPointsByVertical(fromVertical);
      if (fromVerticalPoints < points) {
        throw new Error(`Insufficient points in ${fromVertical}. Available: ${fromVerticalPoints}, Required: ${points}`);
      }

      // Create transfer record
      const redemption = await crossIndustryService.redeemCrossIndustry(
        accountId,
        fromVertical,
        toVertical,
        points,
        'internal_transfer'
      );

      // Update account verticals
      account.updateVertical(fromVertical, -points);
      account.updateVertical(toVertical, redemption.convertedValue);
      await account.save();

      logger.info(`Transferred ${points} points from ${fromVertical} to ${toVertical} for account ${accountId}`);

      return {
        redemption,
        account
      };
    } catch (error) {
      logger.error('Error transferring points:', error);
      throw error;
    }
  }

  /**
   * Calculate tier based on total points
   */
  async calculateTier(totalPoints: number): Promise<any> {
    return tierService.getUserTier(totalPoints);
  }

  /**
   * Check and expire points
   */
  async checkAndExpirePoints(): Promise<number> {
    try {
      const now = new Date();

      // Find expired transactions
      const expiredTransactions = await LoyaltyTransactionModel.find({
        type: 'earn',
        expiresAt: { $lte: now },
        createdAt: { $exists: true }
      });

      let expiredCount = 0;

      for (const txn of expiredTransactions) {
        // Create expiration transaction
        const expireTxnId = `txn_${uuidv4()}`;
        const expireTransaction = new LoyaltyTransactionModel({
          transactionId: expireTxnId,
          accountId: txn.accountId,
          userId: txn.userId,
          merchantId: txn.merchantId,
          vertical: txn.vertical,
          type: 'expire',
          points: -Math.abs(txn.points),
          source: 'expiration',
          sourceId: txn.transactionId,
          description: `Points expired from transaction ${txn.transactionId}`,
          createdAt: new Date()
        });

        await expireTransaction.save();

        // Update account
        const account = await UnifiedAccount.findOne({ accountId: txn.accountId });
        if (account) {
          account.updateVertical(txn.vertical, txn.points);
          await account.save();
        }

        expiredCount++;
      }

      logger.info(`Expired ${expiredCount} transactions`);
      return expiredCount;
    } catch (error) {
      logger.error('Error expiring points:', error);
      throw error;
    }
  }

  /**
   * Apply campaign multiplier
   */
  async applyCampaignMultiplier(accountId: string, merchantId: string, vertical: string): Promise<number> {
    try {
      const { LoyaltyCampaignModel } = await import('../models');

      const now = new Date();

      const activeCampaign = await LoyaltyCampaignModel.findOne({
        merchantId,
        vertical,
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now },
        $or: [
          { participants: { $size: 0 } },
          { participants: accountId }
        ]
      }).sort({ multiplier: -1 });

      return activeCampaign ? activeCampaign.multiplier : 1.0;
    } catch (error) {
      logger.error('Error applying campaign multiplier:', error);
      return 1.0;
    }
  }

  /**
   * Get account balance across all verticals
   */
  async getBalance(accountId: string): Promise<any> {
    const account = await UnifiedAccount.findOne({ accountId });
    if (!account) {
      throw new Error('Account not found');
    }

    const tier = await tierService.getUserTier(account.totalPoints);

    return {
      accountId,
      totalPoints: account.totalPoints,
      tier: account.tier,
      tierMultiplier: tier.multiplier,
      verticals: account.verticals,
      lastActivity: account.updatedAt
    };
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(accountId: string, limit: number = 50): Promise<any[]> {
    return LoyaltyTransactionModel.find({ accountId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export const loyaltyEngine = new LoyaltyEngine();

export default loyaltyEngine;