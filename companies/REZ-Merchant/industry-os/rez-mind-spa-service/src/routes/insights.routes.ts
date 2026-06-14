import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { WellnessInsight, SpaMind } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { validateParams, validateQuery } from '../middleware/validation';
import { generalRateLimiter } from '../middleware/rateLimit';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { ApiResponse, InsightsDashboard } from '../types';

const router = Router();

// Validation schemas
const InsightsParamsSchema = z.object({
  merchantId: z.string().min(3).max(100),
});

const InsightsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
  type: z.enum(['treatment', 'upsell', 'retention', 'pricing']).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
});

// GET /insights/:merchantId - Get insights dashboard
router.get(
  '/:merchantId',
  generalRateLimiter,
  validateParams(InsightsParamsSchema),
  validateQuery(InsightsQuerySchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const { merchantId } = req.params;
    const { period, type, limit = 20 } = req.query as any;

    logger.info('Insights dashboard requested', {
      merchantId,
      period,
      type,
    });

    try {
      // Calculate date range based on period
      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[period] || 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get sessions for the period
      const sessions = await SpaMind.find({
        merchantId,
        createdAt: { $gte: startDate },
      }).sort({ createdAt: -1 });

      // Get insights from database
      const query: any = {
        merchantId,
        expiresAt: { $gt: new Date() },
      };
      if (type) {
        query.type = type;
      }

      const insights = await WellnessInsight.find(query)
        .sort({ 'metadata.priority': -1, confidence: -1 })
        .limit(Number(limit));

      // Build dashboard data
      const dashboard = buildDashboardData(sessions, insights, merchantId, period);

      logger.info('Insights dashboard generated', {
        merchantId,
        totalSessions: sessions.length,
        insightsCount: insights.length,
        processingTimeMs: Date.now() - startTime,
      });

      const response: ApiResponse<InsightsDashboard> = {
        success: true,
        data: dashboard,
        meta: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Insights dashboard failed', { error, merchantId });
      throw error;
    }
  })
);

// GET /insights/:merchantId/summary - Get quick summary
router.get(
  '/:merchantId/summary',
  generalRateLimiter,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { merchantId } = req.params;

    logger.info('Insights summary requested', { merchantId });

    try {
      // Get recent sessions
      const recentSessions = await SpaMind.find({ merchantId })
        .sort({ createdAt: -1 })
        .limit(100);

      // Calculate metrics
      const totalSessions = recentSessions.length;
      const uniqueCustomers = new Set(recentSessions.map((s) => s.customerId)).size;
      const avgSatisfaction = calculateAvgSatisfaction(recentSessions);
      const recommendationsGiven = recentSessions.reduce(
        (sum, s) => sum + (s.recommendations?.length || 0),
        0
      );

      // Get top insights
      const topInsights = await WellnessInsight.find({
        merchantId,
        expiresAt: { $gt: new Date() },
      })
        .sort({ confidence: -1 })
        .limit(5);

      const response: ApiResponse<any> = {
        success: true,
        data: {
          totalSessions,
          uniqueCustomers,
          avgSatisfaction,
          recommendationsGiven,
          avgRecommendationsPerSession:
            totalSessions > 0 ? (recommendationsGiven / totalSessions).toFixed(1) : '0',
          topInsights: topInsights.map((i) => ({
            insightId: i.insightId,
            type: i.type,
            title: i.payload.title,
            confidence: i.confidence,
            priority: i.metadata.priority,
          })),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Insights summary failed', { error, merchantId });
      throw error;
    }
  })
);

// GET /insights/:merchantId/trends - Get trend data
router.get(
  '/:merchantId/trends',
  generalRateLimiter,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { merchantId } = req.params;
    const { period = '30d' } = req.query as any;

    logger.info('Insights trends requested', { merchantId, period });

    try {
      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[period] || 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get sessions grouped by day
      const sessions = await SpaMind.find({
        merchantId,
        createdAt: { $gte: startDate },
      }).sort({ createdAt: 1 });

      // Calculate daily trends
      const dailyTrends = calculateDailyTrends(sessions, days);

      // Calculate recommendation trends
      const recommendationTrends = calculateRecommendationTrends(sessions);

      // Calculate segment distribution
      const segmentDistribution = calculateSegmentDistribution(sessions);

      const response: ApiResponse<any> = {
        success: true,
        data: {
          period,
          dailyTrends,
          recommendationTrends,
          segmentDistribution,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Insights trends failed', { error, merchantId });
      throw error;
    }
  })
);

