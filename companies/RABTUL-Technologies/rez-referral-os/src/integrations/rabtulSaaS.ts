/**
 * RABTUL SaaS Integration for REZ Referral OS
 * Connects Referral System with RABTUL SaaS Products
 */

import axios, { AxiosInstance } from 'axios';
import { validateEnv } from '../config/env';
import { logger } from '../utils/logger';

// SaaS Service URLs
const SAAS_SERVICES = {
  restaurant: process.env.RESTAURANT_OS_URL || 'http://localhost:4010',
  salon: process.env.SALON_OS_URL || 'http://localhost:4011',
  hotel: process.env.HOTEL_OS_URL || 'http://localhost:4012',
  fitness: process.env.FITNESS_OS_URL || 'http://localhost:4013',
  retail: process.env.RETAIL_OS_URL || 'http://localhost:4014',
  healthcare: process.env.HEALTHCARE_OS_URL || 'http://localhost:4015',
};

export type SaaSVertical = keyof typeof SAAS_SERVICES;

interface SaaSResponse {
  activityId?: string;
  merchant?: {
    id: string;
    name: string;
    vertical: SaaSVertical;
    referralEnabled: boolean;
    referralCode?: string;
  };
  campaignId?: string;
  stats?: {
    totalReferrals: number;
    activeReferrals: number;
    totalRewards: number;
    conversionRate: number;
  };
  transactionId?: string;
}

interface SaaSClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, data: unknown): Promise<T>;
  patch<T>(path: string, data: unknown): Promise<T>;
}

function createSaaSClient(baseURL: string): SaaSClient {
  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const env = validateEnv();
    config.headers['X-Internal-Token'] = env.INTERNAL_SERVICE_TOKEN || '';
    config.headers['X-Internal-Service'] = 'rez-referral-os';
    return config;
  });

  return {
    async get<T>(path: string): Promise<T> {
      const response = await client.get<{ data: T }>(path);
      return response.data.data;
    },
    async post<T>(path: string, data: unknown): Promise<T> {
      const response = await client.post<{ data: T }>(path, data);
      return response.data.data;
    },
    async patch<T>(path: string, data: unknown): Promise<T> {
      const response = await client.patch<{ data: T }>(path, data);
      return response.data.data;
    },
  };
}

export class RABTULSaaSIntegration {
  private clients: Record<SaaSVertical, SaaSClient>;
  private static instance: RABTULSaaSIntegration;

  private constructor() {
    this.clients = {
      restaurant: createSaaSClient(SAAS_SERVICES.restaurant),
      salon: createSaaSClient(SAAS_SERVICES.salon),
      hotel: createSaaSClient(SAAS_SERVICES.hotel),
      fitness: createSaaSClient(SAAS_SERVICES.fitness),
      retail: createSaaSClient(SAAS_SERVICES.retail),
      healthcare: createSaaSClient(SAAS_SERVICES.healthcare),
    };
  }

  static getInstance(): RABTULSaaSIntegration {
    if (!RABTULSaaSIntegration.instance) {
      RABTULSaaSIntegration.instance = new RABTULSaaSIntegration();
    }
    return RABTULSaaSIntegration.instance;
  }

