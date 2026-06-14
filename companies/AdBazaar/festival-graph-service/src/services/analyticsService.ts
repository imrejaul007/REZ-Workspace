import { FestivalAnalytics, IFestivalAnalytics, Festival } from '../models/index.js';
import { logger } from '../config/logger.js';
import { UpdateAnalyticsInput } from './schemas.js';
import mongoose from 'mongoose';

export interface FestivalAnalyticsResult {
  analytics: IFestivalAnalytics | null;
  summary: {
    totalImpressions: number;
    totalRevenue: number;
    ticketSalesRate: number;
    engagementScore: number;
    roi: number;
  };
}

export class AnalyticsService {
  async createOrGet(festivalId: string): Promise<IFestivalAnalytics> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      // Check if analytics already exists
      let analytics = await FestivalAnalytics.findOne({
        festivalId: new mongoose.Types.ObjectId(festivalId),
        period: 'overall',
      });

      if (!analytics) {
        const festival = await Festival.findById(festivalId);
        if (!festival) {
          throw new Error('Festival not found');
        }

        const startDate = festival.date;
        const endDate = festival.endDate || new Date(festival.date.getTime() + 3 * 24 * 60 * 60 * 1000);

        analytics = new FestivalAnalytics({
          festivalId: new mongoose.Types.ObjectId(festivalId),
          period: 'overall',
          startDate,
          endDate,
          impressions: {
            total: 0,
            byChannel: { dooh: 0, mobile: 0, social: 0, web: 0 },
            byLocation: {},
          },
          ticketSales: {
            total: festival.expectedAttendance,
            sold: 0,
            available: festival.expectedAttendance,
            revenue: 0,
            conversionRate: 0,
          },
          engagement: {
            avgSessionDuration: 0,
            bounceRate: 0,
            pageViews: 0,
            socialShares: 0,
            hashtagMentions: 0,
          },
          roi: {
            totalSpend: 0,
            totalRevenue: 0,
            revenuePerImpression: 0,
            costPerAcquisition: 0,
            returnOnAdSpend: 0,
          },
          dailyMetrics: [],
          adImpressions: [],
        });

        await analytics.save();
        logger.info('Festival analytics created', { festivalId, analyticsId: analytics._id });
      }

