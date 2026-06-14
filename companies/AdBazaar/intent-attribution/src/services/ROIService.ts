import { Conversion } from '../models/Conversion.js';
import { AttributionRecord } from '../models/AttributionRecord.js';
import { getCache, setCache } from '../config/redis.js';
import logger from '../config/logger.js';

export interface ROIMetrics {
  segmentId: string;
  segmentName: string;
  conversions: number;
  totalValue: number;
  totalCost: number;
  roi: number;
  roas: number;
  cpa: number;
  ltv: number;
  topSources: Array<{
    source: string;
    conversions: number;
    value: number;
    cost: number;
    roi: number;
  }>;
}

export interface SegmentROITrend {
  date: Date;
  segmentId: string;
  conversions: number;
  value: number;
  cost: number;
  roi: number;
}

export class ROIService {
  /**
   * Calculate ROI for a segment
   */
  async calculateSegmentROI(
    segmentId: string,
    startDate: Date,
    endDate: Date,
    cost: number
  ): Promise<ROIMetrics> {
    const cacheKey = `roi:segment:${segmentId}:${startDate.toISOString()}:${endDate.toISOString()}`;

    const cached = await getCache<ROIMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    logger.info('Calculating segment ROI', { segmentId, startDate, endDate, cost });

    // Get conversions for the segment
    const conversions = await Conversion.find({
      timestamp: { $gte: startDate, $lte: endDate },
      category: segmentId
    }).lean();

    // Calculate metrics
    const totalValue = conversions.reduce((sum, c) => sum + c.conversionValue, 0);
    const totalConversions = conversions.length;

    // Calculate by source
    const sourceMap = new Map<string, { conversions: Set<string>; value: number }>();

    for (const conversion of conversions) {
      for (const signal of conversion.attributedSignals) {
        const existing = sourceMap.get(signal.source) || { conversions: new Set(), value: 0 };
        existing.conversions.add(conversion.conversionId);
        existing.value += signal.attributionValue;
        sourceMap.set(signal.source, existing);
      }
    }

    // Estimate cost per source (assuming equal distribution)
    const sourceCount = sourceMap.size;
    const costPerSource = sourceCount > 0 ? cost / sourceCount : 0;

    const topSources = Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        conversions: data.conversions.size,
        value: Math.round(data.value * 100) / 100,
        cost: Math.round(costPerSource * 100) / 100,
        roi: costPerSource > 0 ? Math.round(((data.value - costPerSource) / costPerSource) * 10000) / 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Calculate overall metrics
    const roi = cost > 0 ? ((totalValue - cost) / cost) * 100 : 0;
    const roas = cost > 0 ? totalValue / cost : 0;
    const cpa = totalConversions > 0 ? cost / totalConversions : 0;

    // Estimate LTV (simplified - based on average order value * 2)
    const avgOrderValue = totalConversions > 0 ? totalValue / totalConversions : 0;
    const ltv = avgOrderValue * 2;

    const result: ROIMetrics = {
      segmentId,
      segmentName: segmentId, // Could be enriched with segment name lookup
      conversions: totalConversions,
      totalValue: Math.round(totalValue * 100) / 100,
      totalCost: Math.round(cost * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      roas: Math.round(roas * 100) / 100,
      cpa: Math.round(cpa * 100) / 100,
      ltv: Math.round(ltv * 100) / 100,
      topSources
    };

    // Cache for 10 minutes
    await setCache(cacheKey, result, 600);

    return result;
  }

  /**
   * Get ROI trends over time
   */
  async getROITrends(
    segmentId: string,
    startDate: Date,
    endDate: Date,
    intervalDays = 7
  ): Promise<SegmentROITrend[]> {
    const conversions = await Conversion.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          category: segmentId
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          conversions: { $sum: 1 },
          value: { $sum: '$conversionValue' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Generate trend data
    const trends: SegmentROITrend[] = conversions.map(conv => ({
      date: new Date(conv._id),
      segmentId,
      conversions: conv.conversions,
      value: conv.value,
      cost: 0, // Would need cost data per day
      roi: 0 // Calculated when cost data available
    }));

    return trends;
  }

  /**
   * Compare ROI across segments
   */
  async compareSegmentROI(
    segmentIds: string[],
    startDate: Date,
    endDate: Date,
    costs: Record<string, number>
  ): Promise<Array<ROIMetrics & { rank: number }>> {
    const results: ROIMetrics[] = [];

    for (const segmentId of segmentIds) {
      const roi = await this.calculateSegmentROI(
        segmentId,
        startDate,
        endDate,
        costs[segmentId] || 0
      );
      results.push(roi);
    }

    // Sort by ROI and add rank
    return results
      .sort((a, b) => b.roi - a.roi)
      .map((roi, index) => ({ ...roi, rank: index + 1 }));
  }

  /**
   * Get channel ROI breakdown
   */
  async getChannelROI(
    startDate: Date,
    endDate: Date,
    costs: Record<string, number>
  ): Promise<Array<{
    channel: string;
    conversions: number;
    value: number;
    cost: number;
    roi: number;
    roas: number;
  }>> {
    const conversions = await Conversion.find({
      timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    // Group by channel (source)
    const channelMap = new Map<string, { conversions: Set<string>; value: number }>();

    for (const conversion of conversions) {
      for (const signal of conversion.attributedSignals) {
        // Extract channel from source (e.g., "google_search" -> "search")
        const channel = this.extractChannel(signal.source);
        const existing = channelMap.get(channel) || { conversions: new Set(), value: 0 };
        existing.conversions.add(conversion.conversionId);
        existing.value += signal.attributionValue;
        channelMap.set(channel, existing);
      }
    }

    return Array.from(channelMap.entries())
      .map(([channel, data]) => {
        const cost = costs[channel] || 0;
        const roi = cost > 0 ? ((data.value - cost) / cost) * 100 : 0;
        const roas = cost > 0 ? data.value / cost : 0;

        return {
          channel,
          conversions: data.conversions.size,
          value: Math.round(data.value * 100) / 100,
          cost: Math.round(cost * 100) / 100,
          roi: Math.round(roi * 100) / 100,
          roas: Math.round(roas * 100) / 100
        };
      })
      .sort((a, b) => b.roi - a.roi);
  }

  /**
   * Get attribution to revenue ratio
   */
  async getAttributionEfficiency(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRevenue: number;
    attributedRevenue: number;
    unattributedRevenue: number;
    attributionRate: number;
    bySource: Record<string, { revenue: number; rate: number }>;
  }> {
    const conversions = await Conversion.find({
      timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    let totalRevenue = 0;
    let attributedRevenue = 0;
    const bySource: Record<string, { revenue: number; count: number }> = {};

    for (const conversion of conversions) {
      totalRevenue += conversion.conversionValue;

      if (conversion.attributedSignals.length > 0) {
        attributedRevenue += conversion.conversionValue;

        // Track by primary source
        const primarySource = conversion.attributedSignals[0].source;
        if (!bySource[primarySource]) {
          bySource[primarySource] = { revenue: 0, count: 0 };
        }
        bySource[primarySource].revenue += conversion.conversionValue;
        bySource[primarySource].count++;
      }
    }

    const unattributedRevenue = totalRevenue - attributedRevenue;
    const attributionRate = totalRevenue > 0 ? (attributedRevenue / totalRevenue) * 100 : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      attributedRevenue: Math.round(attributedRevenue * 100) / 100,
      unattributedRevenue: Math.round(unattributedRevenue * 100) / 100,
      attributionRate: Math.round(attributionRate * 100) / 100,
      bySource: Object.fromEntries(
        Object.entries(bySource).map(([source, data]) => [
          source,
          {
            revenue: Math.round(data.revenue * 100) / 100,
            rate: Math.round((data.revenue / attributedRevenue) * 10000) / 100
          }
        ])
      )
    };
  }

  /**
   * Extract channel type from source
   */
  private extractChannel(source: string): string {
    const sourceLower = source.toLowerCase();

    if (sourceLower.includes('search')) return 'search';
    if (sourceLower.includes('social') || sourceLower.includes('facebook') || sourceLower.includes('instagram') || sourceLower.includes('twitter')) return 'social';
    if (sourceLower.includes('display') || sourceLower.includes('banner')) return 'display';
    if (sourceLower.includes('video')) return 'video';
    if (sourceLower.includes('email')) return 'email';
    if (sourceLower.includes('affiliate')) return 'affiliate';
    if (sourceLower.includes('direct')) return 'direct';

    return 'other';
  }

  /**
   * Get campaign ROI summary
   */
  async getCampaignROI(
    campaignId: string,
    startDate: Date,
    endDate: Date,
    totalCost: number
  ): Promise<{
    campaignId: string;
    conversions: number;
    revenue: number;
    cost: number;
    roi: number;
    roas: number;
    profit: number;
    avgOrderValue: number;
    conversionRate: number;
  }> {
    const conversions = await Conversion.find({
      timestamp: { $gte: startDate, $lte: endDate },
      'metadata.campaignId': campaignId
    }).lean();

    const totalRevenue = conversions.reduce((sum, c) => sum + c.conversionValue, 0);
    const profit = totalRevenue - totalCost;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    const roas = totalCost > 0 ? totalRevenue / totalCost : 0;
    const avgOrderValue = conversions.length > 0 ? totalRevenue / conversions.length : 0;

    // Get total touchpoints for conversion rate
    const touchpoints = await AttributionRecord.countDocuments({
      timestamp: { $gte: startDate, $lte: endDate },
      attributedTo: { $in: conversions.map(c => c.conversionId) }
    });

    const conversionRate = touchpoints > 0 ? (conversions.length / touchpoints) * 100 : 0;

    return {
      campaignId,
      conversions: conversions.length,
      revenue: Math.round(totalRevenue * 100) / 100,
      cost: Math.round(totalCost * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      roas: Math.round(roas * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  }
}

export default new ROIService();