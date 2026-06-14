import { Revenue, IRevenue } from '../models/index.js';
import { logger } from 'utils/logger.js';

export interface RecordRevenueInput {
  publisherId: string;
  inventoryId?: string;
  placementId?: string;
  date: Date;
  impressions: number;
  bids: number;
  wins: number;
  revenue: number;
  cost: number;
  adType: string;
  dealType?: 'open' | 'preferred' | 'private' | 'programmatic';
  country?: string;
  device?: 'desktop' | 'mobile' | 'tablet' | 'CTV';
  viewableImpressions?: number;
  clicks?: number;
  conversions?: number;
}

export interface RevenueFilters {
  publisherId: string;
  startDate?: string;
  endDate?: string;
  adType?: string;
  country?: string;
  device?: string;
  dealType?: string;
  groupBy?: 'day' | 'hour' | 'adType' | 'country' | 'device';
}

export interface RevenueSummary {
  totalRevenue: number;
  totalImpressions: number;
  totalBids: number;
  totalWins: number;
  avgEcpm: number;
  fillRate: number;
  avgViewability: number;
  totalClicks: number;
  ctr: number;
  totalConversions: number;
  conversionRate: number;
}

class RevenueService {
  /**
   * Record revenue data
   */
  async record(input: RecordRevenueInput): Promise<IRevenue> {
    const dateStr = this.formatDate(input.date);
    const hour = input.date.getHours();

    // Calculate derived metrics
    const ecpm = input.impressions > 0
      ? (input.revenue / input.impressions) * 1000
      : 0;
    const cpm = input.impressions > 0
      ? (input.revenue / input.impressions) * 1000
      : 0;
    const cpc = input.clicks && input.clicks > 0
      ? input.revenue / input.clicks
      : 0;
    const cpa = input.conversions && input.conversions > 0
      ? input.revenue / input.conversions
      : 0;
    const viewability = input.viewableImpressions
      ? (input.viewableImpressions / input.impressions) * 100
      : 0;
    const ctr = input.impressions > 0
      ? (input.clicks || 0) / input.impressions * 100
      : 0;
    const conversionRate = input.impressions > 0
      ? (input.conversions || 0) / input.impressions * 100
      : 0;

    // Upsert revenue record
    const revenue = await Revenue.findOneAndUpdate(
      {
        publisherId: input.publisherId,
        dateStr,
        hour,
        adType: input.adType,
        dealType: input.dealType,
        country: input.country,
        device: input.device
      },
      {
        $inc: {
          impressions: input.impressions,
          bids: input.bids,
          wins: input.wins,
          revenue: input.revenue,
          cost: input.cost,
          viewableImpressions: input.viewableImpressions || 0,
          clicks: input.clicks || 0,
          conversions: input.conversions || 0
        },
        $set: {
          date: input.date,
          inventoryId: input.inventoryId,
          placementId: input.placementId
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    // Update derived metrics
    revenue.ecpm = ecpm;
    revenue.cpm = cpm;
    revenue.cpc = cpc;
    revenue.cpa = cpa;
    revenue.viewability = viewability;
    revenue.ctr = ctr;
    revenue.conversionRate = conversionRate;
    await revenue.save();

    return revenue;
  }

  /**
   * Get revenue summary for a publisher
   */
  async getSummary(
    publisherId: string,
    startDate?: string,
    endDate?: string
  ): Promise<RevenueSummary> {
    const match: Record<string, unknown> = { publisherId };

    if (startDate || endDate) {
      match.dateStr = {};
      if (startDate) {
        (match.dateStr as Record<string, unknown>).$gte = startDate;
      }
      if (endDate) {
        (match.dateStr as Record<string, unknown>).$lte = endDate;
      }
    }

    const result = await Revenue.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue' },
          totalImpressions: { $sum: '$impressions' },
          totalBids: { $sum: '$bids' },
          totalWins: { $sum: '$wins' },
          avgEcpm: { $avg: '$ecpm' },
          avgViewability: { $avg: '$viewability' },
          totalClicks: { $sum: '$clicks' },
          totalConversions: { $sum: '$conversions' }
        }
      }
    ]);

    const stats = result[0] || {
      totalRevenue: 0,
      totalImpressions: 0,
      totalBids: 0,
      totalWins: 0,
      avgEcpm: 0,
      avgViewability: 0,
      totalClicks: 0,
      totalConversions: 0
    };

