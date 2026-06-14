import { Campaign, ScheduleEvent, Review, AIMarketingManager } from '../models';
import logger from 'utils/logger.js';

export interface PerformanceMetrics {
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  totalRevenue: number;
  roas: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
  engagementRate: number;
}

export interface DailyMetrics {
  date: string;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export interface PlatformBreakdown {
  platform: string;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  roas: number;
}

export class PerformanceService {
  /**
   * Get comprehensive performance report
   */
  async getPerformanceReport(
    merchantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    metrics: PerformanceMetrics;
    dailyTrend: DailyMetrics[];
    platformBreakdown: PlatformBreakdown[];
    topCampaigns: any[];
  }> {
    logger.info(`Generating performance report for merchant: ${merchantId}`);

    const manager = await AIMarketingManager.findOne({ merchantId });
    if (!manager) {
      throw new Error(`Manager not found for merchant: ${merchantId}`);
    }

    // Get all campaigns for the period
    const campaignQuery: any = { merchantId };
    if (startDate || endDate) {
      campaignQuery.createdAt = {};
      if (startDate) {
        campaignQuery.createdAt.$gte = startDate;
      }
      if (endDate) {
        campaignQuery.createdAt.$lte = endDate;
      }
    }

    const campaigns = await Campaign.find(campaignQuery);

    // Calculate aggregate metrics
    const metrics = this.calculateAggregateMetrics(campaigns);

    // Calculate daily trend
    const dailyTrend = await this.calculateDailyTrend(merchantId, startDate, endDate);

    // Calculate platform breakdown
    const platformBreakdown = await this.calculatePlatformBreakdown(campaigns);

    // Get top performing campaigns
    const topCampaigns = campaigns
      .sort((a, b) => b.performance.conversions - a.performance.conversions)
      .slice(0, 5)
      .map(c => ({
        campaignId: c.campaignId,
        name: c.name,
        type: c.type,
        conversions: c.performance.conversions,
        roas: c.performance.roas,
        spend: c.performance.spend,
      }));

    return {
      metrics,
      dailyTrend,
      platformBreakdown,
      topCampaigns,
    };
  }

  /**
   * Calculate aggregate metrics from campaigns
   */
  private calculateAggregateMetrics(campaigns: any[]): PerformanceMetrics {
    const totals = campaigns.reduce(
      (acc, c) => ({
        reach: acc.reach + (c.performance.reach || 0),
        impressions: acc.impressions + (c.performance.impressions || 0),
        engagement: acc.engagement + (c.performance.engagement || 0),
        clicks: acc.clicks + (c.performance.clicks || 0),
        conversions: acc.conversions + (c.performance.conversions || 0),
        spend: acc.spend + (c.performance.spend || 0),
        revenue: acc.revenue + (c.performance.revenue || 0),
      }),
      { reach: 0, impressions: 0, engagement: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
    );

    return {
      totalReach: totals.reach,
      totalImpressions: totals.impressions,
      totalEngagement: totals.engagement,
      totalClicks: totals.clicks,
      totalConversions: totals.conversions,
      totalSpend: totals.spend,
      totalRevenue: totals.revenue,
      roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0,
      engagementRate: totals.impressions > 0 ? (totals.engagement / totals.impressions) * 100 : 0,
    };
  }

  /**
   * Calculate daily trend
   */
  private async calculateDailyTrend(
    merchantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<DailyMetrics[]> {
    const events = await ScheduleEvent.find({
      merchantId,
      status: 'sent',
      sentAt: { $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).sort({ sentAt: 1 });

    // Group by date
    const dailyMap = new Map<string, DailyMetrics>();

    events.forEach(event => {
      const date = event.sentAt!.toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          reach: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
          revenue: 0,
        });
      }

      const daily = dailyMap.get(date)!;
      daily.impressions += Math.floor(Math.random() * 100) + 10; // Simulated
      daily.clicks += Math.floor(Math.random() * 10) + 1; // Simulated
      daily.reach += Math.floor(Math.random() * 50) + 5; // Simulated
    });

    return Array.from(dailyMap.values());
  }

  /**
   * Calculate platform breakdown
   */
  private calculatePlatformBreakdown(campaigns: any[]): PlatformBreakdown[] {
    const platformMap = new Map<string, PlatformBreakdown>();

    const platformNames: Record<string, string> = {
      facebook_ad: 'Facebook',
      instagram_ad: 'Instagram',
      google_ad: 'Google Ads',
      whatsapp_broadcast: 'WhatsApp',
      social_post: 'Social Media',
    };

    campaigns.forEach(campaign => {
      const platform = platformNames[campaign.type] || campaign.type;

      if (!platformMap.has(platform)) {
        platformMap.set(platform, {
          platform,
          reach: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
          revenue: 0,
          roas: 0,
        });
      }

      const p = platformMap.get(platform)!;
      p.reach += campaign.performance.reach || 0;
      p.impressions += campaign.performance.impressions || 0;
      p.clicks += campaign.performance.clicks || 0;
      p.conversions += campaign.performance.conversions || 0;
      p.spend += campaign.performance.spend || 0;
      p.revenue += campaign.performance.revenue || 0;
    });

    // Calculate ROAS for each platform
    platformMap.forEach(p => {
      p.roas = p.spend > 0 ? p.revenue / p.spend : 0;
    });

    return Array.from(platformMap.values());
  }

  /**
   * Get review performance
   */
  async getReviewPerformance(
    merchantId: string
  ): Promise<{
    averageRating: number;
    totalReviews: number;
    sentimentBreakdown: { positive: number; neutral: number; negative: number };
    platformBreakdown: any[];
    recentTrend: any[];
  }> {
    const reviews = await Review.find({ merchantId });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        platformBreakdown: [],
        recentTrend: [],
      };
    }

