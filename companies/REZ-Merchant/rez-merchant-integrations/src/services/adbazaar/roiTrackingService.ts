import logger from './utils/logger';

import axios from 'axios';
import mongoose from 'mongoose';

// Extend global to include attribution store
declare global {
  var attributionStore: Map<string, unknown> | undefined;
}

const ADBAZAAR_DB_URL = process.env.ADBAZAAR_DB_URL || 'postgresql://localhost:5432/adbazaar';
const MERCHANT_SERVICE_URL = process.env.MERCHANT_SERVICE_URL || 'https://rez-merchant-service.onrender.com';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'https://rez-order-service.onrender.com';

interface AdAttribution {
  campaignId: string;
  merchantId: string;
  userId: string;
  deviceId: string;
  type: 'click' | 'view';
  timestamp: Date;
}

interface Conversion {
  orderId: string;
  merchantId: string;
  userId: string;
  amount: number;
  timestamp: Date;
}

export class AdROITrackingService {
  // Track ad click
  async trackClick(params: {
    campaignId: string;
    merchantId: string;
    userId?: string;
    deviceId: string;
  }): Promise<void> {
    try {
      // Store click attribution
      const attribution: AdAttribution = {
        campaignId: params.campaignId,
        merchantId: params.merchantId,
        userId: params.userId || 'anonymous',
        deviceId: params.deviceId,
        type: 'click' as const,
        timestamp: new Date()
      };

      // Store in Redis for fast lookup (7-day window)
      await this.storeAttribution(params.deviceId, attribution, 7 * 24 * 60 * 60);

      // Also record in analytics
      await this.recordAttributionEvent(attribution);

      logger.info(`Ad click tracked: ${params.campaignId}`);
    } catch (error) {
      console.error('Failed to track click', error);
    }
  }

  // Track ad view (view-through attribution)
  async trackView(params: {
    campaignId: string;
    merchantId: string;
    userId?: string;
    deviceId: string;
  }): Promise<void> {
    try {
      const attribution: AdAttribution = {
        campaignId: params.campaignId,
        merchantId: params.merchantId,
        userId: params.userId || 'anonymous',
        deviceId: params.deviceId,
        type: 'view' as const,
        timestamp: new Date()
      };

      // Store for 24 hours (view-through attribution window)
      await this.storeAttribution(params.deviceId, attribution, 24 * 60 * 60);

      await this.recordAttributionEvent(attribution);

      logger.info(`Ad view tracked: ${params.campaignId}`);
    } catch (error) {
      console.error('Failed to track view', error);
    }
  }

  // Track conversion (order completed)
  async trackConversion(params: {
    orderId: string;
    merchantId: string;
    userId: string;
    deviceId?: string;
    amount: number;
  }): Promise<{
    attributed: boolean;
    campaignId?: string;
    attributionType?: string;
    revenue?: number;
  }> {
    try {
      // Try click-through attribution first (7 days)
      let attribution = await this.findAttribution(params.deviceId || params.userId, 7 * 24 * 60 * 60);

      // If no click attribution, try view-through (24 hours)
      if (!attribution) {
        attribution = await this.findAttribution(params.deviceId || params.userId, 24 * 60 * 60);
        if (attribution) {
          attribution.type = 'view';
        }
      }

      if (!attribution) {
        return { attributed: false };
      }

      // Get campaign details for ROI calculation
      const campaign = await this.getCampaignDetails(attribution.campaignId);

      // Update campaign metrics
      await this.updateCampaignMetrics(attribution.campaignId, {
        conversions: 1,
        conversionValue: params.amount,
        orderId: params.orderId
      });

      // Update merchant ad performance
      await this.updateMerchantAdPerformance(attribution.merchantId, {
        campaignId: attribution.campaignId,
        conversions: 1,
        revenue: params.amount,
        campaignSpend: campaign?.budget || 0
      });

      // Clear attribution after conversion
      await this.clearAttribution(params.deviceId || params.userId);

      logger.info(`Conversion attributed: ${attribution.campaignId}`);

      return {
        attributed: true,
        campaignId: attribution.campaignId,
        attributionType: attribution.type,
        revenue: params.amount
      };
    } catch (error) {
      console.error('Failed to track conversion', error);
      return { attributed: false };
    }
  }

