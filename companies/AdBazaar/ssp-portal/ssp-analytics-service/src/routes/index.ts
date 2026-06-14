import { Router, Request, Response, NextFunction } from 'express';
import { AnalyticsEvent, IAnalyticsEvent, EventType } from '../models/index.js';
import { validateEventInput, validateBatchEventsInput, validateDateRangeQuery } from '../validators/index.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

const router = Router();

// Generate unique event ID
const generateEventId = (): string => {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

// POST /events - Track a single event
router.post('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = validateEventInput(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validation.error.errors,
        timestamp: new Date().toISOString()
      });
    }

    const event = new AnalyticsEvent({
      eventId: generateEventId(),
      ...validation.data,
      timestamp: validation.data.timestamp ? new Date(validation.data.timestamp) : new Date()
    });

    await event.save();

    logger.info('Event tracked', {
      eventId: event.eventId,
      eventType: event.eventType,
      screenId: event.screenId
    });

    res.status(201).json({
      success: true,
      data: {
        eventId: event.eventId,
        eventType: event.eventType,
        screenId: event.screenId,
        timestamp: event.timestamp
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// POST /events/batch - Track multiple events
router.post('/events/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = validateBatchEventsInput(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validation.error.errors,
        timestamp: new Date().toISOString()
      });
    }

    const events = validation.data.events.map((eventData) => ({
      eventId: generateEventId(),
      ...eventData,
      timestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date()
    }));

    const insertedEvents = await AnalyticsEvent.insertMany(events, { ordered: false });

    logger.info('Batch events tracked', {
      count: insertedEvents.length
    });

    res.status(201).json({
      success: true,
      data: {
        count: insertedEvents.length,
        eventIds: insertedEvents.map((e) => e.eventId)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// GET /events - List events with filtering
router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      screenId,
      advertiserId,
      campaignId,
      eventType,
      startDate,
      endDate,
      page = '1',
      limit = '50'
    } = req.query;

    const query: Record<string, unknown> = {};

    if (screenId) query.screenId = screenId;
    if (advertiserId) query.advertiserId = advertiserId;
    if (campaignId) query.campaignId = campaignId;
    if (eventType) query.eventType = eventType;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) (query.timestamp as Record<string, Date>).$gte = new Date(startDate as string);
      if (endDate) (query.timestamp as Record<string, Date>).$lte = new Date(endDate as string);
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      AnalyticsEvent.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AnalyticsEvent.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// GET /stats/overview - Get overview statistics
router.get('/stats/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const [eventCounts, screenStats, campaignStats] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        { $group: { _id: '$eventType', count: { $sum: 1 } } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        { $group: { _id: '$screenId', eventCount: { $sum: 1 } } },
        { $sort: { eventCount: -1 } },
        { $limit: 10 }
      ]),
      AnalyticsEvent.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        { $group: { _id: '$campaignId', eventCount: { $sum: 1 } } },
        { $sort: { eventCount: -1 } },
        { $limit: 10 }
      ])
    ]);

    const eventTotals: Record<string, number> = {};
    let totalEvents = 0;
    eventCounts.forEach((e) => {
      eventTotals[e._id] = e.count;
      totalEvents += e.count;
    });

    res.status(200).json({
      success: true,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        totals: {
          impressions: eventTotals.impression || 0,
          views: eventTotals.view || 0,
          clicks: eventTotals.click || 0,
          engagements: eventTotals.engagement || 0,
          total: totalEvents
        },
        rates: {
          viewRate: eventTotals.impression > 0 ? ((eventTotals.view || 0) / eventTotals.impression) * 100 : 0,
          clickRate: eventTotals.impression > 0 ? ((eventTotals.click || 0) / eventTotals.impression) * 100 : 0,
          engagementRate: eventTotals.impression > 0 ? ((eventTotals.engagement || 0) / eventTotals.impression) * 100 : 0
        },
        topScreens: screenStats.map((s) => ({ screenId: s._id, eventCount: s.eventCount })),
        topCampaigns: campaignStats.map((c) => ({ campaignId: c._id, eventCount: c.eventCount }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// GET /stats/screen/:screenId - Get screen analytics
router.get('/stats/screen/:screenId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { screenId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const match = {
      screenId,
      timestamp: { $gte: start, $lte: end }
    };

    const [eventCounts, dailyStats, campaignBreakdown] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: '$eventType', count: { $sum: 1 } } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: '$campaignId', eventCount: { $sum: 1 } } },
        { $sort: { eventCount: -1 } },
        { $limit: 10 }
      ])
    ]);

    const eventTotals: Record<string, number> = {};
    eventCounts.forEach((e) => {
      eventTotals[e._id] = e.count;
    });

    res.status(200).json({
      success: true,
      data: {
        screenId,
        period: { start: start.toISOString(), end: end.toISOString() },
        totals: {
          impressions: eventTotals.impression || 0,
          views: eventTotals.view || 0,
          clicks: eventTotals.click || 0,
          engagements: eventTotals.engagement || 0
        },
        rates: {
          viewRate: eventTotals.impression > 0 ? ((eventTotals.view || 0) / eventTotals.impression) * 100 : 0,
          clickRate: eventTotals.impression > 0 ? ((eventTotals.click || 0) / eventTotals.impression) * 100 : 0,
          engagementRate: eventTotals.impression > 0 ? ((eventTotals.engagement || 0) / eventTotals.impression) * 100 : 0
        },
        dailyTrend: dailyStats.map((d) => ({ date: d._id, count: d.count })),
        topCampaigns: campaignBreakdown.map((c) => ({ campaignId: c._id, eventCount: c.eventCount }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// GET /stats/campaign/:campaignId - Get campaign analytics
router.get('/stats/campaign/:campaignId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const match = {
      campaignId,
      timestamp: { $gte: start, $lte: end }
    };

    const [eventCounts, dailyStats, screenBreakdown, creativeBreakdown] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: '$eventType', count: { $sum: 1 } } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: '$screenId', eventCount: { $sum: 1 } } },
        { $sort: { eventCount: -1 } },
        { $limit: 20 }
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: '$creativeId', eventCount: { $sum: 1 } } },
        { $sort: { eventCount: -1 } },
        { $limit: 10 }
      ])
    ]);

    const eventTotals: Record<string, number> = {};
    eventCounts.forEach((e) => {
      eventTotals[e._id] = e.count;
    });

    res.status(200).json({
      success: true,
      data: {
        campaignId,
        period: { start: start.toISOString(), end: end.toISOString() },
        totals: {
          impressions: eventTotals.impression || 0,
          views: eventTotals.view || 0,
          clicks: eventTotals.click || 0,
          engagements: eventTotals.engagement || 0
        },
        rates: {
          viewRate: eventTotals.impression > 0 ? ((eventTotals.view || 0) / eventTotals.impression) * 100 : 0,
          clickRate: eventTotals.impression > 0 ? ((eventTotals.click || 0) / eventTotals.impression) * 100 : 0,
          engagementRate: eventTotals.impression > 0 ? ((eventTotals.engagement || 0) / eventTotals.impression) * 100 : 0
        },
        dailyTrend: dailyStats.map((d) => ({ date: d._id, count: d.count })),
        topScreens: screenBreakdown.map((s) => ({ screenId: s._id, eventCount: s.eventCount })),
        topCreatives: creativeBreakdown.map((c) => ({ creativeId: c._id, eventCount: c.eventCount }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// GET /stats/advertiser/:advertiserId - Get advertiser analytics
router.get('/stats/advertiser/:advertiserId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { advertiserId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const match = {
      advertiserId,
      timestamp: { $gte: start, $lte: end }
    };

    const [eventCounts, campaignStats, dailyStats] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: '$eventType', count: { $sum: 1 } } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: '$campaignId', eventCount: { $sum: 1 } } },
        { $sort: { eventCount: -1 } },
        { $limit: 20 }
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const eventTotals: Record<string, number> = {};
    eventCounts.forEach((e) => {
      eventTotals[e._id] = e.count;
    });

    res.status(200).json({
      success: true,
      data: {
        advertiserId,
        period: { start: start.toISOString(), end: end.toISOString() },
        totals: {
          impressions: eventTotals.impression || 0,
          views: eventTotals.view || 0,
          clicks: eventTotals.click || 0,
          engagements: eventTotals.engagement || 0
        },
        rates: {
          viewRate: eventTotals.impression > 0 ? ((eventTotals.view || 0) / eventTotals.impression) * 100 : 0,
          clickRate: eventTotals.impression > 0 ? ((eventTotals.click || 0) / eventTotals.impression) * 100 : 0,
          engagementRate: eventTotals.impression > 0 ? ((eventTotals.engagement || 0) / eventTotals.impression) * 100 : 0
        },
        campaigns: campaignStats.map((c) => ({ campaignId: c._id, eventCount: c.eventCount })),
        dailyTrend: dailyStats.map((d) => ({ date: d._id, count: d.count }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// GET /stats/impressions/daily - Get daily impressions
router.get('/stats/impressions/daily', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    let dateFormat: string;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00';
        break;
      case 'week':
        dateFormat = '%Y-W%V';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const stats = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: '$timestamp' } },
            eventType: '$eventType'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          impressions: {
            $sum: { $cond: [{ $eq: ['$_id.eventType', 'impression'] }, '$count', 0] }
          },
          views: {
            $sum: { $cond: [{ $eq: ['$_id.eventType', 'view'] }, '$count', 0] }
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$_id.eventType', 'click'] }, '$count', 0] }
          },
          engagements: {
            $sum: { $cond: [{ $eq: ['$_id.eventType', 'engagement'] }, '$count', 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalImpressions = stats.reduce((sum, s) => sum + s.impressions, 0);
    const totalViews = stats.reduce((sum, s) => sum + s.views, 0);
    const totalClicks = stats.reduce((sum, s) => sum + s.clicks, 0);
    const totalEngagements = stats.reduce((sum, s) => sum + s.engagements, 0);

    res.status(200).json({
      success: true,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        groupBy,
        dailyData: stats.map((s) => ({
          date: s._id,
          impressions: s.impressions,
          views: s.views,
          clicks: s.clicks,
          engagements: s.engagements
        })),
        totals: {
          impressions: totalImpressions,
          views: totalViews,
          clicks: totalClicks,
          engagements: totalEngagements
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// GET /stats/engagement/rate - Get engagement rates
router.get('/stats/engagement/rate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, screenId, campaignId } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const match: Record<string, unknown> = {
      timestamp: { $gte: start, $lte: end }
    };

    if (screenId) match.screenId = screenId;
    if (campaignId) match.campaignId = campaignId;

    const engagementData = await AnalyticsEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            screenId: '$screenId',
            eventType: '$eventType'
          },
          count: { $sum: 1 },
          avgViewTime: { $avg: '$metadata.viewTime' },
          avgDuration: { $avg: '$metadata.duration' },
          avgEngagementScore: { $avg: '$metadata.engagementScore' }
        }
      }
    ]);

    // Calculate rates per screen
    const screenRates: Record<string, {
      impressions: number;
      views: number;
      clicks: number;
      engagements: number;
      viewRate: number;
      clickRate: number;
      engagementRate: number;
      avgViewTime: number;
      avgEngagementScore: number;
    }> = {};

    engagementData.forEach((e) => {
      const screenId = e._id.screenId;
      if (!screenRates[screenId]) {
        screenRates[screenId] = {
          impressions: 0,
          views: 0,
          clicks: 0,
          engagements: 0,
          viewRate: 0,
          clickRate: 0,
          engagementRate: 0,
          avgViewTime: 0,
          avgEngagementScore: 0
        };
      }

      switch (e._id.eventType) {
        case 'impression':
          screenRates[screenId].impressions = e.count;
          break;
        case 'view':
          screenRates[screenId].views = e.count;
          screenRates[screenId].avgViewTime = e.avgViewTime || 0;
          break;
        case 'click':
          screenRates[screenId].clicks = e.count;
          break;
        case 'engagement':
          screenRates[screenId].engagements = e.count;
          screenRates[screenId].avgEngagementScore = e.avgEngagementScore || 0;
          break;
      }
    });

    // Calculate rates
    Object.keys(screenRates).forEach((screenId) => {
      const sr = screenRates[screenId];
      sr.viewRate = sr.impressions > 0 ? (sr.views / sr.impressions) * 100 : 0;
      sr.clickRate = sr.impressions > 0 ? (sr.clicks / sr.impressions) * 100 : 0;
      sr.engagementRate = sr.impressions > 0 ? (sr.engagements / sr.impressions) * 100 : 0;
    });

    // Calculate overall rates
    const totalImpressions = Object.values(screenRates).reduce((sum, s) => sum + s.impressions, 0);
    const totalViews = Object.values(screenRates).reduce((sum, s) => sum + s.views, 0);
    const totalClicks = Object.values(screenRates).reduce((sum, s) => sum + s.clicks, 0);
    const totalEngagements = Object.values(screenRates).reduce((sum, s) => sum + s.engagements, 0);

    res.status(200).json({
      success: true,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        filters: { screenId, campaignId },
        overall: {
          totalImpressions,
          totalViews,
          totalClicks,
          totalEngagements,
          viewRate: totalImpressions > 0 ? (totalViews / totalImpressions) * 100 : 0,
          clickRate: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
          engagementRate: totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0
        },
        byScreen: Object.entries(screenRates).map(([screenId, rates]) => ({
          screenId,
          ...rates
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// GET /stats/performance - Get performance metrics
router.get('/stats/performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, advertiserId, campaignId } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const match: Record<string, unknown> = {
      timestamp: { $gte: start, $lte: end }
    };

    if (advertiserId) match.advertiserId = advertiserId;
    if (campaignId) match.campaignId = campaignId;

    const [eventCounts, hourlyBreakdown, venueBreakdown] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: '$eventType', count: { $sum: 1 } } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $hour: '$timestamp' },
            impressions: { $sum: { $cond: [{ $eq: ['$eventType', 'impression'] }, 1, 0] } },
            engagements: { $sum: { $cond: [{ $eq: ['$eventType', 'engagement'] }, 1, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...match, 'metadata.contextData.venueType': { $exists: true } } },
        { $group: { _id: '$metadata.contextData.venueType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const eventTotals: Record<string, number> = {};
    eventCounts.forEach((e) => {
      eventTotals[e._id] = e.count;
    });

    const totalImpressions = eventTotals.impression || 0;
    const totalEngagements = eventTotals.engagement || 0;

    res.status(200).json({
      success: true,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        filters: { advertiserId, campaignId },
        summary: {
          totalImpressions,
          totalViews: eventTotals.view || 0,
          totalClicks: eventTotals.click || 0,
          totalEngagements,
          overallEngagementRate: totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0
        },
        hourlyPerformance: hourlyBreakdown.map((h) => ({
          hour: h._id,
          impressions: h.impressions,
          engagements: h.engagements,
          engagementRate: h.impressions > 0 ? (h.engagements / h.impressions) * 100 : 0
        })),
        venuePerformance: venueBreakdown.map((v) => ({
          venueType: v._id,
          count: v.count
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /events/cleanup - Cleanup old events
router.delete('/events/cleanup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { olderThanDays = '90' } = req.query;

    const days = parseInt(olderThanDays as string, 10);
    if (isNaN(days) || days < 1) {
      return res.status(400).json({
        error: 'Invalid parameter',
        message: 'olderThanDays must be a positive number',
        timestamp: new Date().toISOString()
      });
    }

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await AnalyticsEvent.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    logger.info('Events cleanup completed', {
      deletedCount: result.deletedCount,
      olderThanDays: days,
      cutoffDate: cutoffDate.toISOString()
    });

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        olderThanDays: days,
        cutoffDate: cutoffDate.toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export { router as analyticsRoutes };
export default router;