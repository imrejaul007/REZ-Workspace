import { Router, Request, Response } from 'express';
import {
  revenueAnalysisService,
  marginAnalysisService,
  productAnalysisService,
  customerAnalysisService,
  competitorAnalysisService,
  demandForecastingService,
  recommendationsEngineService,
} from '../services/index.js';
import {
  validateMerchantId,
  validateInsightsQuery,
  asyncHandler,
} from '../middleware/index.js';
import logger from '../config/logger.js';

const router = Router();

/**
 * GET /api/merchant/:merchantId/insights
 * Get full merchant insights including all analysis
 */
router.get(
  '/:merchantId/insights',
  validateMerchantId,
  validateInsightsQuery,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId } = req.params;
    const period = req.query.period as 'week' | 'month' | 'quarter' | 'year' || 'month';

    logger.info('Generating full merchant insights', { merchantId, period });

    try {
      // Get all analysis data in parallel
      const [revenue, margin, products, customers, competitors, demand, recommendations] =
        await Promise.all([
          revenueAnalysisService.getRevenueAnalysis(merchantId, period),
          marginAnalysisService.getMarginAnalysis(merchantId, period),
          productAnalysisService.getProductAnalysis(merchantId, period),
          customerAnalysisService.getCustomerCohortAnalysis(merchantId, period),
          competitorAnalysisService.getCompetitorAnalysis(merchantId),
          demandForecastingService.getDemandAnalysis(merchantId, period),
          recommendationsEngineService.getRecommendations(merchantId),
        ]);

      // Calculate health score
      const healthScore = calculateHealthScore(revenue, margin, customers);

      const duration = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          merchantId,
          generatedAt: new Date().toISOString(),
          summary: {
            healthScore,
            trend: determineTrend(revenue, margin),
            keyMetrics: {
              revenue: revenue.totalRevenue,
              orders: revenue.totalOrders,
              customers: customers.totalCustomers,
              avgOrderValue: revenue.averageOrderValue,
            },
          },
          revenue,
          margin,
          products,
          customers,
          competitors,
          demand,
          recommendations,
        },
        meta: {
          timestamp: new Date().toISOString(),
          duration,
        },
      });
    } catch (error) {
      logger.error('Error generating merchant insights', { merchantId, error });
      throw error;
    }
  })
);

/**
 * GET /api/merchant/:merchantId/revenue
 * Get revenue analysis for a merchant
 */
router.get(
  '/:merchantId/revenue',
  validateMerchantId,
  validateInsightsQuery,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId } = req.params;
    const period = req.query.period as 'week' | 'month' | 'quarter' | 'year' || 'month';

    logger.info('Getting revenue analysis', { merchantId, period });

    const revenue = await revenueAnalysisService.getRevenueAnalysis(merchantId, period);

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: revenue,
      meta: {
        timestamp: new Date().toISOString(),
        duration,
      },
    });
  })
);

/**
 * GET /api/merchant/:merchantId/margin
 * Get margin analysis for a merchant
 */
router.get(
  '/:merchantId/margin',
  validateMerchantId,
  validateInsightsQuery,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId } = req.params;
    const period = req.query.period as 'week' | 'month' | 'quarter' | 'year' || 'month';

    logger.info('Getting margin analysis', { merchantId, period });

    const margin = await marginAnalysisService.getMarginAnalysis(merchantId, period);

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: margin,
      meta: {
        timestamp: new Date().toISOString(),
        duration,
      },
    });
  })
);

/**
 * GET /api/merchant/:merchantId/products
 * Get product performance analysis
 */
router.get(
  '/:merchantId/products',
  validateMerchantId,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId } = req.params;
    const period = (req.query.period as 'week' | 'month' | 'quarter' | 'year') || 'month';
    const sortBy = (req.query.sortBy as 'revenue' | 'units' | 'margin' | 'growth') || 'revenue';
    const limit = parseInt(req.query.limit as string) || 20;

    logger.info('Getting product analysis', { merchantId, period, sortBy, limit });

    const products = await productAnalysisService.getProductAnalysis(merchantId, period, sortBy, limit);

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: products,
      meta: {
        timestamp: new Date().toISOString(),
        duration,
      },
    });
  })
);