  // Get campaign ROI metrics
  async getCampaignROI(campaignId: string): Promise<{
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
    ctr: number;
    conversionRate: number;
    cpa: number;
    roas: number;
  }> {
    try {
      const metrics = await this.fetchCampaignMetrics(campaignId);

      const ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
      const conversionRate = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0;
      const cpa = metrics.conversions > 0 ? metrics.spend / metrics.conversions : 0;
      const roas = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0;

      return {
        ...metrics,
        ctr: Math.round(ctr * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        cpa: Math.round(cpa * 100) / 100,
        roas: Math.round(roas * 100) / 100
      };
    } catch (error) {
      console.error('Failed to get campaign ROI', error);
      return {
        impressions: 0, clicks: 0, conversions: 0,
        spend: 0, revenue: 0, ctr: 0, conversionRate: 0, cpa: 0, roas: 0
      };
    }
  }

  // Get merchant's aggregated ad performance
  async getMerchantAdPerformance(merchantId: string): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalSpend: number;
    totalConversions: number;
    totalRevenue: number;
    avgROAS: number;
    topCampaign: {
      id: string;
      name: string;
      roas: number;
    } | null;
    recentOrders: Array<{
      orderId: string;
      amount: number;
      campaignId: string;
      timestamp: Date;
    }>;
  }> {
    try {
      // Fetch from merchant service
      const response = await axios.get(`${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}/ad-stats`);
      return response.data;
    } catch {
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalSpend: 0,
        totalConversions: 0,
        totalRevenue: 0,
        avgROAS: 0,
        topCampaign: null,
        recentOrders: []
      };
    }
  }

  // Sync campaign data with AdBazaar
  async syncCampaigns(): Promise<void> {
    try {
      // Fetch campaigns from AdBazaar
      const response = await axios.get(`${process.env.ADBAZAAR_API_URL || 'https://rez-adbazaar-service.onrender.com'}/api/campaigns`, {
        params: { status: 'active' }
      });

      const campaigns = response.data.campaigns || [];

      for (const campaign of campaigns) {
        await this.updateCampaignFromAdBazaar(campaign);
      }

      logger.info(`Synced ${campaigns.length} campaigns from AdBazaar`);
    } catch (error) {
      console.error('Failed to sync campaigns', error);
    }
  }

  private async storeAttribution(
    key: string,
    attribution: AdAttribution,
    ttlSeconds: number
  ): Promise<void> {
    // In production, use Redis
    // For now, store in memory
    if (!global.attributionStore) {
      global.attributionStore = new Map();
    }
    const store = global.attributionStore;

    store.set(`attr_${key}`, {
      ...attribution,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  private async findAttribution(key: string, windowSeconds: number): Promise<AdAttribution | null> {
    const store = global.attributionStore;
    if (!store) return null;

    const entry = store.get(`attr_${key}`);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      store.delete(`attr_${key}`);
      return null;
    }

    return {
      campaignId: entry.campaignId,
      merchantId: entry.merchantId,
      userId: entry.userId,
      deviceId: entry.deviceId,
      type: entry.type,
      timestamp: entry.timestamp
    };
  }

  private async clearAttribution(key: string): Promise<void> {
    const store = global.attributionStore;
    if (store) {
      store.delete(`attr_${key}`);
    }
  }

  private async recordAttributionEvent(attribution: AdAttribution): Promise<void> {
    // In production, record to analytics database
    console.log('Attribution event:', attribution);
  }

  private async getCampaignDetails(campaignId: string): Promise<unknown> {
    try {
      const response = await axios.get(`${process.env.ADBAZAAR_API_URL}/api/campaigns/${campaignId}`);
      return response.data;
    } catch {
      return { budget: 0, cpc: 0, cpm: 0 };
    }
  }

  private async updateCampaignMetrics(campaignId: string, metrics: {
    conversions?: number;
    conversionValue?: number;
    orderId?: string;
  }): Promise<void> {
    // Update AdBazaar campaign metrics
    try {
      await axios.post(`${process.env.ADBAZAAR_API_URL}/api/campaigns/${campaignId}/metrics`, metrics);
    } catch (error) {
      console.error('Failed to update campaign metrics', error);
    }

    // Also notify merchant service
    try {
      await axios.post(`${MERCHANT_SERVICE_URL}/api/merchants/campaign-metrics`, {
        campaignId,
        ...metrics
      });
    } catch (error) {
      console.error('Failed to notify merchant service', error);
    }
  }

  private async updateMerchantAdPerformance(merchantId: string, data: {
    campaignId: string;
    conversions: number;
    revenue: number;
    campaignSpend: number;
  }): Promise<void> {
    try {
      await axios.post(`${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}/ad-performance`, data);
    } catch (error) {
      console.error('Failed to update merchant ad performance', error);
    }
  }

  private async fetchCampaignMetrics(campaignId: string): Promise<{
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
  }> {
    try {
      const response = await axios.get(`${process.env.ADBAZAAR_API_URL}/api/campaigns/${campaignId}/metrics`);
      return response.data;
    } catch {
      return { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 };
    }
  }

  private async updateCampaignFromAdBazaar(campaign): Promise<void> {
    // Sync campaign data to merchant service
    try {
      await axios.post(`${MERCHANT_SERVICE_URL}/api/merchants/${campaign.merchantId}/campaign-sync`, {
        campaignId: campaign.id,
        status: campaign.status,
        budget: campaign.budget,
        spent: campaign.spent
      });
    } catch (error) {
      console.error('Failed to sync campaign', error);
    }
  }
}

export const adROITrackingService = new AdROITrackingService();
