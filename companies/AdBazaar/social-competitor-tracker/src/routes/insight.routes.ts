import { Router, Request, Response } from 'express';
import { insightService } from '../services/insight.service.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';

const router = Router();

/**
 * GET /api/insights/best-content
 * Get best performing content across competitors
 */
router.get(
  '/best-content',
  asyncHandler(async (req: Request, res: Response) => {
    const { competitorIds, platform, days, limit, industry } = req.query;

    const bestContent = await insightService.getBestContent({
      competitorIds: competitorIds ? (competitorIds as string).split(',') : undefined,
      platform: platform as string,
      days: days ? parseInt(days as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      industry: industry as string,
    });

    res.json({
      success: true,
      data: {
        bestContent,
        count: bestContent.length,
      },
    });
  })
);

/**
 * GET /api/insights/strategy
 * Get strategy insights based on competitor analysis
 */
router.get(
  '/strategy',
  asyncHandler(async (req: Request, res: Response) => {
    const { competitorIds, industry, days } = req.query;

    const insights = await insightService.getStrategyInsights({
      competitorIds: competitorIds ? (competitorIds as string).split(',') : undefined,
      industry: industry as string,
      days: days ? parseInt(days as string, 10) : undefined,
    });

    // Group insights by category
    const groupedInsights = insights.reduce(
      (acc, insight) => {
        if (!acc[insight.category]) {
          acc[insight.category] = [];
        }
        acc[insight.category].push(insight);
        return acc;
      },
      {} as Record<string, typeof insights>
    );

    res.json({
      success: true,
      data: {
        insights,
        groupedByCategory: groupedInsights,
        summary: {
          total: insights.length,
          highPriority: insights.filter((i) => i.priority === 'high').length,
          mediumPriority: insights.filter((i) => i.priority === 'medium').length,
          lowPriority: insights.filter((i) => i.priority === 'low').length,
        },
      },
    });
  })
);

/**
 * GET /api/insights/competitor/:id
 * Get detailed competitor analysis (SWOT)
 */
router.get(
  '/competitor/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const analysis = await insightService.getCompetitorAnalysis(id);

    res.json({
      success: true,
      data: { analysis },
    });
  })
);

/**
 * GET /api/insights/trends
 * Get overall trends across all competitors
 */
router.get(
  '/trends',
  asyncHandler(async (req: Request, res: Response) => {
    const { industry, days } = req.query;
    const daysNum = days ? parseInt(days as string, 10) : 30;

    // Get overall trends from strategy insights
    const insights = await insightService.getStrategyInsights({
      industry: industry as string,
      days: daysNum,
    });

    // Filter to trends-related insights
    const trendInsights = insights.filter(
      (i) =>
        i.category === 'growth' ||
        i.category === 'engagement' ||
        i.category === 'benchmark'
    );

    res.json({
      success: true,
      data: {
        trends: trendInsights,
        period: daysNum,
        generatedAt: new Date().toISOString(),
      },
    });
  })
);

/**
 * GET /api/insights/content-analysis
 * Get content analysis across competitors
 */
router.get(
  '/content-analysis',
  asyncHandler(async (req: Request, res: Response) => {
    const { competitorIds, industry, days } = req.query;

    const insights = await insightService.getStrategyInsights({
      competitorIds: competitorIds ? (competitorIds as string).split(',') : undefined,
      industry: industry as string,
      days: days ? parseInt(days as string, 10) : undefined,
    });

    // Filter to content-related insights
    const contentInsights = insights.filter((i) => i.category === 'content');

    // Get best content
    const bestContent = await insightService.getBestContent({
      competitorIds: competitorIds ? (competitorIds as string).split(',') : undefined,
      industry: industry as string,
      days: days ? parseInt(days as string, 10) : undefined,
      limit: 10,
    });

    res.json({
      success: true,
      data: {
        contentInsights,
        bestContent,
        summary: {
          insightsCount: contentInsights.length,
          topContentCount: bestContent.length,
        },
      },
    });
  })
);

/**
 * GET /api/insights/benchmark/:industry
 * Get benchmarks for a specific industry
 */
router.get(
  '/benchmark/:industry',
  asyncHandler(async (req: Request, res: Response) => {
    const { industry } = req.params;

    const insights = await insightService.getStrategyInsights({
      industry,
      days: 30,
    });

    const benchmarkInsights = insights.filter((i) => i.category === 'benchmark');

    res.json({
      success: true,
      data: {
        industry,
        benchmarks: benchmarkInsights,
        generatedAt: new Date().toISOString(),
      },
    });
  })
);

export { router as insightRoutes };