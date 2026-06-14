import { v4 as uuidv4 } from 'uuid';
import { CrossIndustryRedemptionModel, UnifiedAccount } from '../models';
import { ConversionResult } from '../types';
import { logger } from '../utils/logger';
import { config } from '../config';

// Conversion rate matrix between verticals
// Default is 1:1, can be customized per vertical pair
const VERTICAL_CONVERSION_RATES: Record<string, Record<string, number>> = {
  restaurant: { spa: 0.9, retail: 1.0, hotel: 0.85, entertainment: 1.0 },
  spa: { restaurant: 1.1, retail: 1.0, hotel: 0.95, entertainment: 1.0 },
  retail: { restaurant: 1.0, spa: 1.0, hotel: 0.9, entertainment: 1.0 },
  hotel: { restaurant: 1.15, spa: 1.05, retail: 1.0, entertainment: 0.9 },
  travel: { hotel: 1.2, restaurant: 1.1, retail: 1.0, entertainment: 1.0 },
  entertainment: { restaurant: 1.0, spa: 1.0, hotel: 1.1, retail: 1.0 },
  fitness: { spa: 1.0, health: 1.1, retail: 0.9 },
  healthcare: { pharmacy: 1.0, fitness: 1.1, spa: 0.9 },
  beauty: { spa: 1.0, retail: 1.0, fitness: 0.9 },
  // Add more conversions as needed
};

// Default conversion rate
const DEFAULT_CONVERSION_RATE = 1.0;

export class CrossIndustryService {
  /**
   * Get conversion rate between two verticals
   */
  getConversionRate(fromVertical: string, toVertical: string): number {
    // Check for direct conversion rate
    if (VERTICAL_CONVERSION_RATES[fromVertical]?.[toVertical]) {
      return VERTICAL_CONVERSION_RATES[fromVertical][toVertical];
    }

    // Check reverse conversion
    if (VERTICAL_CONVERSION_RATES[toVertical]?.[fromVertical]) {
      return 1 / VERTICAL_CONVERSION_RATES[toVertical][fromVertical];
    }

    // Check if same vertical
    if (fromVertical === toVertical) {
      return 1.0;
    }

    // Use config default or fallback to 1:1
    return config.CROSS_INDUSTRY_CONVERSION_RATE || DEFAULT_CONVERSION_RATE;
  }

  /**
   * Convert points between verticals
   */
  async convertPoints(
    accountId: string,
    fromVertical: string,
    toVertical: string,
    points: number
  ): Promise<ConversionResult> {
    try {
      // Find the account
      const account = await UnifiedAccount.findOne({ accountId });
      if (!account) {
        throw new Error('Account not found');
      }

      // Check if user has enough points in the source vertical
      const fromVerticalData = account.verticals.find(v => v.vertical === fromVertical);
      if (!fromVerticalData || fromVerticalData.points < points) {
        throw new Error(
          `Insufficient points in ${fromVertical}. Available: ${fromVerticalData?.points || 0}, Required: ${points}`
        );
      }

      // Get conversion rate
      const conversionRate = this.getConversionRate(fromVertical, toVertical);

      // Calculate converted value
      const convertedValue = Math.floor(points * conversionRate);

      return {
        originalPoints: points,
        fromVertical,
        toVertical,
        conversionRate,
        convertedValue,
        targetVertical: toVertical,
        targetMerchantId: ''
      };
    } catch (error) {
      logger.error('Error converting points:', error);
      throw error;
    }
  }

  /**
   * Redeem points across industries
   */
  async redeemCrossIndustry(
    accountId: string,
    fromVertical: string,
    toVertical: string,
    points: number,
    targetMerchantId: string
  ): Promise<any> {
    try {
      // Find the account
      const account = await UnifiedAccount.findOne({ accountId });
      if (!account) {
        throw new Error('Account not found');
      }

      // Check if user has enough points in the source vertical
      const fromVerticalData = account.verticals.find(v => v.vertical === fromVertical);
      if (!fromVerticalData || fromVerticalData.points < points) {
        throw new Error(
          `Insufficient points in ${fromVertical}. Available: ${fromVerticalData?.points || 0}, Required: ${points}`
        );
      }

      // Get conversion rate
      const conversionRate = this.getConversionRate(fromVertical, toVertical);

      // Calculate converted value
      const convertedValue = Math.floor(points * conversionRate);

      // Create redemption record
      const redemptionId = `red_${uuidv4()}`;

      const redemption = new CrossIndustryRedemptionModel({
        redemptionId,
        accountId,
        fromVertical,
        toVertical,
        points,
        convertedValue,
        targetVertical: toVertical,
        targetMerchantId,
        status: 'pending',
        createdAt: new Date()
      });

      await redemption.save();

      logger.info(
        `Cross-industry redemption created: ${redemptionId}, ${points} ${fromVertical} -> ${convertedValue} ${toVertical}`
      );

      return {
        ...redemption.toObject(),
        conversionRate
      };
    } catch (error) {
      logger.error('Error creating cross-industry redemption:', error);
      throw error;
    }
  }