  /**
   * Track referral activity for a SaaS vertical
   */
  async trackSaaSReferral(params: {
    vertical: SaaSVertical;
    merchantId: string;
    customerId: string;
    referralCode: string;
    action: 'signup' | 'first_order' | 'subscription' | 'membership';
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; activityId?: string }> {
    try {
      const client = this.clients[params.vertical];
      const response = await client.post<SaaSResponse>('/api/referral/track', {
        merchantId: params.merchantId,
        customerId: params.customerId,
        referralCode: params.referralCode,
        action: params.action,
        source: 'referral-os',
        metadata: params.metadata,
      });

      logger.info('[RABTUL SaaS] Referral tracked:', {
        vertical: params.vertical,
        action: params.action,
        merchantId: params.merchantId,
      });

      return { success: true, activityId: response.activityId };
    } catch (error) {
      logger.error('[RABTUL SaaS] Track referral failed:', {
        vertical: params.vertical,
        error: (error as Error).message,
      });
      return { success: false };
    }
  }

  /**
   * Get merchant info from SaaS
   */
  async getMerchantInfo(vertical: SaaSVertical, merchantId: string): Promise<{
    success: boolean;
    merchant?: SaaSResponse['merchant'];
  }> {
    try {
      const client = this.clients[vertical];
      const response = await client.get<SaaSResponse>(`/api/merchants/${merchantId}`);

      return {
        success: true,
        merchant: response.merchant,
      };
    } catch (error) {
      logger.error('[RABTUL SaaS] Get merchant failed:', {
        vertical,
        merchantId,
        error: (error as Error).message,
      });
      return { success: false };
    }
  }

  /**
   * Award loyalty points for referral
   */
  async awardLoyaltyPoints(params: {
    vertical: SaaSVertical;
    customerId: string;
    merchantId: string;
    points: number;
    source: 'referral_signup' | 'referral_order' | 'referral_subscription';
  }): Promise<{ success: boolean; transactionId?: string }> {
    try {
      const client = this.clients[params.vertical];
      const response = await client.post<SaaSResponse>('/api/loyalty/points/award', {
        customerId: params.customerId,
        merchantId: params.merchantId,
        points: params.points,
        source: params.source,
        sourceService: 'referral-os',
      });

      logger.info('[RABTUL SaaS] Loyalty points awarded:', {
        vertical: params.vertical,
        customerId: params.customerId,
        points: params.points,
      });

      return { success: true, transactionId: response.transactionId };
    } catch (error) {
      logger.error('[RABTUL SaaS] Award loyalty failed:', {
        vertical: params.vertical,
        error: (error as Error).message,
      });
      return { success: false };
    }
  }

  /**
   * Create referral campaign in SaaS
   */
  async createSaaSCampaign(params: {
    vertical: SaaSVertical;
    merchantId: string;
    campaign: {
      name: string;
      referrerReward: { type: string; value: number };
      refereeReward?: { type: string; value: number };
      startDate: string;
      endDate?: string;
    };
  }): Promise<{ success: boolean; campaignId?: string }> {
    try {
      const client = this.clients[params.vertical];
      const response = await client.post<SaaSResponse>('/api/referral/campaigns', {
        ...params.campaign,
        merchantId: params.merchantId,
        source: 'referral-os',
      });

      logger.info('[RABTUL SaaS] Campaign created:', {
        vertical: params.vertical,
        campaignId: response.campaignId,
      });

      return { success: true, campaignId: response.campaignId };
    } catch (error) {
      logger.error('[RABTUL SaaS] Create campaign failed:', {
        vertical: params.vertical,
        error: (error as Error).message,
      });
      return { success: false };
    }
  }

  /**
   * Get referral stats from SaaS
   */
  async getSaaSReferralStats(vertical: SaaSVertical, merchantId: string): Promise<{
    success: boolean;
    stats?: SaaSResponse['stats'];
  }> {
    try {
      const client = this.clients[vertical];
      const response = await client.get<SaaSResponse>(`/api/referral/stats/${merchantId}`);

      return {
        success: true,
        stats: response.stats,
      };
    } catch (error) {
      logger.error('[RABTUL SaaS] Get stats failed:', {
        vertical,
        error: (error as Error).message,
      });
      return { success: false };
    }
  }

  /**
   * Sync referral data across SaaS verticals
   */
  async syncReferralData(params: {
    userId: string;
    verticals: SaaSVertical[];
  }): Promise<{ success: boolean; synced: Record<SaaSVertical, boolean> }> {
    const results: Record<SaaSVertical, boolean> = {} as Record<SaaSVertical, boolean>;

    for (const vertical of params.verticals) {
      try {
        const client = this.clients[vertical];
        await client.post('/api/referral/sync', {
          userId: params.userId,
          source: 'referral-os',
        });
        results[vertical] = true;
      } catch {
        results[vertical] = false;
      }
    }

    return { success: true, synced: results };
  }
}

// Singleton export
export const rabtulSaaS = RABTULSaaSIntegration.getInstance();
