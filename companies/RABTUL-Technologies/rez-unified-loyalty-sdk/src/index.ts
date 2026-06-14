import logger from './utils/logger';

/**
 * REZ Unified Loyalty SDK
 * Single SDK for all loyalty features across the REZ ecosystem
 *
 * Usage:
 * import { REZLoyalty } from 'rez-unified-loyalty-sdk';
 *
 * const loyalty = new REZLoyalty({ baseUrl: 'https://api.rez.money' });
 *
 * // Get user balance
 * const balance = await loyalty.getBalance('user_123');
 *
 * // Earn points
 * await loyalty.earn({ userId: 'user_123', amount: 100, source: 'purchase' });
 *
 * // Redeem
 * await loyalty.redeem({ userId: 'user_123', amount: 50, reward: 'discount' });
 */

import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

// ============================================
// TYPES & SCHEMAS
// ============================================

// Coin Types
export enum CoinType {
  REZ = 'REZ',
  PROMO = 'PROMO',
  BRANDED = 'BRANDED',
  PRIVE = 'PRIVE'
}

// Tier Levels
export enum TierLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

// Transaction Types
export enum TransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  BONUS = 'BONUS'
}

// Source Applications
export enum CoinSource {
  RABTUL_WALLET = 'RABTUL_WALLET',
  REZ_MEDIA = 'REZ_MEDIA',
  REZ_NOW = 'REZ_NOW',
  REZ_APP = 'REZ_APP',
  DOOH = 'DOOH',
  KARMA = 'KARMA'
}

// Reward Categories
export enum RewardCategory {
  DISCOUNT = 'DISCOUNT',
  FREE_ITEM = 'FREE_ITEM',
  CASHBACK = 'CASHBACK',
  EXPERIENCE = 'EXPERIENCE'
}

// Response Schemas
const BalanceResponseSchema = z.object({
  userId: z.string(),
  balances: z.array(z.object({
    coinType: z.string(),
    available: z.number(),
    locked: z.number(),
    lifetimeEarned: z.number(),
    lifetimeRedeemed: z.number()
  })),
  totalValueUSD: z.number()
});

const TransactionResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  coinType: z.string(),
  amount: z.number(),
  type: z.string(),
  source: z.string(),
  description: z.string(),
  createdAt: z.string()
});

const TierResponseSchema = z.object({
  userId: z.string(),
  currentTier: z.string(),
  lifetimeCoins: z.number(),
  tierProgress: z.number(),
  nextTier: z.string().optional(),
  coinsToNextTier: z.number(),
  benefits: z.object({
    earningMultiplier: z.number(),
    redemptionMultiplier: z.number(),
    birthdayBonus: z.number(),
    anniversaryBonus: z.number()
  })
});

// Type exports
export type BalanceResponse = z.infer<typeof BalanceResponseSchema>;
export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;
export type TierResponse = z.infer<typeof TierResponseSchema>;

export interface EarnOptions {
  userId: string;
  amount: number;
  coinType?: CoinType;
  source: CoinSource;
  description?: string;
  referenceId?: string;
}

export interface RedeemOptions {
  userId: string;
  amount: number;
  coinType?: CoinType;
  rewardId?: string;
  description?: string;
}

export interface TransferOptions {
  fromUserId: string;
  toUserId: string;
  amount: number;
  coinType?: CoinType;
  description?: string;
}

export interface LeaderboardOptions {
  limit?: number;
  coinType?: CoinType;
  period?: 'all' | 'monthly' | 'weekly';
}

// ============================================
// MAIN SDK CLASS
// ============================================

export class REZLoyalty {
  private client: AxiosInstance;