/**
 * GET /api/merchant/:merchantId/customers
 * Get customer cohort analysis
 */
router.get(
  '/:merchantId/customers',
  validateMerchantId,
  validateInsightsQuery,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId } = req.params;
    const period = req.query.period as 'week' | 'month' | 'quarter' | 'year' || 'month';

    logger.info('Getting customer analysis', { merchantId, period });

    const customers = await customerAnalysisService.getCustomerCohortAnalysis(merchantId, period);

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: customers,
      meta: {
        timestamp: new Date().toISOString(),
        duration,
      },
    });
  })
);

/**
 * GET /api/merchant/:merchantId/competitors
 * Get competitor analysis
 */
router.get(
  '/:merchantId/competitors',
  validateMerchantId,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId } = req.params;
    const radius = parseInt(req.query.radius as string) || 5;
    const limit = parseInt(req.query.limit as string) || 10;

    logger.info('Getting competitor analysis', { merchantId, radius, limit });

    const competitors = await competitorAnalysisService.getCompetitorAnalysis(merchantId, radius, limit);

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: competitors,
      meta: {
        timestamp: new Date().toISOString(),
        duration,
      },
    });
  })
);

/**
 * GET /api/merchant/:merchantId/demand
 * Get demand forecasting analysis
 */
router.get(
  '/:merchantId/demand',
  validateMerchantId,
  validateInsightsQuery,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId } = req.params;
    const period = req.query.period as 'week' | 'month' | 'quarter' | 'year' || 'month';

    logger.info('Getting demand analysis', { merchantId, period });

    const demand = await demandForecastingService.getDemandAnalysis(merchantId, period);

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: demand,
      meta: {
        timestamp: new Date().toISOString(),
        duration,
      },
    });
  })
);

/**
 * GET /api/merchant/:merchantId/recommendations
 * Get actionable recommendations
 */
router.get(
  '/:merchantId/recommendations',
  validateMerchantId,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId } = req.params;
    const category = (req.query.category as 'all' | 'revenue' | 'marketing' | 'inventory' | 'pricing' | 'customer') || 'all';
    const priority = (req.query.priority as 'all' | 'critical' | 'high' | 'medium' | 'low') || 'all';

    logger.info('Getting recommendations', { merchantId, category, priority });

    const recommendations = await recommendationsEngineService.getRecommendations(merchantId, category, priority);

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: recommendations,
      meta: {
        timestamp: new Date().toISOString(),
        duration,
      },
    });
  })
);

// Helper functions
function calculateHealthScore(
  revenue: any,
  margin: any,
  customers: any
): number {
  let score = 50; // Base score

  // Revenue growth contribution (0-20 points)
  if (revenue.revenueGrowth > 0) {
    score += Math.min(20, revenue.revenueGrowth);
  } else {
    score += Math.max(-20, revenue.revenueGrowth);
  }

  // Margin contribution (0-20 points)
  if (margin.netMargin > 20) {
    score += 20;
  } else if (margin.netMargin > 10) {
    score += 10;
  } else if (margin.netMargin > 0) {
    score += 5;
  } else {
    score -= 10;
  }

  // Customer retention contribution (0-10 points)
  score += Math.min(10, customers.retentionRate / 10);

  return Math.max(0, Math.min(100, Math.round(score)));
}

function determineTrend(revenue: any, margin: any): 'improving' | 'stable' | 'declining' {
  const revenueTrend = revenue.trend;
  const marginTrend = margin.marginTrend;

  if (revenueTrend === 'up' && marginTrend === 'improving') {
    return 'improving';
  }
  if (revenueTrend === 'down' || marginTrend === 'declining') {
    return 'declining';
  }
  return 'stable';
}

export default router;