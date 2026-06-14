/**
 * REZ Prive Integration for Referral OS
 * Awards Prive eligibility points for referrals
 *
 * Prive Service: http://localhost:4070
 */

import axios, { AxiosInstance } from 'axios';
import { validateEnv } from '../config/env';
import { logger } from '../utils/logger';

export interface PriveEligibility {
  tier: 'entry' | 'signature' | 'elite';
  eligibilityScore: number;
  pillars: {
    engagement: number;
    trust: number;
    influence: number;
    economic: number;
    brandAffinity: number;
    network: number;
  };
}

export interface SignalResult {
  success: boolean;
  newScore?: number;
  pillars?: PriveEligibility['pillars'];
}

export class PriveIntegration {
  private client: AxiosInstance;
  private static instance: PriveIntegration;

  private constructor() {
    this.client = axios.create({
      baseURL: process.env.PRIVE_SERVICE_URL || 'http://localhost:4070',
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const env = validateEnv();
      config.headers['X-Internal-Token'] = env.INTERNAL_SERVICE_TOKEN || '';
      config.headers['X-Internal-Service'] = 'rez-referral-os';
      return config;
    });
  }

  static getInstance(): PriveIntegration {
    if (!PriveIntegration.instance) {
      PriveIntegration.instance = new PriveIntegration();
    }
    return PriveIntegration.instance;
  }

  /**
   * Get user Prive eligibility
   */
  async getEligibility(userId: string): Promise<{ success: boolean; eligibility?: PriveEligibility }> {
    try {
      const response = await this.client.get<{ data: PriveEligibility }>(`/api/eligibility/${userId}`);
      return { success: true, eligibility: response.data.data };
    } catch (error) {
      logger.error('[Prive] Get eligibility failed:', { userId, error: (error as Error).message });
      return { success: false };
    }
  }

  /**
   * Record engagement signal from referral
   */
  async recordEngagementSignal(params: {
    userId: string;
    signalType: 'referral_sent' | 'referral_completed' | 'referral_rewards_earned' | 'creator_qr_shared';
    value?: number;
  }): Promise<SignalResult> {
    try {
      const response = await this.client.post<{ data: { newScore: number; pillars: PriveEligibility['pillars'] } }>(
        '/api/engagement/signal',
        {
          userId: params.userId,
          signalType: params.signalType,
          value: params.value,
          source: 'referral-os',
          metadata: {
            service: 'rez-referral-os',
            timestamp: new Date().toISOString(),
          },
        }
      );

      logger.info('[Prive] Engagement signal recorded:', {
        userId: params.userId,
        signalType: params.signalType,
      });

      return {
        success: true,
        newScore: response.data.data.newScore,
        pillars: response.data.data.pillars,
      };
    } catch (error) {
      logger.error('[Prive] Record signal failed:', {
        userId: params.userId,
        error: (error as Error).message,
      });
      return { success: false };
    }
  }

  /**
   * Award Prive coins for referral
   */
  async creditPriveCoins(params: {
    userId: string;
    amount: number;
    reason: string;
  }): Promise<{ success: boolean; transactionId?: string }> {
    try {
      const response = await this.client.post<{ data: { transactionId: string } }>('/api/coins/credit', {
        userId: params.userId,
        amount: params.amount,
        reason: params.reason,
        source: 'referral-os',
      });

      logger.info('[Prive] Coins credited:', {
        userId: params.userId,
        amount: params.amount,
      });

      return { success: true, transactionId: response.data.data.transactionId };
    } catch (error) {
      logger.error('[Prive] Credit coins failed:', {
        userId: params.userId,
        error: (error as Error).message,
      });
      return { success: false };
    }
  }

  /**
   * Get unified score for referral boost
   */
  async getUnifiedScore(userId: string): Promise<{ success: boolean; score?: number }> {
    try {
      const response = await this.client.get<{ data: { score: number } }>(`/api/ecosystem/unified-score/${userId}`);
      return { success: true, score: response.data.data.score };
    } catch (error) {
      logger.error('[Prive] Get unified score failed:', { userId, error: (error as Error).message });
      return { success: false };
    }
  }

  /**
   * Calculate Prive bonus on referral rewards
   * Higher Prive tier = higher bonus multiplier
   */
  calculatePriveBonus(baseAmount: number, tier: PriveEligibility['tier']): number {
    const multipliers: Record<PriveEligibility['tier'], number> = {
      entry: 1.0,
      signature: 1.1,
      elite: 1.25,
    };
    return Math.floor(baseAmount * multipliers[tier]);
  }
}

// Singleton export
export const priveIntegration = PriveIntegration.getInstance();
