import mongoose from 'mongoose';
import { SportsAnalyticsModel, ISportsAnalyticsDocument } from '../models/sports-analytics.model.js';
import { SportsEventModel } from '../models/sports-event.model.js';
import logger from '../config/logger.js';
import { dbQueryDuration, footfallPredictionTotal, campaignRecommendationsTotal } from '../config/metrics.js';

export interface AnalyticsData {
  eventId: string;
  impressions?: number;
  ticketSales?: number;
  viewership?: number;
  adRevenue?: number;
  engagement?: {
    social?: number;
    streaming?: number;
    tv?: number;
  };
  demographics?: {
    ageGroups?: Record<string, number>;
    genderSplit?: Record<string, number>;
    regions?: Record<string, number>;
  };
  peakMoments?: Array<{
    timestamp: Date;
    description: string;
    engagement: number;
  }>;
  merchantImpact?: {
    nearbyRestaurants?: number;
    nearbyHotels?: number;
    nearbyRetail?: number;
    transportUsage?: number;
  };
}

export interface FootfallPrediction {
  eventId: string;
  predictedCrowd: number;
  confidence: number;
  peakHours: Array<{
    hour: number;
    expectedCount: number;
  }>;
  nearbyMerchantImpact: {
    restaurants: { expectedIncrease: number; peakHours: number[] };
    bars: { expectedIncrease: number; peakHours: number[] };
    hotels: { expectedIncrease: number; peakHours: number[] };
    retail: { expectedIncrease: number; peakHours: number[] };
  };
  calculatedAt: string;
}

export class AnalyticsService {
  async createOrUpdateAnalytics(data: AnalyticsData): Promise<ISportsAnalyticsDocument> {
    const startTime = Date.now();

    try {
      const analytics = await SportsAnalyticsModel.findOneAndUpdate(
        { eventId: new mongoose.Types.ObjectId(data.eventId) },
        { $set: data },
        { new: true, upsert: true }
      );

      logger.info('Analytics created/updated', { eventId: data.eventId });
      return analytics;
    } catch (error) {
      logger.error('Failed to create/update analytics', { error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'upsert', collection: 'sports_analytics' }, (Date.now() - startTime) / 1000);
    }
  }

  async getAnalyticsByEventId(eventId: string): Promise<ISportsAnalyticsDocument | null> {
    const startTime = Date.now();

    try {
      return await SportsAnalyticsModel.findOne({ eventId: new mongoose.Types.ObjectId(eventId) }).lean();
    } catch (error) {
      logger.error('Failed to get analytics by event ID', { eventId, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'findOne', collection: 'sports_analytics' }, (Date.now() - startTime) / 1000);
    }
  }

  async getAllAnalytics(page: number = 1, limit: number = 20): Promise<{
    analytics: ISportsAnalyticsDocument[];
    total: number;
  }> {
    const startTime = Date.now();
    const skip = (page - 1) * limit;

    try {
      const [analytics, total] = await Promise.all([
        SportsAnalyticsModel.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        SportsAnalyticsModel.countDocuments()
      ]);

      return { analytics: analytics as ISportsAnalyticsDocument[], total };
    } catch (error) {
      logger.error('Failed to get all analytics', { error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'find', collection: 'sports_analytics' }, (Date.now() - startTime) / 1000);
    }
  }

