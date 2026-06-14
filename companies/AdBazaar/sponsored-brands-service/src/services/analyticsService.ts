import { BrandCampaign, BrandPerformance, Keyword, BrandAd } from '../models';
import { logger, impressionsGauge, clicksGauge, spendGauge, roasGauge } from '../utils';
import { z } from 'zod';

export interface PerformanceMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  cpc: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
}

export interface TimeSeriesData {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  roas: number;
}

export interface KeywordPerformance {
  keywordId: string;
  term: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  conversions: number;
  cpc: number;
  roas: number;
  qualityScore: number;
}

export interface AudienceInsight {
  segment: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  roas: number;
}

class AnalyticsService {
  async getCampaignPerformance(campaignId: string, dateRange?: {
    start: Date;
    end: Date;
  }): Promise<PerformanceMetrics> {
    try {
      const campaign = await BrandCampaign.findOne({ campaignId });
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      let dailyData: PerformanceMetrics = {
        impressions: 0,
        clicks: 0,
        ctr: 0,
        spend: 0,
        cpc: 0,
        conversions: 0,
        revenue: 0,
        roas: 0,
        cpa: 0
      };

      if (dateRange) {
        const performanceData = await BrandPerformance.find({
          campaignId,
          date: { $gte: dateRange.start, $lte: dateRange.end }
        });

        performanceData.forEach(p => {
          dailyData.impressions += p.metrics.impressions;
          dailyData.clicks += p.metrics.clicks;
          dailyData.spend += p.metrics.spend;
          dailyData.conversions += p.metrics.conversions;
          dailyData.revenue += p.metrics.revenue;
        });
      } else {
        dailyData = {
          ...campaign.performance,
          ctr: campaign.performance.impressions > 0
            ? (campaign.performance.clicks / campaign.performance.impressions) * 100
            : 0,
          cpc: campaign.performance.clicks > 0
            ? (campaign.performance.spend / campaign.performance.clicks) * 100
            : 0,
          roas: campaign.performance.spend > 0
            ? campaign.performance.revenue / campaign.performance.spend
            : 0,
          cpa: campaign.performance.conversions > 0
            ? campaign.performance.spend / campaign.performance.conversions
            : 0
        };
      }

      dailyData.ctr = dailyData.impressions > 0
        ? (dailyData.clicks / dailyData.impressions) * 100
        : 0;
      dailyData.cpc = dailyData.clicks > 0
        ? (dailyData.spend / dailyData.clicks) * 100
        : 0;
      dailyData.roas = dailyData.spend > 0
        ? dailyData.revenue / dailyData.spend
        : 0;
      dailyData.cpa = dailyData.conversions > 0
        ? dailyData.spend / dailyData.conversions
        : 0;

      return dailyData;
    } catch (error) {
      logger.error('Failed to get campaign performance', { error, campaignId });
      throw error;
    }
  }

  async getTimeSeriesData(campaignId: string, days: number = 30): Promise<TimeSeriesData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const performanceData = await BrandPerformance.find({
        campaignId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });

      const dataMap = new Map<string, TimeSeriesData>();

      performanceData.forEach(p => {
        const dateKey = p.date.toISOString().split('T')[0];
        const existing = dataMap.get(dateKey) || {
          date: dateKey,
          impressions: 0,
          clicks: 0,
          spend: 0,
          conversions: 0,
          roas: 0
        };

        existing.impressions += p.metrics.impressions;
        existing.clicks += p.metrics.clicks;
        existing.spend += p.metrics.spend;
        existing.conversions += p.metrics.conversions;
        existing.roas = existing.spend > 0
          ? (existing.conversions * 100) / existing.spend
          : 0;

        dataMap.set(dateKey, existing);
      });