    // Calculate average rating
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    // Sentiment breakdown
    const sentimentBreakdown = {
      positive: reviews.filter(r => r.sentiment === 'positive').length,
      neutral: reviews.filter(r => r.sentiment === 'neutral').length,
      negative: reviews.filter(r => r.sentiment === 'negative').length,
    };

    // Platform breakdown
    const platformMap = new Map<string, { count: number; totalRating: number }>();
    reviews.forEach(r => {
      if (!platformMap.has(r.platform)) {
        platformMap.set(r.platform, { count: 0, totalRating: 0 });
      }
      const p = platformMap.get(r.platform)!;
      p.count++;
      p.totalRating += r.rating;
    });

    const platformBreakdown = Array.from(platformMap.entries()).map(([platform, data]) => ({
      platform,
      count: data.count,
      averageRating: data.totalRating / data.count,
    }));

    // Recent trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentReviews = reviews.filter(r => r.createdAt >= thirtyDaysAgo);

    // Group by week
    const weekMap = new Map<string, number>();
    recentReviews.forEach(r => {
      const weekStart = this.getWeekStart(r.createdAt);
      weekMap.set(weekStart, (weekMap.get(weekStart) || 0) + 1);
    });

    const recentTrend = Array.from(weekMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, count]) => ({ week, count }));

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      sentimentBreakdown,
      platformBreakdown,
      recentTrend,
    };
  }

  /**
   * Get week start date
   */
  private getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }

  /**
   * Simulate performance updates (for demo purposes)
   */
  async simulatePerformanceUpdate(campaignId: string): Promise<any> {
    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign) {
      return null;
    }

    // Simulate performance changes
    const impressions = Math.floor(Math.random() * 100) + 10;
    const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
    const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.02));
    const spend = Math.random() * 50;
    const revenue = conversions * (Math.random() * 100 + 50);

    campaign.performance.impressions += impressions;
    campaign.performance.clicks += clicks;
    campaign.performance.conversions += conversions;
    campaign.performance.spend += spend;
    campaign.performance.revenue += revenue;
    campaign.performance.reach += Math.floor(impressions * 1.5);

    // Recalculate derived metrics
    if (campaign.performance.impressions > 0) {
      campaign.performance.ctr = (campaign.performance.clicks / campaign.performance.impressions) * 100;
    }
    if (campaign.performance.clicks > 0) {
      campaign.performance.cpc = campaign.performance.spend / campaign.performance.clicks;
    }
    if (campaign.performance.spend > 0) {
      campaign.performance.roas = campaign.performance.revenue / campaign.performance.spend;
    }

    await campaign.save();

    return {
      campaignId,
      delta: { impressions, clicks, conversions, spend, revenue },
      total: campaign.performance,
    };
  }
}

export const performanceService = new PerformanceService();
export default performanceService;