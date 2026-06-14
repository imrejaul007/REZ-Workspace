/**
 * Restaurant Copilot Routes
 * Restaurant-specific endpoints for Merchant Copilot
 */

import { Router, Request, Response } from 'express';
import { restaurantHealthScorer } from '../services/restaurantHealthScorer';
import { restaurantRecommendationEngine } from '../services/restaurantRecommendationEngine';

const router = Router();

/**
 * GET /api/restaurant/:merchantId/profile
 * Get restaurant profile with health score
 */
router.get('/:merchantId/profile', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const [healthScore, recommendations] = await Promise.all([
      restaurantHealthScorer.calculateHealthScore(merchantId),
      restaurantRecommendationEngine.generateRecommendations(
        merchantId,
        await restaurantHealthScorer.getRestaurantMetrics(merchantId)
      ),
    ]);

    res.json({
      success: true,
      data: {
        merchantId,
        healthScore,
        topRecommendations: recommendations.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('[RestaurantCopilot] Profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get restaurant profile' });
  }
});

/**
 * GET /api/restaurant/:merchantId/health-score
 */
router.get('/:merchantId/health-score', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const healthScore = await restaurantHealthScorer.calculateHealthScore(merchantId);
    res.json({ success: true, data: healthScore });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get health score' });
  }
});

/**
 * GET /api/restaurant/:merchantId/metrics
 */
router.get('/:merchantId/metrics', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const metrics = await restaurantHealthScorer.getRestaurantMetrics(merchantId);
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get metrics' });
  }
});

/**
 * GET /api/restaurant/:merchantId/recommendations
 */
router.get('/:merchantId/recommendations', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { type, limit } = req.query;

    const metrics = await restaurantHealthScorer.getRestaurantMetrics(merchantId);
    let recommendations = await restaurantRecommendationEngine.generateRecommendations(merchantId, metrics);

    if (type) {
      recommendations = recommendations.filter(r => r.type === type);
    }
    if (limit) {
      recommendations = recommendations.slice(0, Number(limit));
    }

    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get recommendations' });
  }
});

/**
 * GET /api/restaurant/:merchantId/insights
 */
router.get('/:merchantId/insights', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const [healthScore, metrics, recommendations] = await Promise.all([
      restaurantHealthScorer.calculateHealthScore(merchantId),
      restaurantHealthScorer.getRestaurantMetrics(merchantId),
      restaurantRecommendationEngine.generateRecommendations(merchantId, await restaurantHealthScorer.getRestaurantMetrics(merchantId)),
    ]);

    const insights = [];

    // Trend
    if (healthScore.trend === 'improving') {
      insights.push({
        type: 'positive',
        title: 'Growing!',
        description: `Orders up ${Math.round(((metrics.orders.thisWeek - metrics.orders.lastWeek) / metrics.orders.lastWeek) * 100)}% this week`,
      });
    }

    // Table utilization
    if (metrics.tables.turnoverRate < 2.5) {
      insights.push({
        type: 'warning',
        title: 'Low Table Turnover',
        description: `${metrics.tables.turnoverRate}x turnover. Target: 3.5x`,
      });
    }

    // Top opportunity
    if (recommendations[0]) {
      insights.push({
        type: 'opportunity',
        title: 'Quick Win',
        description: recommendations[0].description,
      });
    }

    res.json({
      success: true,
      data: {
        healthScore: healthScore.overall,
        trend: healthScore.trend,
        insights,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get insights' });
  }
});

export default router;
