import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  yieldService,
  optimizationService,
  forecastService,
  backtestService,
  recommendationService
} from '../services';
import logger from '../utils/logger';
import { validateRequest } from '../middleware/auth';

const router = Router();

// Request validation schemas
const yieldSummarySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  inventoryType: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional()
});

const optimizeSchema = z.object({
  inventoryType: z.string().optional(),
  objective: z.enum(['revenue', 'ecpm', 'fill_rate', 'balanced']),
  constraints: z.object({
    minFillRate: z.number().min(0).max(100).optional(),
    maxFloorPrice: z.number().min(0).optional(),
    minFloorPrice: z.number().min(0).optional()
  }).optional(),
  lookbackDays: z.number().min(1).max(90).optional()
});

const forecastSchema = z.object({
  horizon: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  inventoryType: z.string().optional()
});

const backtestSchema = z.object({
  strategyId: z.string().optional(),
  strategyConfig: z.object({
    name: z.string(),
    type: z.string(),
    rules: z.array(z.any()).optional(),
    floorPrice: z.number().optional(),
    priority: z.number().optional()
  }).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  inventoryType: z.string().optional(),
  compareWith: z.array(z.string()).optional()
});

const recommendationsSchema = z.object({
  inventoryType: z.string().optional(),
  demandSource: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional()
});

/**
 * GET /api/yield/summary
 * Get yield summary for a date range
 */