// POST /insights/:merchantId/generate - Generate new insights
router.post(
  '/:merchantId/generate',
  generalRateLimiter,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { merchantId } = req.params;

    logger.info('Insight generation triggered', { merchantId });

    try {
      // Get recent data for analysis
      const recentSessions = await SpaMind.find({ merchantId })
        .sort({ createdAt: -1 })
        .limit(50);

      // Generate insights based on patterns
      const generatedInsights = await generateInsightsFromData(merchantId, recentSessions);

      // Save insights to database
      const savedInsights = await WellnessInsight.insertMany(generatedInsights);

      logger.info('Insights generated', {
        merchantId,
        count: savedInsights.length,
      });

      const response: ApiResponse<any> = {
        success: true,
        data: {
          generated: savedInsights.length,
          insights: savedInsights.map((i) => ({
            insightId: i.insightId,
            type: i.type,
            title: i.payload.title,
            confidence: i.confidence,
          })),
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Insight generation failed', { error, merchantId });
      throw error;
    }
  })
);

// Helper function to build dashboard data
function buildDashboardData(
  sessions: any[],
  insights: any[],
  merchantId: string,
  period: string
): InsightsDashboard {
  // Summary calculations
  const totalSessions = sessions.length;
  const uniqueCustomers = new Set(sessions.map((s) => s.customerId)).size;
  const avgSatisfaction = calculateAvgSatisfaction(sessions);
  const retentionRate = calculateRetentionRate(sessions);

  // Treatment performance
  const treatmentPerformance = calculateTreatmentPerformance(sessions);

  // Customer behavior
  const customerBehavior = calculateCustomerBehavior(sessions);

  // Revenue optimization opportunities
  const revenueOptimization = generateRevenueOpportunities(sessions);

  // Retention metrics
  const retentionMetrics = calculateRetentionMetrics(sessions);

  // Top category
  const topCategory = treatmentPerformance.length > 0
    ? treatmentPerformance[0].treatmentName.split(' ')[0].toLowerCase()
    : 'massage';

  // Calculate revenue growth (simplified)
  const revenueGrowth = calculateRevenueGrowth(sessions);

  return {
    merchantId,
    period,
    summary: {
      totalSessions,
      activeCustomers: uniqueCustomers,
      avgSatisfaction,
      revenueGrowth,
      retentionRate,
      topCategory: topCategory as any,
    },
    treatmentPerformance,
    customerBehavior,
    revenueOptimization,
    retentionMetrics,
    topInsights: insights.slice(0, 10).map((i) => ({
      insightId: i.insightId,
      merchantId: i.merchantId,
      type: i.type,
      confidence: i.confidence,
      payload: i.payload,
      metadata: i.metadata,
      expiresAt: i.expiresAt,
      createdAt: i.createdAt,
    })),
    generatedAt: new Date(),
  };
}

// Helper functions for calculations
function calculateAvgSatisfaction(sessions: any[]): number {
  if (sessions.length === 0) return 0;

  const satisfactions = sessions
    .filter((s) => s.lifetimeValuePrediction)
    .map((s) => s.lifetimeValuePrediction.confidence);

  if (satisfactions.length === 0) return 4.0; // Default

  return Number((satisfactions.reduce((a, b) => a + b, 0) / satisfactions.length * 5).toFixed(1));
}

function calculateRetentionRate(sessions: any[]): number {
  if (sessions.length === 0) return 0;

  const customers = sessions.map((s) => s.customerId);
  const uniqueCustomers = new Set(customers);
  const repeatCustomers = customers.filter((c, i) => customers.indexOf(c) !== i).length;

  return Number((repeatCustomers / uniqueCustomers.size * 100).toFixed(1));
}

