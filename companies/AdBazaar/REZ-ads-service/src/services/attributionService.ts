import mongoose, { Types } from 'mongoose';
import AdCampaign from '../models/AdCampaign';
import AdInteraction from '../models/AdInteraction';
import { logger } from '../config/logger';
import { orderServiceClient } from './orderServiceClient';

const ATTRIBUTION_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Lean document types for type-safe access
interface AdCampaignLeanDoc {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  merchantId?: Types.ObjectId;
  impressions: number;
  clicks: number;
  totalSpent: number;
  title: string;
}

interface AttributionResult {
  impressions: number;
  clicks: number;
  conversions: number;
  totalSpent: number;
  revenueGenerated: number;
  revenueSource: 'estimated' | 'actual';
  roi: number;
  ctr: number;
  conversionRate: number;
  isEstimated: boolean;
}

class AttributionService {
  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 5000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Link an order to a campaign by finding the most recent click from the user
   * within the last 24 hours
   */
  async attributeOrderToCampaign(
    orderId: string,
    userId: string,
    storeId: string,
  ): Promise<{ success: boolean; campaignId?: string; message: string }> {
    try {
      if (!orderId || !userId || !storeId) {
        return { success: false, message: 'orderId, userId, and storeId are required' };
      }

      const now = new Date();
      const windowStart = new Date(now.getTime() - ATTRIBUTION_WINDOW);

      // Find the most recent click by this user for this store's campaign within 24h
      const recentClick = await AdInteraction.findOne({
        userId,
        type: 'click',
        isFraud: false,
        createdAt: { $gte: windowStart, $lte: now },
      })
        .populate<{ campaignId: typeof AdCampaign }>('campaignId')
        .sort({ createdAt: -1 })
        .lean();

      if (!recentClick) {
        return { success: false, message: 'No recent ad click found within attribution window' };
      }

      const campaign = recentClick.campaignId as unknown as AdCampaignLeanDoc;
      if (!campaign || campaign.storeId.toString() !== storeId.toString()) {
        return { success: false, message: 'Recent click is not for this store' };
      }

      // Create or update conversion record
      await AdInteraction.findOneAndUpdate(
        { orderId },
        {
          campaignId: campaign._id,
          userId,
          type: 'conversion',
          orderId,
          isFraud: false,
          createdAt: now,
          updatedAt: now,
        },
        { upsert: true, new: true },
      );

      return {
        success: true,
        campaignId: campaign._id.toString(),
        message: `Order ${orderId} attributed to campaign ${campaign._id}`,
      };
    } catch (error) {
      logger.error('[AttributionService] attributeOrderToCampaign error:', error);
      return { success: false, message: 'Failed to attribute order to campaign' };
    }
  }

