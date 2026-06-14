/**
 * Balance Aggregator - Aggregates balances from all loyalty services
 * Provides unified balance view for consumers
 */

import {
  CoinType,
  TierLevel,
  PriveTier,
  PillarScore,
  UnifiedBalance,
  CoinBalance,
  REZBalance,
  BrandedBalance,
  PriveBalance,
  TIER_THRESHOLDS,
  PRIVE_TIER_CONFIG,
} from '../types/index.js';
import { apiClient } from '../utils/apiClient.js';
import { redis, CACHE_KEYS, CACHE_TTL } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export class BalanceAggregator {
  /**
   * Get unified balance for a user from all services
   */
  async getUnifiedBalance(userId: string, forceRefresh = false): Promise<UnifiedBalance> {
    // Check cache first
    if (!forceRefresh) {
      const cached = await this.getCachedBalance(userId);
      if (cached) {
        logger.debug(`[BalanceAggregator] Cache hit for ${userId}`);
        return cached;
      }
    }

    logger.info(`[BalanceAggregator] Fetching unified balance for ${userId}`);

    // Fetch from all services in parallel
    const results = await Promise.allSettled([
      this.getWalletBalance(userId),
      this.getUnifiedLoyaltyBalance(userId),
      this.getRestaurantLoyaltyBalance(userId),
      this.getPriveBalance(userId),
      this.getReferralOSBalance(userId),
      this.getCashbackBalance(userId),
    ]);

    // Extract results with service names
    const [
      walletResult,
      unifiedLoyaltyResult,
      restaurantLoyaltyResult,
      priveResult,
      referralResult,
      cashbackResult,
    ] = results;

    // Build unified balance
    const unified: UnifiedBalance = {
      userId,
      balances: {
        REZ: this.defaultREZBalance(),
        PROMO: this.defaultCoinBalance(),
        BRANDED: this.defaultBrandedBalance(),
        PRIVE: this.defaultPriveBalance(),
        CASHBACK: this.defaultCoinBalance(),
        REFERRAL: this.defaultCoinBalance(),
      },
      totalValueUSD: 0,
      conversionRate: 1.0,
      lastSyncedAt: new Date(),
      syncStatus: 'synced',
    };

    // Merge results
    let partialCount = 0;

    if (walletResult.status === 'fulfilled' && walletResult.value) {
      unified.balances.REZ = walletResult.value.rez;
      unified.balances.PROMO = walletResult.value.promo;
      unified.totalValueUSD += walletResult.value.totalValueUSD || 0;
      unified.conversionRate = walletResult.value.conversionRate || 1.0;
    } else {
      partialCount++;
      logger.warn(`[BalanceAggregator] Wallet balance unavailable for ${userId}`);
    }

    if (restaurantLoyaltyResult.status === 'fulfilled' && restaurantLoyaltyResult.value) {
      unified.balances.BRANDED = restaurantLoyaltyResult.value;
    } else {
      partialCount++;
      logger.warn(`[BalanceAggregator] Restaurant loyalty balance unavailable for ${userId}`);
    }

    if (priveResult.status === 'fulfilled' && priveResult.value) {
      unified.balances.PRIVE = priveResult.value;
    } else {
      partialCount++;
      logger.warn(`[BalanceAggregator] Prive balance unavailable for ${userId}`);
    }

    if (referralResult.status === 'fulfilled' && referralResult.value) {
      unified.balances.REFERRAL = referralResult.value;
    } else {
      partialCount++;
      logger.warn(`[BalanceAggregator] Referral OS balance unavailable for ${userId}`);
    }

    if (cashbackResult.status === 'fulfilled' && cashbackResult.value) {
      unified.balances.CASHBACK = cashbackResult.value;
    } else {
      partialCount++;
      logger.warn(`[BalanceAggregator] Cashback balance unavailable for ${userId}`);
    }

    // Determine sync status
    if (partialCount > 0) {
      unified.syncStatus = partialCount >= 3 ? 'stale' : 'partial';
    }

    // Cache the result
    await this.cacheBalance(userId, unified);

    return unified;
  }

  /**
   * Get specific coin type balance
   */
  async getCoinTypeBalance(userId: string, coinType: CoinType): Promise<CoinBalance | null> {
    const unified = await this.getUnifiedBalance(userId);
    return unified.balances[coinType] || null;
  }

  /**
   * Get total spendable balance (all coin types combined)
   */
  async getTotalBalance(userId: string): Promise<number> {
    const unified = await this.getUnifiedBalance(userId);
    let total = 0;

    for (const coinType of Object.keys(unified.balances) as CoinType[]) {
      const balance = unified.balances[coinType];
      if ('available' in balance) {
        total += balance.available;
      }
    }

    return total;
  }

  // ========== Service Fetchers ==========

  private async getWalletBalance(userId: string): Promise<{ rez: REZBalance; promo: CoinBalance; totalValueUSD: number; conversionRate: number } | null> {
    try {
      const response = await apiClient.get<{
        balance: {
          available: number;
          locked: number;
          total: number;
        };
        coins: Array<{
          coinType: string;
          available: number;
          locked: number;
          lifetime: number;
          expired: number;
        }>;
        totalValueUSD?: number;
        conversionRate?: number;
      }>('wallet', '/api/wallet/balance', { userId });

      if (!response) return null;

      const rezCoin = response.coins?.find(c => c.coinType === 'rez');
      const promoCoin = response.coins?.find(c => c.coinType === 'promo');

      return {
        rez: {
          available: rezCoin?.available || response.balance?.available || 0,
          locked: rezCoin?.locked || response.balance?.locked || 0,
          expired: rezCoin?.expired || 0,
          lifetimeEarned: rezCoin?.lifetime || 0,
          lifetimeRedeemed: 0,
          totalValueUSD: response.totalValueUSD || 0,
          conversionRate: response.conversionRate || 1.0,
        },
        promo: {
          available: promoCoin?.available || 0,
          locked: promoCoin?.locked || 0,
          expired: promoCoin?.expired || 0,
          lifetimeEarned: promoCoin?.lifetime || 0,
          lifetimeRedeemed: 0,
        },
        totalValueUSD: response.totalValueUSD || 0,
        conversionRate: response.conversionRate || 1.0,
      };
    } catch (error) {
      logger.error(`[BalanceAggregator] Failed to fetch wallet balance`, { error });
      return null;
    }
  }

  private async getUnifiedLoyaltyBalance(userId: string): Promise<CoinBalance | null> {
    try {
      const response = await apiClient.get<{
        balances: Array<{
          coinType: string;
          available: number;
          locked: number;
          lifetimeEarned: number;
          lifetimeRedeemed: number;
        }>;
      }>('unifiedLoyalty', `/api/loyalty/balance/${userId}`);

      if (!response?.balances) return null;

      // Aggregate all coin types
      let totalAvailable = 0;
      let totalLocked = 0;

      for (const b of response.balances) {
        totalAvailable += b.available || 0;
        totalLocked += b.locked || 0;
      }

      return {
        available: totalAvailable,
        locked: totalLocked,
        expired: 0,
        lifetimeEarned: response.balances.reduce((sum, b) => sum + (b.lifetimeEarned || 0), 0),
        lifetimeRedeemed: response.balances.reduce((sum, b) => sum + (b.lifetimeRedeemed || 0), 0),
      };
    } catch (error) {
      logger.error(`[BalanceAggregator] Failed to fetch unified loyalty balance`, { error });
      return null;
    }
  }

  private async getRestaurantLoyaltyBalance(userId: string): Promise<BrandedBalance | null> {
    try {
      const response = await apiClient.get<{
        totalPoints: number;
        byMerchant: Record<string, number>;
        locked: number;
      }>('restaurantLoyalty', `/api/loyalty/balance/${userId}`);

      if (!response) return null;

      return {
        available: response.totalPoints || 0,
        locked: response.locked || 0,
        expired: 0,
        lifetimeEarned: response.totalPoints || 0,
        lifetimeRedeemed: 0,
        byMerchant: response.byMerchant || {},
      };
    } catch (error) {
      logger.error(`[BalanceAggregator] Failed to fetch restaurant loyalty balance`, { error });
      return null;
    }
  }

  private async getPriveBalance(userId: string): Promise<PriveBalance | null> {
    try {
      const response = await apiClient.get<{
        balance: number;
        score: number;
        tier: string;
        pillars: PillarScore[];
      }>('prive', '/api/coins/balance', { userId });

      if (!response) return null;

      return {
        available: response.balance || 0,
        locked: 0,
        expired: 0,
        lifetimeEarned: response.balance || 0,
        lifetimeRedeemed: 0,
        score: response.score || 0,
        tier: (response.tier as PriveTier) || PriveTier.NONE,
        pillars: response.pillars || [],
      };
    } catch (error) {
      logger.error(`[BalanceAggregator] Failed to fetch prive balance`, { error });
      return null;
    }
  }

  private async getReferralOSBalance(userId: string): Promise<CoinBalance | null> {
    try {
      const response = await apiClient.get<{
        balance: number;
        lifetimeEarned: number;
      }>('referralOS', `/api/referral/balance/${userId}`);

      if (!response) return null;

      return {
        available: response.balance || 0,
        locked: 0,
        expired: 0,
        lifetimeEarned: response.lifetimeEarned || 0,
        lifetimeRedeemed: 0,
      };
    } catch (error) {
      logger.error(`[BalanceAggregator] Failed to fetch referral OS balance`, { error });
      return null;
    }
  }

  private async getCashbackBalance(userId: string): Promise<CoinBalance | null> {
    try {
      const response = await apiClient.get<{
        available: number;
        lifetimeEarned: number;
      }>('cashbackService', `/api/cashback/balance/${userId}`);

      if (!response) return null;

      return {
        available: response.available || 0,
        locked: 0,
        expired: 0,
        lifetimeEarned: response.lifetimeEarned || 0,
        lifetimeRedeemed: 0,
      };
    } catch (error) {
      logger.error(`[BalanceAggregator] Failed to fetch cashback balance`, { error });
      return null;
    }
  }

  // ========== Cache Methods ==========

  private async getCachedBalance(userId: string): Promise<UnifiedBalance | null> {
    try {
      const cached = await redis.get(CACHE_KEYS.BALANCE(userId));
      if (cached) {
        return JSON.parse(cached) as UnifiedBalance;
      }
    } catch (error) {
      logger.warn(`[BalanceAggregator] Cache read failed for ${userId}`, { error });
    }
    return null;
  }

  private async cacheBalance(userId: string, balance: UnifiedBalance): Promise<void> {
    try {
      await redis.setex(
        CACHE_KEYS.BALANCE(userId),
        CACHE_TTL.BALANCE,
        JSON.stringify(balance)
      );
    } catch (error) {
      logger.warn(`[BalanceAggregator] Cache write failed for ${userId}`, { error });
    }
  }

  async invalidateCache(userId: string): Promise<void> {
    try {
      await redis.del(CACHE_KEYS.BALANCE(userId));
    } catch (error) {
      logger.warn(`[BalanceAggregator] Cache invalidation failed for ${userId}`, { error });
    }
  }

  // ========== Default Values ==========

  private defaultREZBalance(): REZBalance {
    return {
      available: 0,
      locked: 0,
      expired: 0,
      lifetimeEarned: 0,
      lifetimeRedeemed: 0,
      totalValueUSD: 0,
      conversionRate: 1.0,
    };
  }

  private defaultCoinBalance(): CoinBalance {
    return {
      available: 0,
      locked: 0,
      expired: 0,
      lifetimeEarned: 0,
      lifetimeRedeemed: 0,
    };
  }

  private defaultBrandedBalance(): BrandedBalance {
    return {
      available: 0,
      locked: 0,
      expired: 0,
      lifetimeEarned: 0,
      lifetimeRedeemed: 0,
      byMerchant: {},
    };
  }

  private defaultPriveBalance(): PriveBalance {
    return {
      available: 0,
      locked: 0,
      expired: 0,
      lifetimeEarned: 0,
      lifetimeRedeemed: 0,
      score: 0,
      tier: PriveTier.NONE,
      pillars: [],
    };
  }
}