  constructor(options: { baseUrl: string; apiKey?: string }) {
    this.client = axios.create({
      baseURL: options.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(options.apiKey && { 'X-API-Key': options.apiKey })
      }
    });
  }

  // ============================================
  // BALANCE
  // ============================================

  /**
   * Get user's complete balance across all coin types
   */
  async getBalance(userId: string): Promise<BalanceResponse> {
    const response = await this.client.get(`/api/v1/balance/${userId}`);
    return BalanceResponseSchema.parse(response.data);
  }

  /**
   * Get balance for specific coin type
   */
  async getCoinBalance(
    userId: string,
    coinType: CoinType
  ): Promise<BalanceResponse['balances'][0]> {
    const balance = await this.getBalance(userId);
    const coinBalance = balance.balances.find(b => b.coinType === coinType);
    if (!coinBalance) {
      throw new Error(`No balance found for coin type: ${coinType}`);
    }
    return coinBalance;
  }

  // ============================================
  // EARN
  // ============================================

  /**
   * Earn points/coins
   */
  async earn(options: EarnOptions): Promise<TransactionResponse> {
    const response = await this.client.post('/api/v1/earn', {
      userId: options.userId,
      amount: options.amount,
      coinType: options.coinType || CoinType.REZ,
      source: options.source,
      description: options.description || `${options.source} reward`,
      referenceId: options.referenceId
    });
    return TransactionResponseSchema.parse(response.data);
  }

  /**
   * Earn from purchase
   */
  async earnFromPurchase(userId: string, amount: number): Promise<TransactionResponse> {
    return this.earn({
      userId,
      amount,
      source: CoinSource.REZ_APP,
      description: `Purchase reward: ₹${amount}`
    });
  }

  /**
   * Earn from engagement
   */
  async earnFromEngagement(
    userId: string,
    amount: number,
    engagementType: string
  ): Promise<TransactionResponse> {
    return this.earn({
      userId,
      amount,
      source: CoinSource.REZ_MEDIA,
      description: `${engagementType} engagement reward`
    });
  }

  /**
   * Earn from Karma (social impact)
   */
  async earnFromKarma(
    userId: string,
    amount: number,
    action: string
  ): Promise<TransactionResponse> {
    return this.earn({
      userId,
      amount,
      source: CoinSource.KARMA,
      description: `Karma ${action} reward`
    });
  }

  // ============================================
  // REDEEM
  // ============================================

  /**
   * Redeem points/coins
   */
  async redeem(options: RedeemOptions): Promise<TransactionResponse> {
    const response = await this.client.post('/api/v1/redeem', {
      userId: options.userId,
      amount: options.amount,
      coinType: options.coinType || CoinType.REZ,
      rewardId: options.rewardId,
      description: options.description || 'Redemption'
    });
    return TransactionResponseSchema.parse(response.data);
  }

  /**
   * Redeem for discount
   */
  async redeemForDiscount(
    userId: string,
    amount: number,
    discountCode: string
  ): Promise<TransactionResponse> {
    return this.redeem({
      userId,
      amount,
      coinType: CoinType.REZ,
      rewardId: discountCode,
      description: `Discount code: ${discountCode}`
    });
  }

  // ============================================
  // TRANSFER
  // ============================================

  /**
   * Transfer between users
   */
  async transfer(options: TransferOptions): Promise<{
    from: TransactionResponse;
    to: TransactionResponse;
    bonus?: number;
  }> {
    const response = await this.client.post('/api/v1/transfer', {
      fromUserId: options.fromUserId,
      toUserId: options.toUserId,
      amount: options.amount,
      coinType: options.coinType || CoinType.REZ,
      description: options.description || 'Transfer'
    });
    return response.data;
  }

  // ============================================
  // TIER
  // ============================================

  /**
   * Get user's tier information
   */
  async getTier(userId: string): Promise<TierResponse> {
    const response = await this.client.get(`/api/v1/tier/${userId}`);
    return TierResponseSchema.parse(response.data);
  }

  /**
   * Get tier benefits
   */
  async getTierBenefits(tier: TierLevel): Promise<TierResponse['benefits']> {
    const response = await this.client.get(`/api/v1/tier/benefits/${tier}`);
    return response.data;
  }

  // ============================================
  // TRANSACTIONS
  // ============================================

  /**
   * Get transaction history
   */
  async getTransactions(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      coinType?: CoinType;
    }
  ): Promise<{ transactions: TransactionResponse[]; total: number }> {
    const response = await this.client.get(`/api/v1/transactions/${userId}`, {
      params: options
    });
    return response.data;
  }

  // ============================================
  // LEADERBOARD
  // ============================================

  /**
   * Get leaderboard
   */
  async getLeaderboard(options?: LeaderboardOptions): Promise<Array<{
    rank: number;
    userId: string;
    balance: number;
    tier: string;
  }>> {
    const response = await this.client.get('/api/v1/leaderboard', {
      params: options
    });
    return response.data.leaderboard;
  }

  // ============================================
  // REWARDS
  // ============================================

  /**
   * Get available rewards
   */
  async getRewards(options?: {
    category?: RewardCategory;
    minCoins?: number;
    maxCoins?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    coinCost: number;
    category: string;
  }>> {
    const response = await this.client.get('/api/v1/rewards', {
      params: options
    });
    return response.data.rewards;
  }

  // ============================================
  // UTILITY
  // ============================================

  /**
   * Health check
   */
  async health(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default REZLoyalty;

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Create SDK instance with default configuration
 */
export function createLoyaltySDK(apiKey?: string): REZLoyalty {
  return new REZLoyalty({
    baseUrl: process.env.LOYALTY_API_URL || 'https://loyalty.rez.money',
    apiKey
  });
}

// Example usage
/*
import { REZLoyalty, CoinType, CoinSource, TierLevel } from 'rez-unified-loyalty-sdk';

// Initialize
const loyalty = new REZLoyalty({
  baseUrl: 'https://loyalty.rez.money',
  apiKey: 'your-api-key'
});

// Get balance
const balance = await loyalty.getBalance('user_123');
logger.info(`REZ Coins: ${balance.balances.find(b => b.coinType === 'REZ')?.available}`);

// Earn from purchase
await loyalty.earnFromPurchase('user_123', 100);

// Earn from engagement
await loyalty.earnFromEngagement('user_123', 50, 'review');

// Earn from Karma
await loyalty.earnFromKarma('user_123', 25, 'checkin');

// Get tier
const tier = await loyalty.getTier('user_123');
logger.info(`Current tier: ${tier.currentTier}`);
logger.info(`Progress: ${tier.tierProgress}%`);
logger.info(`Coins to next tier: ${tier.coinsToNextTier}`);

// Redeem
await loyalty.redeemForDiscount('user_123', 100, 'SAVE10');

// Transfer
await loyalty.transfer({
  fromUserId: 'user_123',
  toUserId: 'user_456',
  amount: 50,
  description: 'Gift for birthday'
});

// Leaderboard
const leaderboard = await loyalty.getLeaderboard({ limit: 10 });
*/


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-unified-loyalty-sdk',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