      return Array.from(dataMap.values());
    } catch (error) {
      logger.error('Failed to get time series data', { error, campaignId });
      throw error;
    }
  }

  async getKeywordPerformance(campaignId: string): Promise<KeywordPerformance[]> {
    try {
      const keywords = await Keyword.find({ campaignId });

      return keywords.map(kw => ({
        keywordId: kw.keywordId,
        term: kw.term,
        impressions: kw.performance.impressions,
        clicks: kw.performance.clicks,
        ctr: kw.performance.ctr,
        spend: kw.performance.spend,
        conversions: kw.performance.conversions,
        cpc: kw.performance.cpc,
        roas: kw.performance.roas,
        qualityScore: kw.qualityScore
      })).sort((a, b) => b.roas - a.roas);
    } catch (error) {
      logger.error('Failed to get keyword performance', { error, campaignId });
      throw error;
    }
  }

  async getAdPerformance(campaignId: string): Promise<Array<{
    adId: string;
    name: string;
    type: string;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    spend: number;
  }>> {
    try {
      const ads = await BrandAd.find({ campaignId, status: 'active' });

      return ads.map(ad => ({
        adId: ad.adId,
        name: ad.name,
        type: ad.type,
        impressions: ad.performance.impressions,
        clicks: ad.performance.clicks,
        ctr: ad.performance.ctr,
        conversions: ad.performance.conversions,
        spend: ad.performance.spend
      })).sort((a, b) => b.clicks - a.clicks);
    } catch (error) {
      logger.error('Failed to get ad performance', { error, campaignId });
      throw error;
    }
  }

  async getAudienceInsights(campaignId: string): Promise<AudienceInsight[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const performanceData = await BrandPerformance.find({
        campaignId,
        date: { $gte: startDate, $lte: endDate }
      });

      const audienceMap = new Map<string, AudienceInsight>();

      performanceData.forEach(p => {
        p.audienceMetrics.forEach(a => {
          const existing = audienceMap.get(a.segment) || {
            segment: a.segment,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            roas: 0
          };

          existing.impressions += a.impressions;
          existing.clicks += a.clicks;
          existing.conversions += a.conversions;
          existing.ctr = existing.impressions > 0
            ? (existing.clicks / existing.impressions) * 100
            : 0;

          audienceMap.set(a.segment, existing);
        });
      });

      return Array.from(audienceMap.values()).sort((a, b) => b.conversions - a.conversions);
    } catch (error) {
      logger.error('Failed to get audience insights', { error, campaignId });
      throw error;
    }
  }

  async getDeviceBreakdown(campaignId: string): Promise<Array<{
    device: string;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpa: number;
  }>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const performanceData = await BrandPerformance.find({
        campaignId,
        date: { $gte: startDate, $lte: endDate }
      });

      const deviceMap = new Map<string, {
        impressions: number;
        clicks: number;
        conversions: number;
        spend: number;
      }>();

      performanceData.forEach(p => {
        p.deviceMetrics.forEach(d => {
          const existing = deviceMap.get(d.device) || {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            spend: 0
          };

          existing.impressions += d.impressions;
          existing.clicks += d.clicks;
          existing.conversions += d.conversions;

          deviceMap.set(d.device, existing);
        });
      });

      return Array.from(deviceMap.entries()).map(([device, data]) => ({
        device,
        impressions: data.impressions,
        clicks: data.clicks,
        conversions: data.conversions,
        ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
        cpa: data.conversions > 0 ? data.spend / data.conversions : 0
      }));
    } catch (error) {
      logger.error('Failed to get device breakdown', { error, campaignId });
      throw error;
    }
  }

  async getLocationPerformance(campaignId: string): Promise<Array<{
    location: string;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    roas: number;
  }>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const performanceData = await BrandPerformance.find({
        campaignId,
        date: { $gte: startDate, $lte: endDate }
      });

      const locationMap = new Map<string, {
        impressions: number;
        clicks: number;
        conversions: number;
        spend: number;
      }>();

      performanceData.forEach(p => {
        p.locationMetrics.forEach(l => {
          const existing = locationMap.get(l.location) || {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            spend: 0
          };

          existing.impressions += l.impressions;
          existing.clicks += l.clicks;
          existing.conversions += l.conversions;

          locationMap.set(l.location, existing);
        });
      });

      return Array.from(locationMap.entries()).map(([location, data]) => ({
        location,
        impressions: data.impressions,
        clicks: data.clicks,
        conversions: data.conversions,
        ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
        roas: data.spend > 0 ? (data.conversions * 100) / data.spend : 0
      })).sort((a, b) => b.conversions - a.conversions);
    } catch (error) {
      logger.error('Failed to get location performance', { error, campaignId });
      throw error;
    }
  }

  async getBenchmarkMetrics(campaignId: string): Promise<{
    industryCTR: number;
    industryCPC: number;
    industryROAS: number;
    campaignCTR: number;
    campaignCPC: number;
    campaignROAS: number;
    comparison: 'above' | 'below' | 'at_par';
  }> {
    try {
      const campaign = await BrandCampaign.findOne({ campaignId });
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const industryBenchmarks = {
        retail: { ctr: 0.65, cpc: 1.20, roas: 3.5 },
        electronics: { ctr: 0.58, cpc: 1.45, roas: 4.2 },
        fashion: { ctr: 0.72, cpc: 0.95, roas: 3.8 },
        default: { ctr: 0.50, cpc: 1.00, roas: 3.0 }
      };

      const benchmarks = industryBenchmarks.default;
      const metrics = await this.getCampaignPerformance(campaignId);

      return {
        industryCTR: benchmarks.ctr,
        industryCPC: benchmarks.cpc,
        industryROAS: benchmarks.roas,
        campaignCTR: metrics.ctr,
        campaignCPC: metrics.cpc,
        campaignROAS: metrics.roas,
        comparison: metrics.roas > benchmarks.roas ? 'above'
          : metrics.roas < benchmarks.roas * 0.8 ? 'below'
          : 'at_par'
      };
    } catch (error) {
      logger.error('Failed to get benchmark metrics', { error, campaignId });
      throw error;
    }
  }

  async recordPerformance(campaignId: string, date: Date, metrics: PerformanceMetrics): Promise<void> {
    try {
      const performanceId = `perf_${Date.now()}_${campaignId}`;

      await BrandPerformance.create({
        performanceId,
        campaignId,
        date,
        metrics,
        keywordMetrics: [],
        adMetrics: [],
        audienceMetrics: [],
        deviceMetrics: [],
        locationMetrics: []
      });

      logger.info('Performance recorded', { campaignId, date: date.toISOString() });
    } catch (error) {
      logger.error('Failed to record performance', { error, campaignId });
      throw error;
    }
  }

  async getAggregatedStats(advertiserId: string, dateRange?: {
    start: Date;
    end: Date;
  }): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalImpressions: number;
    totalClicks: number;
    totalSpend: number;
    totalConversions: number;
    avgROAS: number;
    avgCTR: number;
  }> {
    try {
      const query: Record<string, unknown> = { advertiserId };
      if (dateRange) {
        query['schedule.startDate'] = { $gte: dateRange.start };
      }

      const campaigns = await BrandCampaign.find(query);

      let totalImpressions = 0;
      let totalClicks = 0;
      let totalSpend = 0;
      let totalConversions = 0;
      let totalRevenue = 0;

      campaigns.forEach(c => {
        totalImpressions += c.performance.impressions;
        totalClicks += c.performance.clicks;
        totalSpend += c.performance.spend;
        totalConversions += c.performance.conversions;
        totalRevenue += c.performance.conversions * 50;
      });

      return {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        totalImpressions,
        totalClicks,
        totalSpend,
        totalConversions,
        avgROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
      };
    } catch (error) {
      logger.error('Failed to get aggregated stats', { error, advertiserId });
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();