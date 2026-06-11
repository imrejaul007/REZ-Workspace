/**
 * PROPFLOW - Real Estate AI Operating System
 * Analytics Routes
 */

import { Router, Request, Response } from 'express';
import { Property, Lead, SiteVisit, Deal } from '../models';
import { logger } from '../config/logger';
import { authenticate, asyncHandler } from '../middleware';

const router = Router();

/**
 * GET /api/analytics/dashboard
 * Get comprehensive dashboard analytics
 */
router.get(
  '/dashboard',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Property stats
    const [
      propertyStats,
      leadStats,
      visitStats,
      dealStats,
      recentLeads,
      recentDeals,
      monthlyVisits,
      leadSourceDistribution,
      propertyTypeDistribution
    ] = await Promise.all([
      // Property stats
      Promise.all([
        Property.countDocuments({ isActive: true }),
        Property.countDocuments({ status: 'available', isActive: true }),
        Property.countDocuments({ status: 'sold', isActive: true }),
        Property.countDocuments({ createdAt: { $gte: startOfMonth } })
      ]).then(([total, available, sold, newThisMonth]) => ({
        total, available, sold, newThisMonth
      })),

      // Lead stats
      Promise.all([
        Lead.countDocuments(),
        Lead.countDocuments({ scoreTier: 'hot' }),
        Lead.countDocuments({ scoreTier: 'warm' }),
        Lead.countDocuments({ scoreTier: 'cold' }),
        Lead.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Lead.countDocuments({ status: 'closed-won' })
      ]).then(([total, hot, warm, cold, newThisMonth, converted]) => ({
        total, hot, warm, cold, newThisMonth, converted,
        conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : '0'
      })),

      // Visit stats
      Promise.all([
        SiteVisit.countDocuments({ date: { $gte: startOfMonth } }),
        SiteVisit.countDocuments({ date: { $gte: startOfMonth }, status: 'completed' }),
        SiteVisit.countDocuments({ date: { $gte: startOfMonth }, status: 'cancelled' }),
        SiteVisit.countDocuments({ date: { $gte: thirtyDaysAgo } })
      ]).then(([total, completed, cancelled, last30days]) => ({
        total, completed, cancelled, last30days,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0'
      })),

      // Deal stats
      Promise.all([
        Deal.countDocuments(),
        Deal.countDocuments({ stage: { $nin: ['closed'] } }),
        Deal.countDocuments({ stage: 'closed' }),
        Deal.aggregate([
          { $match: { stage: { $nin: ['closed'] } } },
          { $group: { _id: null, total: { $sum: '$offerPrice' } } }
        ]),
        Deal.aggregate([
          { $match: { stage: 'closed', closedAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$offerPrice' }, count: { $sum: 1 }, commission: { $sum: '$commission' } } }
        ])
      ]).then(([total, active, closed, pipelineResult, closedResult]) => ({
        total,
        active,
        closed,
        pipelineValue: pipelineResult[0]?.total || 0,
        closedValue: closedResult[0]?.total || 0,
        closedCount: closedResult[0]?.count || 0,
        totalCommission: closedResult[0]?.commission || 0
      })),

      // Recent leads (last 7 days)
      Lead.find({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name phone source score status')
        .lean(),

      // Recent deals
      Deal.find()
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('propertyId', 'title')
        .populate('leadId', 'name')
        .select('offerPrice stage probability')
        .lean(),

      // Monthly visits trend
      SiteVisit.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: '$date' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Lead source distribution
      Lead.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Property type distribution
      Property.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$type', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
        { $sort: { count: -1 } }
      ])
    ]);

    // Calculate key metrics
    const metrics = {
      leadConversionRate: leadStats.conversionRate + '%',
      visitCompletionRate: visitStats.completionRate + '%',
      avgDealProbability: dealStats.active > 0
        ? Math.round(await Deal.find({ stage: { $nin: ['closed'] } }).select('probability').then(d => d.reduce((s, d) => s + d.probability, 0) / (d.length || 1)))
        : 0,
      dealsPerVisit: visitStats.completed > 0
        ? ((dealStats.closed / visitStats.completed) * 100).toFixed(1) + '%'
        : '0%'
    };

    // Pipeline summary
    const pipelineByStage = await Deal.aggregate([
      { $match: { stage: { $nin: ['closed'] } } },
      { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$offerPrice' } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      dashboard: {
        overview: {
          properties: propertyStats,
          leads: leadStats,
          visits: visitStats,
          deals: dealStats
        },
        metrics,
        pipeline: pipelineByStage.map(p => ({
          stage: p._id,
          count: p.count,
          value: p.value
        })),
        leadSourceDistribution: leadSourceDistribution.map(d => ({
          source: d._id,
          count: d.count
        })),
        propertyTypeDistribution: propertyTypeDistribution.map(d => ({
          type: d._id,
          count: d.count,
          avgPrice: Math.round(d.avgPrice)
        })),
        monthlyVisits: monthlyVisits.map(v => ({
          day: v._id,
          count: v.count
        })),
        recentActivity: {
          leads: recentLeads,
          deals: recentDeals.map(d => ({
            _id: d._id,
            property: (d.propertyId as any)?.title,
            lead: (d.leadId as any)?.name,
            value: d.offerPrice,
            stage: d.stage,
            probability: d.probability
          }))
        }
      },
      generatedAt: new Date().toISOString()
    });
  })
);

/**
 * GET /api/analytics/properties
 * Property analytics
 */