  /**
   * Get ROI metrics for a campaign
   */
  async getCampaignROI(campaignId: string): Promise<AttributionResult | null> {
    try {
      if (!Types.ObjectId.isValid(campaignId)) {
        return null;
      }

      const campaign = await AdCampaign.findById(campaignId).lean();
      if (!campaign) {
        return null;
      }

      // Get interaction stats
      const interactions = await AdInteraction.aggregate([
        {
          $match: {
            campaignId: new Types.ObjectId(campaignId),
            isFraud: false,
          },
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ]);

      const stats: Record<string, number> = {
        impression: 0,
        click: 0,
        conversion: 0,
      };

      for (const row of interactions) {
        stats[row._id] = row.count;
      }

      const impressions = campaign.impressions;
      const clicks = campaign.clicks;
      const conversions = stats.conversion;
      const totalSpent = campaign.totalSpent;
      const merchantId = campaign.merchantId?.toString();

      // Configuration for revenue calculation
      const useEstimatedRevenue = process.env.REPORTING_USE_ESTIMATED_REVENUE !== 'false';
      const estimatedAverageOrderValue = parseFloat(process.env.AVERAGE_ORDER_VALUE || '50');

      let revenueGenerated: number;
      let revenueSource: 'estimated' | 'actual' = 'estimated';

      // INTEGRATE_WITH_ORDERS_SERVICE: Fetch actual revenue from order service when available
      // Falls back to estimated revenue if order service is unavailable or not configured
      if (useEstimatedRevenue) {
        // Use estimated revenue based on conversion count and average order value
        // WARNING: This is an estimate and may not reflect actual merchant revenue
        revenueGenerated = conversions * estimatedAverageOrderValue;
        logger.debug('[AttributionService] Using estimated revenue', {
          conversions,
          avgOrderValue: estimatedAverageOrderValue,
          estimatedRevenue: revenueGenerated
        });
      } else {
        // Fetch actual revenue from order service
        // The order service provides real revenue data based on completed orders
        try {
          const orderRevenue = await orderServiceClient.getCampaignRevenue(campaignId, merchantId);

          if (orderRevenue && orderRevenue.totalRevenue > 0) {
            // Use actual revenue from order service
            // For campaign attribution, we use the merchant's total revenue
            // A more sophisticated approach would filter orders attributed to this campaign
            revenueGenerated = orderRevenue.totalRevenue;
            revenueSource = 'actual';
            logger.info('[AttributionService] Using actual revenue from order service', {
              campaignId,
              merchantId,
              totalRevenue: revenueGenerated,
              orderCount: orderRevenue.orderCount,
              avgOrderValue: orderRevenue.avgOrderValue
            });
          } else {
            // Order service returned no data, fall back to estimated
            revenueGenerated = conversions * estimatedAverageOrderValue;
            logger.warn('[AttributionService] Order service returned no revenue data, using estimated', {
              campaignId,
              merchantId,
              conversions
            });
          }
        } catch (error) {
          // Order service call failed, fall back to estimated revenue
          revenueGenerated = conversions * estimatedAverageOrderValue;
          logger.warn('[AttributionService] Order service unavailable, using estimated revenue', {
            campaignId,
            merchantId,
            conversions,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      const roi = totalSpent > 0 ? ((revenueGenerated - totalSpent) / totalSpent) * 100 : 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

      return {
        impressions,
        clicks,
        conversions,
        totalSpent,
        revenueGenerated,
        revenueSource,
        roi,
        ctr,
        conversionRate,
        isEstimated: revenueSource === 'estimated',
      };
    } catch (error) {
      logger.error('[AttributionService] getCampaignROI error:', error);
      return null;
    }
  }

  /**
   * Get attribution report for all campaigns by merchant within date range
   */
  async getAttributionReport(
    merchantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      campaignId: string;
      campaignTitle: string;
      impressions: number;
      clicks: number;
      conversions: number;
      totalSpent: number;
      revenueGenerated: number;
      roi: number;
      ctr: number;
      conversionRate: number;
    }>
  > {
    try {
      if (!Types.ObjectId.isValid(merchantId)) {
        return [];
      }

      const campaigns = await AdCampaign.find({
        merchantId: new Types.ObjectId(merchantId),
        createdAt: { $gte: startDate, $lte: endDate },
      })
        .select('_id title impressions clicks totalSpent')
        .lean();

      const report = [];

      for (const campaign of campaigns) {
        const roi = await this.getCampaignROI(campaign._id.toString());
        if (roi) {
          report.push({
            campaignId: campaign._id.toString(),
            campaignTitle: campaign.title,
            impressions: roi.impressions,
            clicks: roi.clicks,
            conversions: roi.conversions,
            totalSpent: roi.totalSpent,
            revenueGenerated: roi.revenueGenerated,
            roi: roi.roi,
            ctr: roi.ctr,
            conversionRate: roi.conversionRate,
          });
        }
      }

      return report;
    } catch (error) {
      logger.error('[AttributionService] getAttributionReport error:', error);
      return [];
    }
  }
}

export const attributionService = new AttributionService();