      return analytics;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create/get analytics', { error: errorMessage, festivalId });
      throw error;
    }
  }

  async getByFestival(festivalId: string, period?: string): Promise<IFestivalAnalytics | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const analytics = await FestivalAnalytics.findOne({
        festivalId: new mongoose.Types.ObjectId(festivalId),
        period: period || 'overall',
      }).lean();

      return analytics as IFestivalAnalytics | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get analytics', { error: errorMessage, festivalId, period });
      throw error;
    }
  }

  async update(festivalId: string, input: UpdateAnalyticsInput): Promise<IFestivalAnalytics | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      // Ensure analytics exists
      await this.createOrGet(festivalId);

      const updateData: Record<string, unknown> = {};

      if (input.impressions) {
        updateData['impressions.total'] = input.impressions.total;
        if (input.impressions.byChannel) {
          Object.entries(input.impressions.byChannel).forEach(([key, value]) => {
            updateData[`impressions.byChannel.${key}`] = value;
          });
        }
      }

      if (input.ticketSales) {
        Object.entries(input.ticketSales).forEach(([key, value]) => {
          updateData[`ticketSales.${key}`] = value;
        });
      }

      if (input.engagement) {
        Object.entries(input.engagement).forEach(([key, value]) => {
          updateData[`engagement.${key}`] = value;
        });
      }

      if (input.roi) {
        Object.entries(input.roi).forEach(([key, value]) => {
          updateData[`roi.${key}`] = value;
        });
      }

      const analytics = await FestivalAnalytics.findOneAndUpdate(
        {
          festivalId: new mongoose.Types.ObjectId(festivalId),
          period: 'overall',
        },
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();

      if (analytics) {
        // Recalculate derived metrics
        await this.recalculateMetrics(festivalId);
      }

      return analytics as IFestivalAnalytics | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update analytics', { error: errorMessage, festivalId, input });
      throw error;
    }
  }

  async addDailyMetric(festivalId: string, metric: {
    date: Date;
    impressions?: number;
    uniqueUsers?: number;
    ticketSales?: number;
    revenue?: number;
    socialMentions?: number;
    searchVolume?: number;
  }): Promise<IFestivalAnalytics | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const analytics = await FestivalAnalytics.findOneAndUpdate(
        {
          festivalId: new mongoose.Types.ObjectId(festivalId),
          period: 'overall',
        },
        {
          $push: {
            dailyMetrics: {
              date: metric.date,
              impressions: metric.impressions || 0,
              uniqueUsers: metric.uniqueUsers || 0,
              ticketSales: metric.ticketSales || 0,
              revenue: metric.revenue || 0,
              socialMentions: metric.socialMentions || 0,
              searchVolume: metric.searchVolume || 0,
            },
          },
        },
        { new: true, runValidators: true }
      ).lean();

      if (analytics) {
        await this.recalculateMetrics(festivalId);
      }

      return analytics as IFestivalAnalytics | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to add daily metric', { error: errorMessage, festivalId });
      throw error;
    }
  }

  async recordImpression(festivalId: string, impression: {
    adId: string;
    campaignId: string;
    location: { latitude: number; longitude: number };
    deviceType: 'mobile' | 'desktop' | 'tablet' | 'dooh';
    impressions?: number;
    clicks?: number;
    conversions?: number;
    spend?: number;
  }): Promise<IFestivalAnalytics | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(festivalId)) {
        throw new Error('Invalid festival ID');
      }

      const analytics = await FestivalAnalytics.findOneAndUpdate(
        {
          festivalId: new mongoose.Types.ObjectId(festivalId),
          period: 'overall',
        },
        {
          $push: {
            adImpressions: {
              adId: impression.adId,
              campaignId: impression.campaignId,
              timestamp: new Date(),
              location: impression.location,
              deviceType: impression.deviceType,
              impressions: impression.impressions || 1,
              clicks: impression.clicks || 0,
              conversions: impression.conversions || 0,
              spend: impression.spend || 0,
            },
          },
          $inc: {
            'impressions.total': impression.impressions || 1,
            [`impressions.byChannel.${impression.deviceType}`]: impression.impressions || 1,
          },
        },
        { new: true }
      ).lean();

      if (analytics) {
        await this.recalculateMetrics(festivalId);
      }

      return analytics as IFestivalAnalytics | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to record impression', { error: errorMessage, festivalId });
      throw error;
    }
  }

  async getAnalyticsWithSummary(festivalId: string): Promise<FestivalAnalyticsResult> {
    try {
      const analytics = await this.getByFestival(festivalId);

      if (!analytics) {
        return {
          analytics: null,
          summary: {
            totalImpressions: 0,
            totalRevenue: 0,
            ticketSalesRate: 0,
            engagementScore: 0,
            roi: 0,
          },
        };
      }

      // Calculate summary metrics
      const totalImpressions = analytics.impressions.total;
      const totalRevenue = analytics.roi.totalRevenue;
      const totalTickets = analytics.ticketSales.total;
      const soldTickets = analytics.ticketSales.sold;
      const ticketSalesRate = totalTickets > 0 ? (soldTickets / totalTickets) * 100 : 0;

      // Engagement score (0-100)
      const avgSession = analytics.engagement.avgSessionDuration;
      const bounceRate = analytics.engagement.bounceRate;
      const socialShares = analytics.engagement.socialShares;
      const engagementScore = Math.min(100, Math.round(
        (avgSession / 300) * 30 + // 5 min = 30 points
        ((100 - bounceRate) / 100) * 30 + // 0% bounce = 30 points
        Math.min(socialShares / 100, 1) * 40 // 100 shares = 40 points
      ));

      // ROI calculation
      const totalSpend = analytics.roi.totalSpend;
      const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

      return {
        analytics,
        summary: {
          totalImpressions,
          totalRevenue,
          ticketSalesRate,
          engagementScore,
          roi,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get analytics with summary', { error: errorMessage, festivalId });
      throw error;
    }
  }

  private async recalculateMetrics(festivalId: string): Promise<void> {
    try {
      const analytics = await FestivalAnalytics.findOne({
        festivalId: new mongoose.Types.ObjectId(festivalId),
        period: 'overall',
      });

      if (!analytics) return;

      // Recalculate ticket conversion rate
      if (analytics.ticketSales.total > 0) {
        analytics.ticketSales.conversionRate = (analytics.ticketSales.sold / analytics.ticketSales.total) * 100;
      }

      // Recalculate ROI metrics
      if (analytics.impressions.total > 0) {
        analytics.roi.revenuePerImpression = analytics.roi.totalRevenue / analytics.impressions.total;
      }

      if (analytics.ticketSales.sold > 0) {
        analytics.roi.costPerAcquisition = analytics.roi.totalSpend / analytics.ticketSales.sold;
      }

      if (analytics.roi.totalSpend > 0) {
        analytics.roi.returnOnAdSpend = ((analytics.roi.totalRevenue - analytics.roi.totalSpend) / analytics.roi.totalSpend) * 100;
      }

      await analytics.save();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to recalculate metrics', { error: errorMessage, festivalId });
    }
  }
}

export const analyticsService = new AnalyticsService();