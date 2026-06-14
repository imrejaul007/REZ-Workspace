import { v4 as uuidv4 } from 'uuid';
import { Heatmap, IHeatmap } from '../models/Heatmap';
import { Event, IEvent } from '../models/Event';
import { Analytics, IAnalytics } from '../models/Analytics';
import { Segment, ISegment } from '../models/Segment';
import { logger } from 'utils/logger.js';
import { recordEvent, updateViewsGauge } from '../utils/metrics';

export interface TrackEventInput {
  contentId: string;
  contentType: string;
  sessionId: string;
  userId?: string;
  eventType: 'view' | 'click' | 'scroll' | 'share' | 'download' | 'comment' | 'like' | 'save';
  eventData?: {
    element?: string;
    position?: { x: number; y: number };
    scrollDepth?: number;
    referrer?: string;
    device?: string;
    browser?: string;
    os?: string;
    country?: string;
    region?: string;
    duration?: number;
    metadata?: Record<string, any>;
  };
}

export class HeatmapService {
  async trackEvent(input: TrackEventInput): Promise<IEvent> {
    try {
      const eventId = `evt-${uuidv4()}`;
      const event = new Event({
        eventId,
        contentId: input.contentId,
        contentType: input.contentType,
        sessionId: input.sessionId,
        userId: input.userId,
        eventType: input.eventType,
        eventData: input.eventData || {},
        timestamp: new Date()
      });

      await event.save();
      await this.updateHeatmap(input);

      recordEvent(input.eventType);

      logger.info('Event tracked', { eventId, contentId: input.contentId, eventType: input.eventType });
      return event;
    } catch (error) {
      logger.error('Failed to track event', { error, input });
      throw error;
    }
  }

  private async updateHeatmap(input: TrackEventInput): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const update: any = {};
    if (input.eventType === 'view') {
      update.views = 1;
      if (input.eventData?.device) {
        update[`deviceBreakdown.${input.eventData.device}`] = 1;
      }
    } else if (input.eventType === 'click' && input.eventData?.position) {
      update.clickMap = { element: input.eventData.element || 'unknown', clicks: 1, position: input.eventData.position };
    }

    if (input.eventData?.country) {
      update.locationBreakdown = { country: input.eventData.country, views: input.eventType === 'view' ? 1 : 0 };
    }

    await Heatmap.findOneAndUpdate(
      { contentId: input.contentId, date: today },
      {
        $setOnInsert: {
          heatmapId: `hm-${uuidv4()}`,
          contentId: input.contentId,
          contentType: input.contentType,
          date: today
        },
        $inc: update
      },
      { upsert: true, new: true }
    );
  }

  async getHeatmap(contentId: string, date?: Date): Promise<IHeatmap | null> {
    try {
      const query: any = { contentId };
      if (date) {
        query.date = date;
      } else {
        query.date = { $gte: new Date(new Date().setHours(0, 0, 0, 0)) };
      }
      return await Heatmap.findOne(query).sort({ date: -1 });
    } catch (error) {
      logger.error('Failed to get heatmap', { error, contentId });
      throw error;
    }
  }

  async getHeatmapRange(contentId: string, startDate: Date, endDate: Date): Promise<IHeatmap[]> {
    try {
      return await Heatmap.find({
        contentId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });
    } catch (error) {
      logger.error('Failed to get heatmap range', { error, contentId });
      throw error;
    }
  }

  async getAnalytics(contentId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly', startDate: Date, endDate: Date): Promise<IAnalytics | null> {
    try {
      return await Analytics.findOne({
        contentId,
        period,
        startDate: { $gte: startDate },
        endDate: { $lte: endDate }
      }).sort({ startDate: -1 });
    } catch (error) {
      logger.error('Failed to get analytics', { error, contentId });
      throw error;
    }
  }

  async calculateAnalytics(contentId: string, contentType: string, startDate: Date, endDate: Date): Promise<IAnalytics> {
    try {
      const events = await Event.aggregate([
        { $match: { contentId, timestamp: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
            uniqueSessions: { $addToSet: '$sessionId' }
          }
        }
      ]);

      const metrics: any = { impressions: 0, views: 0, shares: 0, comments: 0, likes: 0, saves: 0, clicks: 0 };
      const uniqueSessions = new Set<string>();

      events.forEach(e => {
        if (e._id === 'view') {
          metrics.views = e.count;
          e.uniqueSessions.forEach((s: string) => uniqueSessions.add(s));
        } else {
          metrics[e._id] = (metrics[e._id] || 0) + e.count;
        }
      });

      metrics.uniqueViews = uniqueSessions.size;
      metrics.engagementRate = metrics.views > 0 ? ((metrics.shares + metrics.comments + metrics.likes) / metrics.views) * 100 : 0;

      const analyticsId = `an-${uuidv4()}`;
      const analytics = new Analytics({
        analyticsId,
        contentId,
        contentType,
        period: 'daily',
        startDate,
        endDate,
        metrics,
        calculatedAt: new Date()
      });

      await analytics.save();
      return analytics;
    } catch (error) {
      logger.error('Failed to calculate analytics', { error, contentId });
      throw error;
    }
  }

  async getDashboard(): Promise<any> {
    try {
      const [topContent, recentEvents, engagementStats] = await Promise.all([
        Heatmap.aggregate([
          { $sort: { views: -1 } },
          { $limit: 10 },
          { $project: { contentId: 1, contentType: 1, views: 1, engagementScore: 1 } }
        ]),
        Event.aggregate([
          { $sort: { timestamp: -1 } },
          { $limit: 100 },
          { $group: { _id: '$eventType', count: { $sum: 1 } } }
        ]),
        Analytics.aggregate([
          { $group: { _id: null, avgEngagement: { $avg: '$metrics.engagementRate' }, totalViews: { $sum: '$metrics.views' } } }
        ])
      ]);

      return { topContent, recentEvents, engagementStats: engagementStats[0] || { avgEngagement: 0, totalViews: 0 } };
    } catch (error) {
      logger.error('Failed to get dashboard data', { error });
      throw error;
    }
  }
}

export const heatmapService = new HeatmapService();