  async predictFootfall(eventId: string): Promise<FootfallPrediction> {
    const startTime = Date.now();

    try {
      const event = await SportsEventModel.findById(eventId).lean();
      if (!event) {
        throw new Error('Event not found');
      }

      // Simple footfall prediction based on venue capacity
      const venueCapacity = event.venue.capacity;
      const expectedAttendance = Math.floor(venueCapacity * 0.85); // 85% expected fill rate
      const confidence = 0.75;

      // Generate peak hours (typically2-3 hours before and during event)
      const eventHour = new Date(event.startDate).getHours();
      const peakHours = [
        { hour: eventHour - 2, expectedCount: Math.floor(expectedAttendance * 0.3) },
        { hour: eventHour - 1, expectedCount: Math.floor(expectedAttendance * 0.6) },
        { hour: eventHour, expectedCount: Math.floor(expectedAttendance * 0.85) },
        { hour: eventHour + 1, expectedCount: Math.floor(expectedAttendance * 0.9) },
        { hour: eventHour + 2, expectedCount: Math.floor(expectedAttendance * 0.7) }
      ];

      const prediction: FootfallPrediction = {
        eventId,
        predictedCrowd: expectedAttendance,
        confidence,
        peakHours,
        nearbyMerchantImpact: {
          restaurants: { expectedIncrease: 40, peakHours: [eventHour - 1, eventHour, eventHour + 1] },
          bars: { expectedIncrease: 60, peakHours: [eventHour - 1, eventHour, eventHour + 1, eventHour + 2] },
          hotels: { expectedIncrease: 25, peakHours: [eventHour - 2, eventHour - 1] },
          retail: { expectedIncrease: 30, peakHours: [eventHour - 1, eventHour + 2, eventHour + 3] }
        },
        calculatedAt: new Date().toISOString()
      };

      footfallPredictionTotal.inc({ event_type: event.sport });
      logger.info('Footfall prediction generated', { eventId, predictedCrowd: expectedAttendance });

      return prediction;
    } catch (error) {
      logger.error('Failed to predict footfall', { eventId, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'aggregate', collection: 'sports_events' }, (Date.now() - startTime) / 1000);
    }
  }

  async getEventPerformance(eventId: string): Promise<{
    event: any;
    analytics: ISportsAnalyticsDocument | null;
    comparison: {
      avgImpressions: number;
      avgTicketSales: number;
      percentile: number;
    };
  }> {
    const startTime = Date.now();

    try {
      const [event, analytics] = await Promise.all([
        SportsEventModel.findById(eventId).lean(),
        SportsAnalyticsModel.findOne({ eventId: new mongoose.Types.ObjectId(eventId) }).lean()
      ]);

      if (!event) {
        throw new Error('Event not found');
      }

      // Calculate average metrics for comparison
      const avgMetrics = await SportsAnalyticsModel.aggregate([
        { $group: {
          _id: null,
          avgImpressions: { $avg: '$impressions' },
          avgTicketSales: { $avg: '$ticketSales' }
        }}
      ]);

      const avg = avgMetrics[0] || { avgImpressions: 0, avgTicketSales: 0 };
      const percentile = analytics
        ? Math.min(100, Math.floor((analytics.impressions / (avg.avgImpressions || 1)) * 100))
        : 0;

      return {
        event,
        analytics: analytics as ISportsAnalyticsDocument | null,
        comparison: {
          avgImpressions: avg.avgImpressions,
          avgTicketSales: avg.avgTicketSales,
          percentile
        }
      };
    } catch (error) {
      logger.error('Failed to get event performance', { eventId, error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'aggregate', collection: 'sports_analytics' }, (Date.now() - startTime) / 1000);
    }
  }

  async getTopPerformingEvents(sport?: string, limit: number = 10): Promise<any[]> {
    const startTime = Date.now();

    try {
      const matchStage = sport ? { sport } : {};

      const events = await SportsAnalyticsModel.aggregate([
        { $lookup: {
          from: 'sports_events',
          localField: 'eventId',
          foreignField: '_id',
          as: 'event'
        }},
        { $unwind: '$event' },
        { $match: matchStage },
        { $sort: { impressions: -1 } },
        { $limit: limit },
        { $project: {
          eventId: 1,
          impressions: 1,
          ticketSales: 1,
          viewership: 1,
          adRevenue: 1,
          'event.name': 1,
          'event.sport': 1,
          'event.startDate': 1,
          'event.venue.city': 1
        }}
      ]);

      return events;
    } catch (error) {
      logger.error('Failed to get top performing events', { error });
      throw error;
    } finally {
      dbQueryDuration.observe({ operation: 'aggregate', collection: 'sports_analytics' }, (Date.now() - startTime) / 1000);
    }
  }
}

export const analyticsService = new AnalyticsService();