    return {
      totalRevenue: stats.totalRevenue,
      totalImpressions: stats.totalImpressions,
      totalBids: stats.totalBids,
      totalWins: stats.totalWins,
      avgEcpm: stats.avgEcpm || 0,
      fillRate: stats.totalBids > 0
        ? (stats.totalWins / stats.totalBids) * 100
        : 0,
      avgViewability: stats.avgViewability || 0,
      totalClicks: stats.totalClicks,
      ctr: stats.totalImpressions > 0
        ? (stats.totalClicks / stats.totalImpressions) * 100
        : 0,
      totalConversions: stats.totalConversions,
      conversionRate: stats.totalImpressions > 0
        ? (stats.totalConversions / stats.totalImpressions) * 100
        : 0
    };
  }

  /**
   * Get revenue time series
   */
  async getTimeSeries(
    publisherId: string,
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'hour' = 'day'
  ): Promise<Array<{
    date: string;
    hour?: number;
    revenue: number;
    impressions: number;
    ecpm: number;
  }>> {
    const groupField = groupBy === 'hour' ? { dateStr: 1, hour: 1 } : { dateStr: 1 };

    const result = await Revenue.aggregate([
      {
        $match: {
          publisherId,
          dateStr: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupField,
          revenue: { $sum: '$revenue' },
          impressions: { $sum: '$impressions' }
        }
      },
      { $sort: { '_id.dateStr': 1, '_id.hour': 1 } }
    ]);

    return result.map(r => ({
      date: r._id.dateStr,
      hour: r._id.hour,
      revenue: r.revenue,
      impressions: r.impressions,
      ecpm: r.impressions > 0 ? (r.revenue / r.impressions) * 1000 : 0
    }));
  }

  /**
   * Get revenue breakdown by dimension
   */
  async getBreakdown(
    publisherId: string,
    dimension: 'adType' | 'country' | 'device' | 'dealType',
    startDate?: string,
    endDate?: string
  ): Promise<Array<{
    key: string;
    revenue: number;
    impressions: number;
    ecpm: number;
    percentage: number;
  }>> {
    const match: Record<string, unknown> = { publisherId };

    if (startDate || endDate) {
      match.dateStr = {};
      if (startDate) {
        (match.dateStr as Record<string, unknown>).$gte = startDate;
      }
      if (endDate) {
        (match.dateStr as Record<string, unknown>).$lte = endDate;
      }
    }

    const groupId = dimension === 'adType' ? '$adType'
      : dimension === 'country' ? '$country'
      : dimension === 'device' ? '$device'
      : '$dealType';

    const result = await Revenue.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupId,
          revenue: { $sum: '$revenue' },
          impressions: { $sum: '$impressions' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    const totalRevenue = result.reduce((sum, r) => sum + r.revenue, 0);

    return result.map(r => ({
      key: r._id || 'unknown',
      revenue: r.revenue,
      impressions: r.impressions,
      ecpm: r.impressions > 0 ? (r.revenue / r.impressions) * 1000 : 0,
      percentage: totalRevenue > 0 ? (r.revenue / totalRevenue) * 100 : 0
    }));
  }

  /**
   * Get top performing inventory
   */
  async getTopInventory(
    publisherId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 10
  ): Promise<Array<{
    inventoryId: string;
    revenue: number;
    impressions: number;
    ecpm: number;
  }>> {
    const match: Record<string, unknown> = {
      publisherId,
      inventoryId: { $ne: null }
    };

    if (startDate || endDate) {
      match.dateStr = {};
      if (startDate) {
        (match.dateStr as Record<string, unknown>).$gte = startDate;
      }
      if (endDate) {
        (match.dateStr as Record<string, unknown>).$lte = endDate;
      }
    }

    const result = await Revenue.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$inventoryId',
          revenue: { $sum: '$revenue' },
          impressions: { $sum: '$impressions' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: limit }
    ]);

    return result.map(r => ({
      inventoryId: r._id?.toString() || '',
      revenue: r.revenue,
      impressions: r.impressions,
      ecpm: r.impressions > 0 ? (r.revenue / r.impressions) * 1000 : 0
    }));
  }

  /**
   * Get hourly patterns
   */
  async getHourlyPatterns(
    publisherId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Array<{
    hour: number;
    avgRevenue: number;
    avgImpressions: number;
    avgEcpm: number;
  }>> {
    const match: Record<string, unknown> = { publisherId };

    if (startDate || endDate) {
      match.dateStr = {};
      if (startDate) {
        (match.dateStr as Record<string, unknown>).$gte = startDate;
      }
      if (endDate) {
        (match.dateStr as Record<string, unknown>).$lte = endDate;
      }
    }

    const result = await Revenue.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$hour',
          avgRevenue: { $avg: '$revenue' },
          avgImpressions: { $avg: '$impressions' },
          avgEcpm: { $avg: '$ecpm' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return result.map(r => ({
      hour: r._id,
      avgRevenue: r.avgRevenue,
      avgImpressions: r.avgImpressions,
      avgEcpm: r.avgEcpm
    }));
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

export const revenueService = new RevenueService();