router.get(
  '/properties',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const [
      totalByStatus,
      totalByType,
      avgPrices,
      topLocalities,
      priceRanges
    ] = await Promise.all([
      Property.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Property.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$type', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
        { $sort: { count: -1 } }
      ]),
      Property.aggregate([
        { $match: { status: 'available', isActive: true } },
        { $group: { _id: '$type', avgPrice: { $avg: '$price' } } }
      ]),
      Property.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$location.locality', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Property.aggregate([
        { $match: { isActive: true } },
        {
          $bucket: {
            groupBy: '$price',
            boundaries: [0, 2000000, 5000000, 10000000, 20000000, 50000000, Infinity],
            default: 'other',
            output: { count: { $sum: 1 } }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      analytics: {
        byStatus: totalByStatus,
        byType: totalByType,
        avgPrices,
        topLocalities,
        priceRanges: priceRanges.map(r => ({
          range: r._id,
          count: r.count
        }))
      }
    });
  })
);

/**
 * GET /api/analytics/leads
 * Lead analytics
 */
router.get(
  '/leads',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      byStatus,
      bySource,
      byTier,
      trend,
      followUpDue
    ] = await Promise.all([
      Lead.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Lead.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Lead.aggregate([
        { $group: { _id: '$scoreTier', count: { $sum: 1 }, avgScore: { $avg: '$score' } } }
      ]),
      Lead.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Lead.countDocuments({
        nextFollowUp: { $lte: new Date() },
        status: { $nin: ['closed-won', 'closed-lost'] }
      })
    ]);

    res.json({
      success: true,
      analytics: {
        byStatus,
        bySource,
        byTier,
        trend: trend.map(t => ({ date: t._id, count: t.count })),
        followUpDue
      }
    });
  })
);

/**
 * GET /api/analytics/deals
 * Deal analytics
 */
router.get(
  '/deals',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const startOfQuarter = new Date();
    startOfQuarter.setMonth(Math.floor(startOfQuarter.getMonth() / 3) * 3, 1);

    const [
      byStage,
      byAgent,
      valueDistribution,
      trend,
      avgDealSize
    ] = await Promise.all([
      Deal.aggregate([
        { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$offerPrice' } } }
      ]),
      Deal.aggregate([
        { $match: { stage: { $nin: ['closed'] } } },
        { $group: { _id: '$agentId', count: { $sum: 1 }, value: { $sum: '$offerPrice' } } },
        { $sort: { value: -1 } },
        { $limit: 10 }
      ]),
      Deal.aggregate([
        { $match: { stage: 'closed' } },
        {
          $bucket: {
            groupBy: '$offerPrice',
            boundaries: [0, 2000000, 5000000, 10000000, 20000000, 50000000, Infinity],
            default: 'other',
            output: { count: { $sum: 1 } }
          }
        }
      ]),
      Deal.aggregate([
        { $match: { createdAt: { $gte: startOfQuarter } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
            value: { $sum: '$offerPrice' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Deal.aggregate([
        { $match: { stage: 'closed', closedAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: null, avg: { $avg: '$offerPrice' }, total: { $sum: '$offerPrice' }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      analytics: {
        byStage,
        byAgent,
        valueDistribution: valueDistribution.map(v => ({ range: v._id, count: v.count })),
        trend: trend.map(t => ({ month: t._id, count: t.count, value: t.value })),
        avgDealSize: avgDealSize[0] ? {
          average: Math.round(avgDealSize[0].avg),
          totalValue: avgDealSize[0].total,
          count: avgDealSize[0].count
        } : null
      }
    });
  })
);

/**
 * GET /api/analytics/performance
 * Agent performance analytics
 */
router.get(
  '/performance',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Agent performance
    const agentPerformance = await Deal.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: {
        _id: '$agentId',
        totalDeals: { $sum: 1 },
        activeDeals: { $sum: { $cond: [{ $ne: ['$stage', 'closed'] }, 1, 0] } },
        closedDeals: { $sum: { $cond: [{ $eq: ['$stage', 'closed'] }, 1, 0] } },
        pipelineValue: { $sum: { $cond: [{ $ne: ['$stage', 'closed'] }, '$offerPrice', 0] } },
        closedValue: { $sum: { $cond: [{ $eq: ['$stage', 'closed'] }, '$offerPrice', 0] } },
        commission: { $sum: { $cond: [{ $eq: ['$stage', 'closed'] }, '$commission', 0] } }
      }},
      { $sort: { closedValue: -1 } }
    ]);

    // Visit stats by agent
    const visitByAgent = await SiteVisit.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: {
        _id: '$agentId',
        totalVisits: { $sum: 1 },
        completedVisits: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelledVisits: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        avgRating: { $avg: '$rating' }
      }}
    ]);

    // Lead stats by agent
    const leadsByAgent = await Lead.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: {
        _id: '$assignedAgentId',
        totalLeads: { $sum: 1 },
        qualifiedLeads: { $sum: { $cond: [{ $in: ['$status', ['qualified', 'visiting', 'negotiating', 'closed-won']] }, 1, 0] } },
        convertedLeads: { $sum: { $cond: [{ $eq: ['$status', 'closed-won'] }, 1, 0] } },
        avgLeadScore: { $avg: '$score' }
      }}
    ]);

    res.json({
      success: true,
      period: {
        start: startOfMonth.toISOString(),
        end: new Date().toISOString()
      },
      agentPerformance,
      visitsByAgent: visitByAgent.map(v => ({
        agentId: v._id,
        ...v,
        avgRating: v.avgRating ? Math.round(v.avgRating * 10) / 10 : null
      })),
      leadsByAgent
    });
  })
);

export default router;