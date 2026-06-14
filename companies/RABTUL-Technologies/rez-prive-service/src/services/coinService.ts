/**
 * Prive Coin Service
 * Manages Prive coin credits and redemptions
 */

import axios from 'axios';
import eligibilityService from './eligibilityService';
import { PriveTier, CoinBonusResult, TIER_CONFIG } from '../types';
import { logger } from '../config/logger';

const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service-36vo.onrender.com';

class PriveCoinService {
  /**
   * Get user's Prive coin balance
   */
  async getBalance(userId: string): Promise<{ balance: number; tier: PriveTier } | null> {
    try {
      const eligibility = await eligibilityService.getEligibility(userId);
      const tier = eligibility.tier;

      // Get balance from wallet service
      const response = await axios.get(`${WALLET_SERVICE_URL}/wallet/coins/${userId}`, {
        params: { coinType: 'prive' },
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN },
      });

      return {
        balance: response.data?.balance || 0,
        tier,
      };
    } catch (error) {
      logger.error('Failed to get Prive balance', { userId, error });
      return null;
    }
  }

  /**
   * Calculate bonus coins based on tier and order amount
   */
  calculateBonus(tier: PriveTier, orderAmount: number): CoinBonusResult {
    const tierConfig = TIER_CONFIG.find(t => t.id === tier);
    const bonusPercent = tierConfig?.coinMultiplier || 0;
    const bonusCoins = Math.floor(orderAmount * (bonusPercent / 100));

    const messages: Record<PriveTier, string> = {
      none: 'Not a Prive member',
      entry: `Entry tier: +${bonusPercent}% Prive coins`,
      signature: `Signature tier: +${bonusPercent}% Prive coins`,
      elite: `Elite tier: +${bonusPercent}% Prive coins`,
    };

    return {
      eligible: tier !== 'none',
      tier,
      bonusPercent,
      bonusCoins,
      message: messages[tier],
    };
  }

  /**
   * Credit Prive coins to a user
   */
  async creditCoins(
    userId: string,
    amount: number,
    source: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Calculate expiry (365 days for Prive coins)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365);

      const response = await axios.post(
        `${WALLET_SERVICE_URL}/wallet/credit`,
        {
          userId,
          amount,
          coinType: 'prive',
          source,
          description,
          expiresAt: expiresAt.toISOString(),
          metadata: {
            source: 'prive_service',
            ...metadata,
          },
        },
        {
          headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN },
        }
      );

      logger.info('Prive coins credited', { userId, amount, source });

      return {
        success: true,
        transactionId: response.data?.transactionId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to credit Prive coins', { userId, amount, error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Process booking bonus for a user
   */
  async processBookingBonus(
    buyerId: string,
    orderAmount: number,
    bookingId: string,
    creatorId?: string
  ): Promise<CoinBonusResult> {
    const eligibility = await eligibilityService.getEligibility(buyerId);

    if (!eligibility.isEligible) {
      return {
        eligible: false,
        tier: 'none',
        bonusPercent: 0,
        bonusCoins: 0,
        message: 'Not a Prive member',
      };
    }

    const bonus = this.calculateBonus(eligibility.tier, orderAmount);

    if (bonus.bonusCoins > 0) {
      await this.creditCoins(buyerId, bonus.bonusCoins, 'booking_prive_bonus',
        `Prive bonus for ₹${orderAmount} booking`,
        { bookingId, creatorId, orderAmount, tier: eligibility.tier }
      );
    }

    return bonus;
  }

  /**
   * Process creator bonus
   */
  async processCreatorBonus(
    creatorId: string,
    earningsAmount: number,
    bookingId: string
  ): Promise<CoinBonusResult> {
    const eligibility = await eligibilityService.getEligibility(creatorId);

    if (!eligibility.isEligible) {
      return {
        eligible: false,
        tier: 'none',
        bonusPercent: 0,
        bonusCoins: 0,
        message: 'Creator not a Prive member',
      };
    }

    // Creator bonus is 50% of standard bonus
    const standardBonus = this.calculateBonus(eligibility.tier, earningsAmount);
    const creatorBonus = Math.floor(standardBonus.bonusCoins * 0.5);

    if (creatorBonus > 0) {
      await this.creditCoins(creatorId, creatorBonus, 'creator_prive_bonus',
        `Creator Prive bonus for booking`,
        { bookingId, earningsAmount, tier: eligibility.tier }
      );
    }

    return {
      ...standardBonus,
      bonusCoins: creatorBonus,
      message: `Creator ${eligibility.tier} tier: +${creatorBonus} Prive coins`,
    };
  }

  /**
   * Process campaign engagement reward
   */
  async processCampaignReward(
    userId: string,
    campaignId: string,
    baseReward: number,
    action: 'view' | 'click' | 'conversion' | 'share'
  ): Promise<{ success: boolean; coinsAwarded: number; tier: PriveTier }> {
    const eligibility = await eligibilityService.getEligibility(userId);
    const tier = eligibility.tier;

    const tierConfig = TIER_CONFIG.find(t => t.id === tier);
    const multiplier = tierConfig?.coinMultiplier || 1.0;
    const coinsAwarded = Math.floor(baseReward * multiplier);

    if (coinsAwarded > 0) {
      await this.creditCoins(userId, coinsAwarded, 'campaign_reward',
        `Prive coins for ${action} on campaign ${campaignId}`,
        { campaignId, action, baseReward, tier }
      );
    }

    return { success: true, coinsAwarded, tier };
  }

  /**
   * Award monthly tier bonus
   */
  async awardMonthlyBonus(userId: string): Promise<{ awarded: boolean; amount: number; tier: PriveTier }> {
    const eligibility = await eligibilityService.getEligibility(userId);

    if (!eligibility.isEligible || eligibility.tier === 'entry') {
      return { awarded: false, amount: 0, tier: eligibility.tier };
    }

    const tierConfig = TIER_CONFIG.find(t => t.id === eligibility.tier);
    const monthlyBonus = tierConfig?.monthlyBonusCoins || 0;

    if (monthlyBonus > 0) {
      await this.creditCoins(userId, monthlyBonus, 'monthly_tier_bonus',
        `Monthly ${eligibility.tier} tier bonus`,
        { month: new Date().toISOString() }
      );
    }

    return { awarded: monthlyBonus > 0, amount: monthlyBonus, tier: eligibility.tier };
  }

  /**
   * Get coin transaction history
   */
  async getTransactions(userId: string, limit: number = 50): Promise<unknown[]> {
    try {
      const response = await axios.get(`${WALLET_SERVICE_URL}/wallet/transactions/${userId}`, {
        params: { coinType: 'prive', limit },
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN },
      });

      return response.data?.transactions || [];
    } catch (error) {
      logger.error('Failed to get transactions', { userId, error });
      return [];
    }
  }
}

export const priveCoinService = new PriveCoinService();
export default priveCoinService;
