import { SegmentPurchase, MarketplaceCampaign } from '../models/index.js';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis.js';
import { logger } from '../config/logger.js';
import type { DeliveryMetrics, ISegmentPurchase, IMarketplaceCampaign } from '../types.js';

const METRICS_CACHE_TTL = 60; // 1 minute

export interface PerformanceMetrics {
  campaignId: string;
  segmentId: string;
  period: {
    start: Date;
    end: Date;
  };
  delivery: DeliveryMetrics;
  efficiency: {
    cpm: number;
    cpc: number;
    cpa: number;
    roas: number;
  };
  trends: {
    impressionsTrend: number;
    conversionsTrend: number;
    roiTrend: number;
  };
}

export class DeliveryTrackingService {
  /**
   * Get purchase delivery metrics
   */
  async getPurchaseMetrics(purchaseId: string): Promise<DeliveryMetrics | null> {
    const cacheKey = `metrics:purchase:${purchaseId}`;
    const cached = await cacheGet<DeliveryMetrics>(cacheKey);
    if (cached) return cached;

    const purchase = await SegmentPurchase.findOne({ purchaseId }).lean();
    if (!purchase) return null;

    const metrics = purchase.deliveryMetrics || this.getEmptyMetrics();
    await cacheSet(cacheKey, metrics, METRICS_CACHE_TTL);

    return metrics;
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignPerformance(campaignId: string): Promise<PerformanceMetrics | null> {
    const cacheKey = `metrics:campaign:${campaignId}`;
    const cached = await cacheGet<PerformanceMetrics>(cacheKey);
    if (cached) return cached;

    const campaign = await MarketplaceCampaign.findOne({ campaignId }).lean();
    if (!campaign) return null;

    const delivery = campaign.deliveryMetrics || this.getEmptyMetrics();
    const efficiency = this.calculateEfficiency(delivery, campaign.totalSpent);
    const trends = await this.calculateTrends(campaignId);

    const metrics: PerformanceMetrics = {
      campaignId,
      segmentId: campaign.segments[0]?.segmentId || '',
      period: {
        start: campaign.startDate,
        end: campaign.endDate,
      },
      delivery,
      efficiency,
      trends,
    };

    await cacheSet(cacheKey, metrics, METRICS_CACHE_TTL);
    return metrics;
  }

  /**
   * Update delivery metrics for a purchase
   */
  async updatePurchaseMetrics(
    purchaseId: string,
    updates: Partial<DeliveryMetrics>
  ): Promise<DeliveryMetrics | null> {
    const purchase = await SegmentPurchase.findOne({ purchaseId });
    if (!purchase) return null;

    const currentMetrics = purchase.deliveryMetrics || this.getEmptyMetrics();
    const newMetrics: DeliveryMetrics = {
      ...currentMetrics,
      impressions: currentMetrics.impressions + (updates.impressions || 0),
      uniqueUsersReached: Math.max(
        currentMetrics.uniqueUsersReached,
        updates.uniqueUsersReached || currentMetrics.uniqueUsersReached
      ),
      ctr: updates.ctr ?? currentMetrics.ctr,
      conversions: currentMetrics.conversions + (updates.conversions || 0),
      attributedRevenue: currentMetrics.attributedRevenue + (updates.attributedRevenue || 0),
      roi: updates.roi ?? currentMetrics.roi,
    };

    // Recalculate ROI if we have conversions
    if (newMetrics.conversions > 0 && purchase.totalCost > 0) {
      newMetrics.roi = (newMetrics.attributedRevenue - purchase.totalCost) / purchase.totalCost;
    }

    purchase.deliveryMetrics = newMetrics;
    await purchase.save();

    await cacheDelete(`metrics:purchase:${purchaseId}`);
    logger.info('Purchase metrics updated', { purchaseId, metrics: newMetrics });

    return newMetrics;
  }

  /**
   * Update campaign metrics
   */
  async updateCampaignMetrics(
    campaignId: string,
    updates: {
      impressions?: number;
      conversions?: number;
      revenue?: number;
      spent?: number;
    }
  ): Promise<IMarketplaceCampaign | null> {
    const campaign = await MarketplaceCampaign.findOne({ campaignId });
    if (!campaign) return null;

    const currentMetrics = campaign.deliveryMetrics || this.getEmptyMetrics();

    // Update delivery metrics
    currentMetrics.impressions += updates.impressions || 0;
    currentMetrics.conversions += updates.conversions || 0;
    currentMetrics.attributedRevenue += updates.revenue || 0;

    // Update spending
    campaign.totalSpent += updates.spent || 0;

    // Recalculate derived metrics
    if (currentMetrics.impressions > 0) {
      currentMetrics.ctr = (currentMetrics.conversions / currentMetrics.impressions) * 100;
    }
    if (campaign.totalSpent > 0) {
      currentMetrics.roi = (currentMetrics.attributedRevenue - campaign.totalSpent) / campaign.totalSpent;
    }

    campaign.deliveryMetrics = currentMetrics;
    await campaign.save();

    await cacheDelete(`metrics:campaign:${campaignId}`);
    logger.info('Campaign metrics updated', { campaignId, spent: campaign.totalSpent });

    return campaign.toObject();
  }

  /**
   * Get advertiser's aggregate metrics
   */
  async getAdvertiserMetrics(
    advertiserId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      campaignIds?: string[];
    } = {}
  ): Promise<{
    totalSpent: number;
    totalImpressions: number;
    totalConversions: number;
    totalRevenue: number;
    avgROI: number;
    activeCampaigns: number;
  }> {
    const { startDate, endDate, campaignIds } = options;

    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.$gte = startDate;
    if (endDate) dateFilter.$lte = endDate;

    const campaignFilter: Record<string, unknown> = { advertiserId };
    if (Object.keys(dateFilter).length > 0) {
      campaignFilter.startDate = dateFilter;
    }
    if (campaignIds && campaignIds.length > 0) {
      campaignFilter.campaignId = { $in: campaignIds };
    }

    const campaigns = await MarketplaceCampaign.find(campaignFilter).lean();

    const totals = campaigns.reduce(
      (acc, campaign) => {
        const metrics = campaign.deliveryMetrics || this.getEmptyMetrics();
        acc.totalSpent += campaign.totalSpent;
        acc.totalImpressions += metrics.impressions;
        acc.totalConversions += metrics.conversions;
        acc.totalRevenue += metrics.attributedRevenue;
        if (metrics.roi !== 0) {
          acc.roiSum += metrics.roi;
          acc.roiCount += 1;
        }
        return acc;
      },
      { totalSpent: 0, totalImpressions: 0, totalConversions: 0, totalRevenue: 0, roiSum: 0, roiCount: 0 }
    );

    return {
      totalSpent: Math.round(totals.totalSpent * 100) / 100,
      totalImpressions: totals.totalImpressions,
      totalConversions: totals.totalConversions,
      totalRevenue: Math.round(totals.totalRevenue * 100) / 100,
      avgROI: totals.roiCount > 0 ? Math.round((totals.roiSum / totals.roiCount) * 100) / 100 : 0,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
    };
  }

