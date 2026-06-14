import logger from './utils/logger';

/**
 * REE Client for Profile Service
 *
 * Connects Profile Service to REE for:
 * - Feature flags
 * - Coin economics
 * - Subscription tiers
 * - Karma scores
 */

import config from '../config';

// Types for REE responses
export interface REEUserFeatures {
  canEarnRez: boolean;
  canEarnBranded: boolean;
  canEarnPromo: boolean;
  canEarnPrive: boolean;
  canConvertKarma: boolean;
  hasPrioritySupport: boolean;
  hasEarlyAccess: boolean;
  hasExclusiveEvents: boolean;
  hasVipKarmaEvents: boolean;
  maxSocialSharesPerDay: number;
  maxCashbackPercent: number;
  maxReferralsPerMonth: number;
  currentTier: string;
}

export interface REECashbackResult {
  cashbackPercent: number;
  cashbackAmount: number;
  socialAmount: number;
  coinType: string;
  tier: string;
}

export interface REEKarmaResult {
  karmaEarned: number;
  karmaMultiplier: number;
  karmaScore: number;
  tier: string;
  conversionRate: number;
}

export interface REEFeatureResult {
  has: boolean;
  currentTier: string;
  requiredTier?: string;
}

export interface REEUserTier {
  name: string;
  minSpend: number;
  benefits: REEUserFeatures;
}

export interface REEUserTiersResponse {
  data: REEUserTier[];
}

// REE API response wrapper
interface REEResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// REE API Client
class REEClient {
  private baseUrl: string;
  private timeout = 5000; // 5 second timeout

  constructor() {
    this.baseUrl = config.REE_SERVICE_URL;
  }

  private async request<T>(
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
        method: body ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Key': process.env.REE_SERVICE_KEY,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.error(`[REE] Request failed: ${response.status}`);
        return null;
      }