  /**
   * Complete a cross-industry redemption
   */
  async completeRedemption(redemptionId: string): Promise<any> {
    try {
      const redemption = await CrossIndustryRedemptionModel.findOne({ redemptionId });
      if (!redemption) {
        throw new Error('Redemption not found');
      }

      if (redemption.status !== 'pending') {
        throw new Error('Redemption is not in pending status');
      }

      // Update account - deduct from source vertical
      const account = await UnifiedAccount.findOne({ accountId: redemption.accountId });
      if (!account) {
        throw new Error('Account not found');
      }

      // Deduct from source vertical
      const sourceVerticalIdx = account.verticals.findIndex(
        v => v.vertical === redemption.fromVertical
      );
      if (sourceVerticalIdx >= 0) {
        account.verticals[sourceVerticalIdx].points -= redemption.points;
        account.verticals[sourceVerticalIdx].lastActivity = new Date();
      }

      // Add to target vertical
      const targetVerticalIdx = account.verticals.findIndex(
        v => v.vertical === redemption.toVertical
      );
      if (targetVerticalIdx >= 0) {
        account.verticals[targetVerticalIdx].points += redemption.convertedValue;
        account.verticals[targetVerticalIdx].lastActivity = new Date();
      } else {
        account.verticals.push({
          vertical: redemption.toVertical,
          points: redemption.convertedValue,
          lastActivity: new Date(),
          transactions: 1
        });
      }

      // Update total points
      account.totalPoints = account.verticals.reduce((sum, v) => sum + v.points, 0);
      await account.save();

      // Update redemption status
      redemption.status = 'completed';
      await redemption.save();

      logger.info(`Cross-industry redemption completed: ${redemptionId}`);

      return redemption;
    } catch (error) {
      logger.error('Error completing cross-industry redemption:', error);
      throw error;
    }
  }

  /**
   * Cancel a cross-industry redemption
   */
  async cancelRedemption(redemptionId: string): Promise<any> {
    try {
      const redemption = await CrossIndustryRedemptionModel.findOne({ redemptionId });
      if (!redemption) {
        throw new Error('Redemption not found');
      }

      if (redemption.status !== 'pending') {
        throw new Error('Cannot cancel a completed redemption');
      }

      redemption.status = 'cancelled';
      await redemption.save();

      logger.info(`Cross-industry redemption cancelled: ${redemptionId}`);

      return redemption;
    } catch (error) {
      logger.error('Error cancelling cross-industry redemption:', error);
      throw error;
    }
  }

  /**
   * Get redemption history for an account
   */
  async getRedemptionHistory(accountId: string, limit: number = 50): Promise<any[]> {
    return CrossIndustryRedemptionModel.find({ accountId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get cross-industry statistics
   */
  async getCrossIndustryStats(): Promise<any> {
    const stats = await CrossIndustryRedemptionModel.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: { fromVertical: '$fromVertical', toVertical: '$toVertical' },
          totalRedemptions: { $sum: 1 },
          totalPoints: { $sum: '$points' },
          totalConverted: { $sum: '$convertedValue' },
          avgConversionRate: { $avg: { $divide: ['$convertedValue', '$points'] } }
        }
      },
      { $sort: { totalRedemptions: -1 } }
    ]);

    return stats;
  }

  /**
   * Update conversion rate for a vertical pair
   */
  async updateConversionRate(fromVertical: string, toVertical: string, rate: number): Promise<void> {
    if (!VERTICAL_CONVERSION_RATES[fromVertical]) {
      VERTICAL_CONVERSION_RATES[fromVertical] = {};
    }
    VERTICAL_CONVERSION_RATES[fromVertical][toVertical] = rate;
    logger.info(`Updated conversion rate: ${fromVertical} -> ${toVertical} = ${rate}`);
  }
}

export const crossIndustryService = new CrossIndustryService();

export default crossIndustryService;