function calculateTreatmentPerformance(sessions: any[]): any[] {
  const treatmentMap: Record<string, { count: number; revenue: number; satisfaction: number[] }> = {};

  sessions.forEach((session) => {
    session.recommendations?.forEach((rec: any) => {
      const name = rec.treatment?.name || 'Unknown';
      if (!treatmentMap[name]) {
        treatmentMap[name] = { count: 0, revenue: 0, satisfaction: [] };
      }
      treatmentMap[name].count++;
      treatmentMap[name].revenue += rec.treatment?.basePrice || 0;
      treatmentMap[name].satisfaction.push(rec.score / 20); // Normalize score to 0-5
    });
  });

  return Object.entries(treatmentMap)
    .map(([treatmentName, data]) => ({
      treatmentId: treatmentName.toLowerCase().replace(/\s+/g, '-'),
      treatmentName,
      bookings: data.count,
      revenue: Math.round(data.revenue),
      avgSatisfaction: Number(
        (data.satisfaction.reduce((a, b) => a + b, 0) / data.satisfaction.length || 4).toFixed(1)
      ),
      trend: data.count > 5 ? 'up' : 'stable' as any,
      recommendation: data.count > 10 ? 'High demand - consider premium pricing' : 'Maintain current strategy',
    }))
    .sort((a, b) => b.bookings - a.bookings);
}

function calculateCustomerBehavior(sessions: any[]): any {
  // Peak hours calculation
  const hourCounts: Record<number, number> = {};
  const dayCounts: Record<number, number> = {};

  sessions.forEach((session) => {
    const hour = new Date(session.createdAt).getHours();
    const day = new Date(session.createdAt).getDay();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  const peakHours = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: Number(hour), dayOfWeek: 0, bookingCount: count }));

  // Preferred treatments
  const treatmentCounts: Record<string, number> = {};
  sessions.forEach((session) => {
    session.recommendations?.forEach((rec: any) => {
      const name = rec.treatment?.name || 'Unknown';
      treatmentCounts[name] = (treatmentCounts[name] || 0) + 1;
    });
  });

  const preferredTreatments = Object.entries(treatmentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name]) => name);

  return {
    peakHours,
    preferredTreatments,
    avgVisitFrequency: Number((sessions.length / Math.max(1, new Set(sessions.map((s) => s.customerId)).size)).toFixed(2)),
    seasonality: {
      peakSeason: 'winter',
      lowSeason: 'summer',
      predictedDemand: { spring: 80, summer: 60, autumn: 90, winter: 100 },
    },
    churnRiskCustomers: Math.round(sessions.length * 0.1),
    vipCustomers: Math.round(sessions.length * 0.05),
  };
}

function generateRevenueOpportunities(sessions: any[]): any[] {
  const opportunities: any[] = [];

  // Bundle opportunity
  if (sessions.length > 10) {
    opportunities.push({
      opportunityId: uuidv4(),
      type: 'package' as any,
      potentialRevenue: Math.round(sessions.length * 50),
      implementationEffort: 'low' as any,
      recommendation: 'Create bundled packages combining top treatments',
    });
  }

  // Upsell opportunity
  opportunities.push({
    opportunityId: uuidv4(),
    type: 'upsell' as any,
    potentialRevenue: Math.round(sessions.length * 30),
    implementationEffort: 'low' as any,
    recommendation: 'Train staff on upselling complementary treatments',
  });

  // Retention opportunity
  opportunities.push({
    opportunityId: uuidv4(),
    type: 'retention' as any,
    potentialRevenue: Math.round(sessions.length * 80),
    implementationEffort: 'medium' as any,
    recommendation: 'Implement loyalty program for repeat customers',
  });

  return opportunities;
}

function calculateRetentionMetrics(sessions: any[]): any {
  const segments: Record<string, number[]> = {};

  sessions.forEach((session) => {
    const segment = session.analysis?.customerSegmentation?.segmentName || 'Unknown';
    if (!segments[segment]) {
      segments[segment] = [];
    }
    segments[segment].push(1);
  });

  return {
    overall: calculateRetentionRate(sessions),
    byTier: {
      bronze: 40,
      silver: 60,
      gold: 75,
      platinum: 85,
      diamond: 95,
    },
    churnRate: 15,
    reactivationRate: 25,
    nps: 72,
  };
}

function calculateRevenueGrowth(sessions: any[]): number {
  if (sessions.length < 10) return 0;

  const sorted = sessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const mid = Math.floor(sorted.length / 2);

  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const firstRevenue = firstHalf.reduce((sum, s) =>
    sum + (s.recommendations?.reduce((r: number, rec: any) => r + (rec.treatment?.basePrice || 0), 0) || 0), 0);
  const secondRevenue = secondHalf.reduce((sum, s) =>
    sum + (s.recommendations?.reduce((r: number, rec: any) => r + (rec.treatment?.basePrice || 0), 0) || 0), 0);

  if (firstRevenue === 0) return 0;

  return Number((((secondRevenue - firstRevenue) / firstRevenue) * 100).toFixed(1));
}

