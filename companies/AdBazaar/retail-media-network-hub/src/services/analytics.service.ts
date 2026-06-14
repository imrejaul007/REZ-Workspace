import { RetailMediaCampaign, CampaignMetrics } from '../models/index.js';
import { AnalyticsQuery, AnalyticsResponse, Metrics } from '../types/index.js';
import { adImpressionsTotal, adClicksTotal, adOrdersTotal, adRevenueTotal } from '../config/metrics.js';

export class AnalyticsService {
  async getAnalytics(
    merchantId: string,
    query: AnalyticsQuery
  ): Promise<AnalyticsResponse> {
    const { campaignId, startDate, endDate, groupBy = 'day' } = query;

    // Build match criteria
    const matchCriteria: Record<string, unknown> = {};

    if (campaignId) {
      matchCriteria.campaignId = campaignId;
    } else {
      // Get all campaigns for merchant
      const campaigns = await RetailMediaCampaign.find({ merchantId })
        .select('campaignId')
        .lean();
      matchCriteria.campaignId = { $in: campaigns.map((c) => c.campaignId) };
    }

    if (startDate || endDate) {
      matchCriteria.date = {};
      if (startDate) {
        (matchCriteria.date as Record<string, Date>).$gte = new Date(startDate);
      }
      if (endDate) {
        (matchCriteria.date as Record<string, Date>).$lte = new Date(endDate);
      }
    }

    // Aggregate metrics
    const summaryPipeline = [
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
          totalOrders: { $sum: '$orders' },
          totalRevenue: { $sum: '$revenue' },
          totalSpend: { $sum: '$spend' },
        },
      },
    ];

    const summaryResult = await CampaignMetrics.aggregate(summaryPipeline);
    const summaryData = summaryResult[0] || {
      totalImpressions: 0,
      totalClicks: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalSpend: 0,
    };

    const summary: Metrics = {
      impressions: summaryData.totalImpressions,
      clicks: summaryData.totalClicks,
      orders: summaryData.totalOrders,
      revenue: summaryData.totalRevenue,
      acos:
        summaryData.totalRevenue > 0
          ? (summaryData.totalSpend / summaryData.totalRevenue) * 100
          : 0,
    };

    // Get trends by period
    const dateFormat = this.getDateFormat(groupBy);
    const trendsPipeline = [
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            period: {
              $dateToString: {
                format: dateFormat,
                date: '$date',
              },
            },
          },
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
          orders: { $sum: '$orders' },
          revenue: { $sum: '$revenue' },
        },
      },
      { $sort: { '_id.period': 1 } },
      { $limit: 90 }, // Last 90 periods
    ];

    const trendsResult = await CampaignMetrics.aggregate(trendsPipeline);

    const trends = trendsResult.map((t) => ({
      date: t._id.period,
      impressions: t.impressions,
      clicks: t.clicks,
      orders: t.orders,
      revenue: t.revenue,
      acos: t.revenue > 0 ? (t.clicks > 0 ? (t.clicks / t.revenue) * 100 : 0) : 0,
    }));

    // Get top products
    const topProductsPipeline = [
      { $match: matchCriteria },
      {
        $lookup: {
          from: 'retail_media_campaigns',
          localField: 'campaignId',
          foreignField: 'campaignId',
          as: 'campaign',
        },
      },
      { $unwind: '$campaign' },
      { $unwind: '$campaign.products' },
      {
        $group: {
          _id: '$campaign.products.productId',
          productName: { $first: '$campaign.products.productId' },
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
          orders: { $sum: '$orders' },
          revenue: { $sum: '$revenue' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ];

    const topProductsResult = await CampaignMetrics.aggregate(topProductsPipeline);

    const topProducts = topProductsResult.map((p) => ({
      productId: p._id,
      productName: p.productName,
      impressions: p.impressions,
      clicks: p.clicks,
      orders: p.orders,
      revenue: p.revenue,
    }));

    // Update metrics
    adImpressionsTotal.inc({ campaign_type: 'all' }, summary.impressions);
    adClicksTotal.inc({ campaign_type: 'all' }, summary.clicks);
    adOrdersTotal.inc({ campaign_type: 'all' }, summary.orders);
    adRevenueTotal.inc({ campaign_type: 'all' }, summary.revenue);

    return {
      summary,
      trends,
      topProducts,
    };
  }

  async getCampaignAnalytics(
    campaignId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    current: Metrics;
    previous: Metrics;
    trends: {
      impressionsChange: number;
      clicksChange: number;
      ordersChange: number;
      revenueChange: number;
    };
  }> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const currentStart = startDate ? new Date(startDate) : thirtyDaysAgo;
    const currentEnd = endDate ? new Date(endDate) : now;
    const previousStart = new Date(currentStart.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousEnd = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);

    const getPeriodMetrics = async (
      start: Date,
      end: Date
    ): Promise<Metrics> => {
      const result = await CampaignMetrics.aggregate([
        {
          $match: {
            campaignId,
            date: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            impressions: { $sum: '$impressions' },
            clicks: { $sum: '$clicks' },
            orders: { $sum: '$orders' },
            revenue: { $sum: '$revenue' },
            spend: { $sum: '$spend' },
          },
        },
      ]);

      const data = result[0] || {
        impressions: 0,
        clicks: 0,
        orders: 0,
        revenue: 0,
        spend: 0,
      };

      return {
        impressions: data.impressions,
        clicks: data.clicks,
        orders: data.orders,
        revenue: data.revenue,
        acos: data.revenue > 0 ? (data.spend / data.revenue) * 100 : 0,
      };
    };

    const [current, previous] = await Promise.all([
      getPeriodMetrics(currentStart, currentEnd),
      getPeriodMetrics(previousStart, previousEnd),
    ]);

    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      current,
      previous,
      trends: {
        impressionsChange: calculateChange(current.impressions, previous.impressions),
        clicksChange: calculateChange(current.clicks, previous.clicks),
        ordersChange: calculateChange(current.orders, previous.orders),
        revenueChange: calculateChange(current.revenue, previous.revenue),
      },
    };
  }

  async recordMetrics(
    campaignId: string,
    metrics: {
      impressions?: number;
      clicks?: number;
      orders?: number;
      revenue?: number;
      spend?: number;
    }
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await CampaignMetrics.findOneAndUpdate(
      { campaignId, date: today },
      {
        $inc: {
          impressions: metrics.impressions || 0,
          clicks: metrics.clicks || 0,
          orders: metrics.orders || 0,
          revenue: metrics.revenue || 0,
          spend: metrics.spend || 0,
        },
      },
      { upsert: true, new: true }
    );
  }

  private getDateFormat(groupBy: string): string {
    switch (groupBy) {
      case 'week':
        return '%Y-W%V';
      case 'month':
        return '%Y-%m';
      default:
        return '%Y-%m-%d';
    }
  }
}

export const analyticsService = new AnalyticsService();