      const json = await response.json() as REEResponse<T>;
      return json.success ? json.data : null;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error(`[REE] Request timeout: ${endpoint}`);
      } else {
        console.error(`[REE] Request error:`, error);
      }
      return null;
    }
  }

  // ============================================
  // USER FEATURES
  // ============================================

  /**
   * Get user feature flags
   */
  async getUserFeatures(
    lifetimeSpend: number
  ): Promise<REEUserFeatures | null> {
    return this.request<REEUserFeatures>(
      '/features/user',
      { lifetimeSpend }
    );
  }

  /**
   * Check if user has specific feature
   */
  async checkUserFeature(
    lifetimeSpend: number,
    feature: string
  ): Promise<REEFeatureResult | null> {
    return this.request<REEFeatureResult>(
      '/features/user',
      { lifetimeSpend, features: [feature] }
    );
  }

  /**
   * Calculate cashback for user
   */
  async calculateCashback(
    lifetimeSpend: number,
    amount: number
  ): Promise<REECashbackResult | null> {
    return this.request<REECashbackResult>(
      '/features/cashback',
      { lifetimeSpend, amount }
    );
  }

  // ============================================
  // KARMA
  // ============================================

  /**
   * Get karma info for user
   */
  async getKarmaInfo(userId: string): Promise<{
    karmaScore: number;
    tier: string;
    karmaEarned: number;
  } | null> {
    return this.request('/query/karma', { userId });
  }

  /**
   * Record karma event
   */
  async recordKarmaEvent(
    userId: string,
    eventType: string,
    data: Record<string, unknown>
  ): Promise<boolean> {
    const result = await this.request<{ success: boolean }>('/events', {
      eventType,
      source: 'profile-service',
      userId,
      data,
    });
    return result?.success ?? false;
  }

  // ============================================
  // FRAUD CHECKS
  // ============================================

  /**
   * Check if action is allowed (fraud check)
   */
  async checkFraud(
    userId: string,
    action: string,
    context: Record<string, unknown>
  ): Promise<{
    isAbuse: boolean;
    action: 'allow' | 'flag' | 'challenge' | 'block';
  }> {
    const result = await this.request<{
      isFraud: boolean;
      action: string;
    }>('/query/fraud', {
      context: { userId, event: { type: action }, ...context },
    });

    if (!result) {
      return { isAbuse: false, action: 'allow' };
    }

    return {
      isAbuse: result.isFraud,
      action: result.action as 'allow' | 'flag' | 'challenge' | 'block',
    };
  }

  // ============================================
  // SUBSCRIPTION TIERS
  // ============================================

  /**
   * Get user tier based on spend
   */
  async getUserTier(
    lifetimeSpend: number
  ): Promise<REEUserTier | null> {
    return this.request<REEUserTier>('/features/tier/user/' + lifetimeSpend);
  }

  /**
   * Get all user tiers
   */
  async getAllUserTiers(): Promise<REEUserTier[]> {
    const result = await this.request<REEUserTiersResponse>('/features/tiers/user');
    return result?.data || [];
  }

  // ============================================
  // MERCHANT TIERS & FEATURES
  // ============================================

  /**
   * Get merchant tier based on tier name
   */
  async getMerchantTier(tier: string): Promise<{
    tier: string;
    commissionRate: number;
    features: Record<string, boolean>;
  } | null> {
    return this.request('/features/tier/merchant/' + tier);
  }

  /**
   * Get all merchant tiers
   */
  async getAllMerchantTiers(): Promise<Array<{
    name: string;
    commissionRate: number;
    minVolume: number;
    features: Record<string, boolean>;
  }>> {
    const result = await this.request<{ data: Array<{
      name: string;
      commissionRate: number;
      minVolume: number;
      features: Record<string, boolean>;
    }> }>('/features/tiers/merchant');
    return result?.data || [];
  }

  /**
   * Get merchant features by tier
   */
  async getMerchantFeatures(tier: string): Promise<Record<string, boolean> | null> {
    const tierData = await this.getMerchantTier(tier);
    return tierData?.features || null;
  }

  /**
   * Calculate merchant commission
   */
  async getMerchantCommission(
    tier: string,
    amount: number
  ): Promise<{
    commissionAmount: number;
    netAmount: number;
    commissionPercent: number;
  } | null> {
    return this.request('/features/commission', { tier, amount });
  }

  // ============================================
  // SOCIAL SHARING
  // ============================================

  /**
   * Check if user can share on social media
   */
  async canSocialShare(
    lifetimeSpend: number,
    platform: string
  ): Promise<{
    canShare: boolean;
    reason?: string;
    remainingToday: number;
  }> {
    // First check if platform is valid
    const validPlatforms = ['twitter', 'facebook', 'instagram', 'whatsapp'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return {
        canShare: false,
        reason: `Invalid platform: ${platform}`,
        remainingToday: 0,
      };
    }

    // Check features
    const features = await this.getUserFeatures(lifetimeSpend);
    if (!features) {
      return { canShare: false, reason: 'Could not check features', remainingToday: 0 };
    }

    const maxShares = features.maxSocialSharesPerDay;
    if (maxShares === 0) {
      return {
        canShare: false,
        reason: 'Social sharing not enabled for your tier',
        remainingToday: 0,
      };
    }

    // Check fraud
    const fraud = await this.checkFraud('anonymous', 'social_share', { platform });
    if (fraud.action === 'block') {
      return {
        canShare: false,
        reason: 'Action blocked due to rate limiting',
        remainingToday: 0,
      };
    }

    return {
      canShare: true,
      remainingToday: maxShares,
    };
  }

  // ============================================
  // CASHBACK PREVIEW
  // ============================================

  /**
   * Preview cashback for transaction
   */
  async previewCashback(
    lifetimeSpend: number,
    transactionAmount: number
  ): Promise<{
    coinType: string;
    cashbackPercent: number;
    cashbackAmount: number;
    socialAmount: number;
    tier: string;
    totalEarnings: number;
  } | null> {
    const result = await this.calculateCashback(lifetimeSpend, transactionAmount);
    if (!result) return null;

    return {
      ...result,
      totalEarnings: result.cashbackAmount + result.socialAmount,
    };
  }
}

// Singleton instance
export const reeClient = new REEClient();

export default reeClient;