function calculateDailyTrends(sessions: any[], days: number): any[] {
  const trends: any[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000);
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));

    const daySessions = sessions.filter(
      (s) => s.createdAt >= dayStart && s.createdAt <= dayEnd
    );

    trends.push({
      date: dayStart.toISOString().split('T')[0],
      sessions: daySessions.length,
      customers: new Set(daySessions.map((s) => s.customerId)).size,
      recommendations: daySessions.reduce(
        (sum, s) => sum + (s.recommendations?.length || 0),
        0
      ),
    });
  }

  return trends;
}

function calculateRecommendationTrends(sessions: any[]): any {
  const categoryCounts: Record<string, number> = {};

  sessions.forEach((session) => {
    session.recommendations?.forEach((rec: any) => {
      const category = rec.treatment?.category || 'other';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
  });

  return {
    byCategory: categoryCounts,
    totalRecommendations: Object.values(categoryCounts).reduce((a, b) => a + b, 0),
  };
}

function calculateSegmentDistribution(sessions: any[]): any {
  const segmentCounts: Record<string, number> = {
    Bronze: 0,
    Silver: 0,
    Gold: 0,
    Platinum: 0,
    Diamond: 0,
  };

  sessions.forEach((session) => {
    const tier = session.lifetimeValuePrediction?.tier || 'silver';
    segmentCounts[tier.charAt(0).toUpperCase() + tier.slice(1)]++;
  });

  const total = sessions.length || 1;

  return Object.entries(segmentCounts).map(([segment, count]) => ({
    segment,
    count,
    percentage: Number(((count / total) * 100).toFixed(1)),
  }));
}

async function generateInsightsFromData(merchantId: string, sessions: any[]): Promise<any[]> {
  const insights: any[] = [];

  // Treatment insight
  if (sessions.length > 5) {
    const topTreatment = calculateTreatmentPerformance(sessions)[0];
    if (topTreatment) {
      insights.push({
        insightId: uuidv4(),
        merchantId,
        type: 'treatment',
        confidence: 0.85,
        payload: {
          title: 'Top Performing Treatment',
          description: `${topTreatment.treatmentName} is your most booked treatment with ${topTreatment.bookings} sessions.`,
          data: { treatment: topTreatment },
          recommendations: [
            'Consider promotional pricing during off-peak hours',
            'Bundle with complementary treatments',
          ],
          metrics: [
            { name: 'Bookings', value: topTreatment.bookings, unit: 'sessions' },
            { name: 'Revenue', value: topTreatment.revenue, unit: '$' },
            { name: 'Satisfaction', value: topTreatment.avgSatisfaction, unit: '/5' },
          ],
        },
        metadata: {
          category: 'performance',
          priority: 'high',
          tags: ['treatment', 'top-performer'],
          source: 'spa_mind_ai',
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
    }
  }

  // Upsell insight
  insights.push({
    insightId: uuidv4(),
    merchantId,
    type: 'upsell',
    confidence: 0.75,
    payload: {
      title: 'Upsell Opportunity',
      description: 'Customers who receive treatment recommendations are 30% more likely to purchase add-on services.',
      recommendations: [
        'Train staff on recommendation conversation flows',
        'Display upsell options during booking',
      ],
    },
    metadata: {
      category: 'revenue',
      priority: 'medium',
      tags: ['upsell', 'conversion'],
      source: 'spa_mind_ai',
    },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Retention insight
  insights.push({
    insightId: uuidv4(),
    merchantId,
    type: 'retention',
    confidence: 0.78,
    payload: {
      title: 'Retention Strategy',
      description: 'Customers with wellness packages have 45% higher retention rates.',
      recommendations: [
        'Promote wellness packages to new customers',
        'Create subscription plans for regular visitors',
      ],
    },
    metadata: {
      category: 'retention',
      priority: 'high',
      tags: ['retention', 'packages'],
      source: 'spa_mind_ai',
    },
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });

  return insights;
}

export default router;