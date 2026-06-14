/**
 * Tier Manager - Hybrid REZ + Prive tier management
 * Combines standard REZ tiers with Prive premium overlay
 */

import {
  TierLevel,
  PriveTier,
  PillarScore,
  HybridTierInfo,
  TierBenefits,
  TIER_BENEFITS,
  TIER_THRESHOLDS,
  PRIVE_TIER_CONFIG,
} from '../types/index.js';
import { apiClient } from '../utils/apiClient.js';
import { redis, CACHE_KEYS, CACHE_TTL } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export class TierManager {
  /**
   * Get hybrid tier info combining REZ and Prive
   */
  async getHybridTierInfo(userId: string, forceRefresh = false): Promise<HybridTierInfo> {
    // Check cache
    if (!forceRefresh) {
      const cached = await this.getCachedTier(userId);
      if (cached) {
        logger.debug(`[TierManager] Cache hit for tier ${userId}`);
        return cached;
      }
    }

    logger.info(`[TierManager] Calculating hybrid tier for ${userId}`);

    // Fetch from both services in parallel
    const [rezTier, priveTier] = await Promise.allSettled([
      this.getRezTier(userId),
      this.getPriveTier(userId),
    ]);

    // Extract results
    let rez: { tier: TierLevel; lifetimeCoins: number };
    let prive: { tier: PriveTier; score: number; pillars: PillarScore[] } | null = null;

    if (rezTier.status === 'fulfilled' && rezTier.value) {
      rez = rezTier.value;
    } else {
      // Default to Bronze
      rez = { tier: TierLevel.BRONZE, lifetimeCoins: 0 };
      logger.warn(`[TierManager] REZ tier unavailable for ${userId}, defaulting to BRONZE`);
    }

    if (priveTier.status === 'fulfilled' && priveTier.value) {
      prive = priveTier.value;
    }

    // Calculate combined multiplier
    const priveMultiplier = prive ? PRIVE_TIER_CONFIG[prive.tier].multiplier : 1.0;
    const combinedMultiplier = TIER_BENEFITS[rez.tier].earningMultiplier * priveMultiplier;

    // Calculate tier progress
    const nextTier = this.getNextRezTier(rez.tier);
    const currentThreshold = TIER_THRESHOLDS[rez.tier.toLowerCase()];
    const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier.toLowerCase()] : Infinity;
    const tierProgress = nextTier
      ? ((rez.lifetimeCoins - currentThreshold) / (nextThreshold - currentThreshold)) * 100
      : 100;
    const coinsToNextTier = nextTier ? Math.max(0, nextThreshold - rez.lifetimeCoins) : 0;

    const tierInfo: HybridTierInfo = {
      userId,
      rezTier: rez.tier,
      priveTier: prive?.tier,
      priveScore: prive?.score,
      privePillars: prive?.pillars,
      combinedMultiplier,
      benefits: TIER_BENEFITS[rez.tier],
      tierProgress: Math.min(100, Math.max(0, tierProgress)),
      coinsToNextTier,
      nextTier: nextTier ?? undefined,
    };

    // Cache the result
    await this.cacheTier(userId, tierInfo);

    return tierInfo;
  }

  /**
   * Get only REZ tier (lighter call)
   */
  async getRezTierOnly(userId: string): Promise<TierLevel> {
    try {
      const response = await apiClient.get<{ currentTier: string; lifetimeCoins: number }>(
        'unifiedLoyalty',
        `/api/loyalty/tier/${userId}`
      );
      return (response?.currentTier as TierLevel) || TierLevel.BRONZE;
    } catch {
      return TierLevel.BRONZE;
    }
  }

  /**
   * Calculate tier upgrade opportunity
   */
  async checkTierUpgrade(userId: string, additionalCoins: number): Promise<{
    willUpgrade: boolean;
    newTier?: TierLevel;
    coinsNeeded?: number;
  }> {
    const currentInfo = await this.getHybridTierInfo(userId);
    const newLifetime = currentInfo.benefits.maxCoinHolding + additionalCoins;

    // Check if adding coins would upgrade tier
    for (const tier of Object.values(TierLevel)) {
      if (tier === currentInfo.rezTier) continue;
      if (newLifetime >= TIER_THRESHOLDS[tier.toLowerCase()]) {
        return {
          willUpgrade: true,
          newTier: tier,
          coinsNeeded: TIER_THRESHOLDS[tier.toLowerCase()] - currentInfo.benefits.maxCoinHolding,
        };
      }
    }

    return { willUpgrade: false };
  }

  /**
   * Get Prive eligibility for a user
   */
  async getPriveEligibility(userId: string): Promise<{
    eligible: boolean;
    currentTier: PriveTier;
    score: number;
    pillars: PillarScore[];
    missingRequirements: string[];
  }> {
    try {
      const response = await apiClient.get<{
        eligible: boolean;
        tier: string;
        score: number;
        pillars: PillarScore[];
        missingRequirements?: string[];
      }>('prive', '/api/eligibility', { userId });

      return {
        eligible: response?.eligible ?? false,
        currentTier: (response?.tier as PriveTier) || PriveTier.NONE,
        score: response?.score || 0,
        pillars: response?.pillars || [],
        missingRequirements: response?.missingRequirements || [],
      };
    } catch (error) {
      logger.error(`[TierManager] Failed to get Prive eligibility`, { error });
      return {
        eligible: false,
        currentTier: PriveTier.NONE,
        score: 0,
        pillars: [],
        missingRequirements: ['Prive service unavailable'],
      };
    }
  }

  /**
   * Get all tier benefits comparison
   */
  getAllTierBenefits(): TierBenefits[] {
    return Object.values(TIER_BENEFITS);
  }

  /**
   * Get Prive tier config
   */
  getAllPriveTiers(): Array<{ tier: PriveTier; config: typeof PRIVE_TIER_CONFIG[PriveTier] }> {
    return Object.entries(PRIVE_TIER_CONFIG).map(([tier, config]) => ({
      tier: tier as PriveTier,
      config,
    }));
  }

  // ========== Private Methods ==========

  private async getRezTier(userId: string): Promise<{ tier: TierLevel; lifetimeCoins: number } | null> {
    try {
      const response = await apiClient.get<{
        currentTier: string;
        lifetimeCoins: number;
        currentPeriodCoins: number;
      }>('unifiedLoyalty', `/api/loyalty/tier/${userId}`);

      if (!response) return null;

      return {
        tier: (response.currentTier as TierLevel) || this.calculateRezTier(response.lifetimeCoins),
        lifetimeCoins: response.lifetimeCoins || 0,
      };
    } catch (error) {
      logger.error(`[TierManager] Failed to get REZ tier`, { error });
      return null;
    }
  }

  private async getPriveTier(userId: string): Promise<{ tier: PriveTier; score: number; pillars: PillarScore[] } | null> {
    try {
      const response = await apiClient.get<{
        tier: string;
        totalScore: number;
        pillars: PillarScore[];
      }>('prive', '/api/eligibility/pillars', { userId });

      if (!response) return null;

      return {
        tier: (response.tier as PriveTier) || PriveTier.NONE,
        score: response.totalScore || 0,
        pillars: response.pillars || [],
      };
    } catch (error) {
      logger.error(`[TierManager] Failed to get Prive tier`, { error });
      return null;
    }
  }

  /**
   * Calculate REZ tier based on lifetime coins
   */
  private calculateRezTier(lifetimeCoins: number): TierLevel {
    if (lifetimeCoins >= TIER_THRESHOLDS.platinum) return TierLevel.PLATINUM;
    if (lifetimeCoins >= TIER_THRESHOLDS.gold) return TierLevel.GOLD;
    if (lifetimeCoins >= TIER_THRESHOLDS.silver) return TierLevel.SILVER;
    return TierLevel.BRONZE;
  }

  /**
   * Get next REZ tier
   */
  private getNextRezTier(current: TierLevel): TierLevel | null {
    const order = [TierLevel.BRONZE, TierLevel.SILVER, TierLevel.GOLD, TierLevel.PLATINUM];
    const currentIndex = order.indexOf(current);
    return currentIndex < order.length - 1 ? order[currentIndex + 1] : null;
  }

  // ========== Cache Methods ==========

  private async getCachedTier(userId: string): Promise<HybridTierInfo | null> {
    try {
      const cached = await redis.get(CACHE_KEYS.TIER(userId));
      if (cached) {
        return JSON.parse(cached) as HybridTierInfo;
      }
    } catch (error) {
      logger.warn(`[TierManager] Cache read failed for ${userId}`, { error });
    }
    return null;
  }

  private async cacheTier(userId: string, tierInfo: HybridTierInfo): Promise<void> {
    try {
      await redis.setex(
        CACHE_KEYS.TIER(userId),
        CACHE_TTL.TIER,
        JSON.stringify(tierInfo)
      );
    } catch (error) {
      logger.warn(`[TierManager] Cache write failed for ${userId}`, { error });
    }
  }

  async invalidateCache(userId: string): Promise<void> {
    try {
      await redis.del(CACHE_KEYS.TIER(userId));
    } catch (error) {
      logger.warn(`[TierManager] Cache invalidation failed for ${userId}`, { error });
    }
  }
}
