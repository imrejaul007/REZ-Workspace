/**
 * REE Client for Wallet Service
 *
 * Connects to REE for:
 * - Coin economics
 * - Karma conversion
 * - Feature flags
 * - Fraud detection
 */

import { env } from '../config/env'
import { logger } from '../config/logger';

const REE_URL = env.REE_SERVICE_URL || 'http://localhost:4000/api'

export interface REEFeatureResult {
  canEarnRez: boolean
  canEarnBranded: boolean
  canEarnPromo: boolean
  canEarnPrive: boolean
  hasPrioritySupport: boolean
  maxSocialSharesPerDay: number
  maxCashbackPercent: number
  currentTier: string
}

export interface REECashbackResult {
  cashbackAmount: number
  socialAmount: number
  cashbackPercent: number
  tier: string
  coinType: 'rez'
}

export interface REEKarmaResult {
  karmaEarned: number
  karmaMultiplier: number
  karmaScore: number
  conversionRate: number
  tier: string
}

class REEClient {
  private timeout = 5000

  private async request<T>(
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T | null> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${REE_URL}${endpoint}`, {
        method: body ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Key': env.REE_SERVICE_KEY,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        logger.error('[REE] Request failed', { status: response.status, endpoint });
        return null
      }

      const data = await response.json() as { success?: boolean; data?: T }
      return data.success ? data.data as T : data as T
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        logger.warn('[REE] Request timeout', { endpoint });
      } else {
        logger.error('[REE] Request error', { endpoint, error: error instanceof Error ? error.message : String(error) });
      }
      return null
    }
  }

  // ============================================
  // FEATURE FLAGS
  // ============================================

  async getUserFeatures(
    lifetimeSpend: number
  ): Promise<REEFeatureResult | null> {
    return this.request('/features/user', { lifetimeSpend })
  }

  async getMerchantFeatures(tier: string): Promise<Record<string, unknown> | null> {
    return this.request('/features/merchant', { tier })
  }

  // ============================================
  // CASHBACK
  // ============================================

  async calculateCashback(
    lifetimeSpend: number,
    amount: number
  ): Promise<REECashbackResult | null> {
    return this.request('/features/cashback', { lifetimeSpend, amount })
  }

  // ============================================
  // KARMA
  // ============================================

  async getKarma(userId: string): Promise<REEKarmaResult | null> {
    return this.request('/query/karma', { userId })
  }

  async recordKarmaEvent(
    userId: string,
    eventType: string,
    data: Record<string, unknown>
  ): Promise<boolean> {
    const result = await this.request<{ success: boolean }>('/events', {
      eventType,
      source: 'wallet-service',
      userId,
      data,
    })
    return result?.success ?? false
  }

  async convertKarmaToCoins(
    userId: string,
    karmaAmount: number
  ): Promise<{ success: boolean; coinsEarned: number } | null> {
    const karma = await this.getKarma(userId)
    if (!karma) {
      return null
    }

    const karmaRate = karma.conversionRate || 20 // 20 karma = 1 coin
    const coinsEarned = Math.floor(karmaAmount / karmaRate)

    return {
      success: true,
      coinsEarned,
    }
  }

  // ============================================
  // FRAUD
  // ============================================

  async checkFraud(
    userId: string,
    action: string,
    context: Record<string, unknown>
  ): Promise<{
    isAbuse: boolean
    action: 'allow' | 'flag' | 'block'
    reasons: string[]
  }> {
    const result = await this.request<{
      isFraud: boolean
      action: string
      triggeredRules: string[]
    }>('/query/fraud', {
      context: { userId, event: { type: action }, ...context },
    })

    if (!result) {
      return { isAbuse: false, action: 'allow', reasons: [] }
    }

    return {
      isAbuse: result.isFraud,
      action: result.action as 'allow' | 'flag' | 'block',
      reasons: result.triggeredRules || [],
    }
  }

  // ============================================
  // COIN VALIDATION
  // ============================================

  async validateCoinUsage(
    userId: string,
    coinType: string,
    amount: number
  ): Promise<{
    valid: boolean
    reason?: string
    limits?: {
      maxPerTransaction: number
      dailyUsed: number
      dailyLimit: number
    }
  }> {
    // Check user features
    const features = await this.getUserFeatures(0)
    if (!features) {
      return { valid: true }
    }

    // Check if user can use this coin type
    if (coinType === 'prive' && !features.canEarnPrive) {
      return { valid: false, reason: 'Prive coins require Platinum tier' }
    }

    if (coinType === 'promo' && !features.canEarnPromo) {
      return { valid: false, reason: 'Promo coins not available for user tier' }
    }

    return { valid: true }
  }

  // ============================================
  // COMMISSION (for merchant wallet)
  // ============================================

  async getMerchantCommission(
    tier: string,
    amount: number
  ): Promise<{
    platformFee: number
    merchantReceives: number
    userCashback: number
    userSocial: number
  } | null> {
    return this.request('/features/commission', { tier, amount })
  }
}

export const reeClient = new REEClient()
export default reeClient