router.get('/summary', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  logger.info('GET /api/yield/summary', { requestId, query: req.query });

  try {
    const params = yieldSummarySchema.parse(req.query);
    const result = await yieldService.getYieldSummary({
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      inventoryType: params.inventoryType,
      groupBy: params.groupBy
    });

    res.json({
      success: true,
      requestId,
      data: result
    });
  } catch (error) {
    logger.error('Failed to get yield summary', { error, requestId });
    res.status(500).json({
      success: false,
      requestId,
      error: 'Failed to get yield summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/yield/inventory
 * Get inventory yield analysis
 */
router.get('/inventory', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  logger.info('GET /api/yield/inventory', { requestId, query: req.query });

  try {
    const inventoryType = req.query.inventoryType as string | undefined;
    const result = await yieldService.getInventoryAnalysis(inventoryType);

    res.json({
      success: true,
      requestId,
      data: result
    });
  } catch (error) {
    logger.error('Failed to get inventory analysis', { error, requestId });
    res.status(500).json({
      success: false,
      requestId,
      error: 'Failed to get inventory analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/yield/optimize
 * Optimize yield strategies
 */
router.post('/optimize', validateRequest(optimizeSchema), async (req: Request, res: Response) => {
  const requestId = uuidv4();
  logger.info('POST /api/yield/optimize', { requestId, body: req.body });

  try {
    const result = await optimizationService.optimize(req.body);

    res.json({
      success: true,
      requestId,
      data: result
    });
  } catch (error) {
    logger.error('Failed to optimize yield', { error, requestId });
    res.status(500).json({
      success: false,
      requestId,
      error: 'Failed to optimize yield',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/yield/recommendations
 * Get yield recommendations
 */
router.get('/recommendations', validateRequest(recommendationsSchema), async (req: Request, res: Response) => {
  const requestId = uuidv4();
  logger.info('GET /api/yield/recommendations', { requestId, query: req.query });

  try {
    const params = recommendationsSchema.parse(req.query);
    const result = await recommendationService.getRecommendations({
      inventoryType: params.inventoryType,
      demandSource: params.demandSource,
      limit: params.limit,
      priority: params.priority
    });

    res.json({
      success: true,
      requestId,
      data: result
    });
  } catch (error) {
    logger.error('Failed to get recommendations', { error, requestId });
    res.status(500).json({
      success: false,
      requestId,
      error: 'Failed to get recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/yield/recommendations/:id/apply
 * Apply a recommendation
 */
router.post('/recommendations/:id/apply', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const { id } = req.params;
  const appliedBy = req.headers['x-applied-by'] as string || 'system';

  logger.info('POST /api/yield/recommendations/:id/apply', { requestId, id, appliedBy });

  try {
    const result = await recommendationService.applyRecommendation(id, appliedBy);

    res.json({
      success: true,
      requestId,
      data: result
    });
  } catch (error) {
    logger.error('Failed to apply recommendation', { error, requestId, id });
    res.status(500).json({
      success: false,
      requestId,
      error: 'Failed to apply recommendation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/yield/trends
 * Get yield trends over time
 */
router.get('/trends', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  logger.info('GET /api/yield/trends', { requestId, query: req.query });

  try {
    const days = parseInt(req.query.days as string) || 30;
    const inventoryType = req.query.inventoryType as string | undefined;

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const result = await yieldService.getYieldSummary({
      startDate,
      endDate,
      inventoryType
    });

    // Calculate trends over different periods
    const trends = {
      daily: result.trends,
      weekly: result.trends,
      monthly: result.trends,
      comparison: result.comparison
    };

    res.json({
      success: true,
      requestId,
      data: trends
    });
  } catch (error) {
    logger.error('Failed to get trends', { error, requestId });
    res.status(500).json({
      success: false,
      requestId,
      error: 'Failed to get trends',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/yield/forecast
 * Get yield forecast
 */
router.get('/forecast', validateRequest(forecastSchema), async (req: Request, res: Response) => {
  const requestId = uuidv4();
  logger.info('GET /api/yield/forecast', { requestId, query: req.query });

  try {
    const params = forecastSchema.parse(req.query);
    const result = await forecastService.forecast({
      horizon: params.horizon,
      startDate: new Date(params.startDate),
      endDate: new Date(params.endDate),
      inventoryType: params.inventoryType
    });

    res.json({
      success: true,
      requestId,
      data: result
    });
  } catch (error) {
    logger.error('Failed to get forecast', { error, requestId });
    res.status(500).json({
      success: false,
      requestId,
      error: 'Failed to get forecast',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/yield/compare
 * Compare yield strategies
 */
router.get('/compare', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  logger.info('GET /api/yield/compare', { requestId, query: req.query });

  try {
    const strategyIds = (req.query.strategyIds as string)?.split(',') || [];

    if (strategyIds.length < 2) {
      res.status(400).json({
        success: false,
        requestId,
        error: 'At least 2 strategy IDs are required for comparison'
      });
      return;
    }

    // Get yield analysis for each strategy
    const comparisons = await Promise.all(
      strategyIds.map(async (id) => {
        const analysis = await yieldService.getYieldSummary({});
        return {
          strategyId: id,
          metrics: analysis.current
        };
      })
    );

    // Determine best strategy
    const best = comparisons.reduce((prev, current) =>
      current.metrics.ecpm > prev.metrics.ecpm ? current : prev
    );

    res.json({
      success: true,
      requestId,
      data: {
        strategies: comparisons,
        bestStrategy: best.strategyId,
        bestMetrics: best.metrics
      }
    });
  } catch (error) {
    logger.error('Failed to compare strategies', { error, requestId });
    res.status(500).json({
      success: false,
      requestId,
      error: 'Failed to compare strategies',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/yield/backtest
 * Backtest yield strategies
 */
router.post('/backtest', validateRequest(backtestSchema), async (req: Request, res: Response) => {
  const requestId = uuidv4();
  logger.info('POST /api/yield/backtest', { requestId, body: req.body });

  try {
    const result = await backtestService.backtest({
      strategyId: req.body.strategyId,
      strategyConfig: req.body.strategyConfig,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      inventoryType: req.body.inventoryType,
      compareWith: req.body.compareWith
    });

    res.json({
      success: true,
      requestId,
      data: result
    });
  } catch (error) {
    logger.error('Failed to run backtest', { error, requestId });
    res.status(500).json({
      success: false,
      requestId,
      error: 'Failed to run backtest',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/yield/dashboard
 * Get yield dashboard data
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  logger.info('GET /api/yield/dashboard', { requestId });

  try {
    // Get multiple data points for dashboard
    const [summary, inventory, recommendations] = await Promise.all([
      yieldService.getYieldSummary({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      }),
      yieldService.getInventoryAnalysis(),
      recommendationService.getRecommendations({ limit: 10 })
    ]);

    // Get forecast for next 7 days
    const forecast = await forecastService.forecast({
      horizon: 'daily',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    const dashboard = {
      summary: {
        revenue: summary.current.revenue,
        ecpm: summary.current.ecpm,
        fillRate: summary.current.fillRate,
        impressions: summary.current.impressions,
        trends: summary.trends
      },
      inventory: inventory,
      recommendations: {
        total: recommendations.summary.total,
        pending: recommendations.summary.byPriority.high + recommendations.summary.byPriority.critical,
        byPriority: recommendations.summary.byPriority
      },
      forecast: {
        next7Days: {
          predictedRevenue: forecast.summary.totalPredictedRevenue,
          avgEcpm: forecast.summary.avgPredictedEcpm,
          confidence: forecast.forecasts[0]?.confidence.overall || 0
        }
      },
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      requestId,
      data: dashboard
    });
  } catch (error) {
    logger.error('Failed to get dashboard data', { error, requestId });
    res.status(500).json({
      success: false,
      requestId,
      error: 'Failed to get dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;