  /**
   * Get segment performance analytics
   */
  async getSegmentAnalytics(segmentId: string): Promise<{
    segmentId: string;
    totalPurchases: number;
    totalSpent: number;
    avgDeliveryRate: number;
    avgConversionRate: number;
    avgROI: number;
    topPerformingCampaigns: Array<{
      campaignId: string;
      roi: number;
      conversions: number;
    }>;
  }> {
    const purchases = await SegmentPurchase.find({ segmentId, status: 'active' }).lean();

    let totalSpent = 0;
    let totalDeliveryRate = 0;
    let totalConversionRate = 0;
    let totalROI = 0;
    const campaignROIs: Map<string, { roi: number; conversions: number }> = new Map();

    for (const purchase of purchases) {
      totalSpent += purchase.totalCost;

      // Simulate delivery/conversion rates from historical data
      const deliveryRate = purchase.deliveryMetrics
        ? (purchase.deliveryMetrics.uniqueUsersReached / purchase.userCount) * 100
        : 85;
      const conversionRate = purchase.deliveryMetrics?.conversions
        ? (purchase.deliveryMetrics.conversions / purchase.userCount) * 100
        : 5;
      const roi = purchase.deliveryMetrics?.roi || 2.0;

      totalDeliveryRate += deliveryRate;
      totalConversionRate += conversionRate;
      totalROI += roi;

      // Track by campaign
      if (purchase.campaignId) {
        const existing = campaignROIs.get(purchase.campaignId) || { roi: 0, conversions: 0 };
        existing.roi = Math.max(existing.roi, roi);
        existing.conversions += purchase.deliveryMetrics?.conversions || 0;
        campaignROIs.set(purchase.campaignId, existing);
      }
    }

    const count = purchases.length || 1;

    return {
      segmentId,
      totalPurchases: purchases.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      avgDeliveryRate: Math.round((totalDeliveryRate / count) * 100) / 100,
      avgConversionRate: Math.round((totalConversionRate / count) * 100) / 100,
      avgROI: Math.round((totalROI / count) * 100) / 100,
      topPerformingCampaigns: Array.from(campaignROIs.entries())
        .map(([campaignId, data]) => ({ campaignId, ...data }))
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 5),
    };
  }

  /**
   * Get delivery forecast
   */
  async getDeliveryForecast(
    purchaseId: string,
    targetDate: Date
  ): Promise<{
    purchaseId: string;
    targetDate: Date;
    projectedImpressions: number;
    projectedConversions: number;
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
  } | null> {
    const purchase = await SegmentPurchase.findOne({ purchaseId }).lean();
    if (!purchase) return null;

    const elapsed = Date.now() - purchase.startDate.getTime();
    const total = purchase.endDate.getTime() - purchase.startDate.getTime();
    const progress = Math.min(elapsed / total, 1);

    const metrics = purchase.deliveryMetrics || this.getEmptyMetrics();

    // Project based on current progress
    const projectedImpressions = Math.round(metrics.impressions / progress);
    const projectedConversions = Math.round(metrics.conversions / progress);

    // Confidence decreases as we approach end date
    const confidence = Math.max(0.5, 1 - progress * 0.5);

    // Risk based on delivery vs expected
    const deliveryRate = progress > 0 ? metrics.uniqueUsersReached / purchase.userCount / progress : 0;
    const riskLevel = deliveryRate > 0.8 ? 'low' : deliveryRate > 0.5 ? 'medium' : 'high';

    return {
      purchaseId,
      targetDate,
      projectedImpressions,
      projectedConversions,
      confidence: Math.round(confidence * 100) / 100,
      riskLevel,
    };
  }

  /**
   * Calculate efficiency metrics
   */
  private calculateEfficiency(delivery: DeliveryMetrics, spent: number): PerformanceMetrics['efficiency'] {
    const cpm = delivery.impressions > 0 ? (spent / delivery.impressions) * 1000 : 0;
    const cpc = delivery.conversions > 0 ? spent / delivery.conversions : 0;
    const cpa = delivery.conversions > 0 ? spent / delivery.conversions : 0;
    const roas = spent > 0 ? delivery.attributedRevenue / spent : 0;

    return {
      cpm: Math.round(cpm * 100) / 100,
      cpc: Math.round(cpc * 100) / 100,
      cpa: Math.round(cpa * 100) / 100,
      roas: Math.round(roas * 100) / 100,
    };
  }

  /**
   * Calculate trends (mock implementation)
   */
  private async calculateTrends(campaignId: string): Promise<PerformanceMetrics['trends']> {
    // In production, this would compare current vs previous period
    return {
      impressionsTrend: Math.round((Math.random() * 20 - 5) * 100) / 100,
      conversionsTrend: Math.round((Math.random() * 25 - 5) * 100) / 100,
      roiTrend: Math.round((Math.random() * 30 - 10) * 100) / 100,
    };
  }

  /**
   * Get empty metrics object
   */
  private getEmptyMetrics(): DeliveryMetrics {
    return {
      impressions: 0,
      uniqueUsersReached: 0,
      ctr: 0,
      conversions: 0,
      attributedRevenue: 0,
      roi: 0,
    };
  }
}

export const deliveryTrackingService = new DeliveryTrackingService();