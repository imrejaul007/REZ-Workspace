/**
 * Salon Copilot Routes
 * Salon-specific endpoints for Merchant Copilot
 */

import { Router, Request, Response } from 'express';
import { salonHealthScorer, SalonHealthScore, SalonMetrics } from '../services/salonHealthScorer';
import { salonRecommendationEngine, SalonRecommendation } from '../services/salonRecommendationEngine';

const router = Router();

/**
 * GET /api/salon/:merchantId/profile
 * Get complete salon profile with health score
 */
router.get('/:merchantId/profile', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const [healthScore, recommendations] = await Promise.all([
      salonHealthScorer.calculateHealthScore(merchantId),
      salonRecommendationEngine.generateRecommendations(
        merchantId,
        await salonHealthScorer.getSalonMetrics(merchantId)
      ),
    ]);

    res.json({
      success: true,
      data: {
        merchantId,
        healthScore,
        topRecommendations: recommendations.slice(0, 5),
        alerts: healthScore.overall < 70 ? healthScore : null,
      },
    });
  } catch (error) {
    console.error('[SalonCopilot] Profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get salon profile' });
  }
});

/**
 * GET /api/salon/:merchantId/health-score
 * Get detailed salon health score breakdown
 */
router.get('/:merchantId/health-score', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const healthScore = await salonHealthScorer.calculateHealthScore(merchantId);

    res.json({
      success: true,
      data: healthScore,
    });
  } catch (error) {
    console.error('[SalonCopilot] Health score error:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate health score' });
  }
});

/**
 * GET /api/salon/:merchantId/metrics
 * Get salon metrics
 */
router.get('/:merchantId/metrics', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const metrics = await salonHealthScorer.getSalonMetrics(merchantId);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('[SalonCopilot] Metrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to get metrics' });
  }
});

/**
 * GET /api/salon/:merchantId/recommendations
 * Get AI recommendations for salon improvement
 */
router.get('/:merchantId/recommendations', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { type, limit } = req.query;

    const metrics = await salonHealthScorer.getSalonMetrics(merchantId);
    let recommendations = await salonRecommendationEngine.generateRecommendations(merchantId, metrics);

    // Filter by type if specified
    if (type) {
      recommendations = recommendations.filter(r => r.type === type);
    }

    // Limit results
    if (limit) {
      recommendations = recommendations.slice(0, Number(limit));
    }

    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
        segments: {
          marketing: recommendations.filter(r => r.type === 'marketing').length,
          pricing: recommendations.filter(r => r.type === 'pricing').length,
          operations: recommendations.filter(r => r.type === 'operations').length,
          customer: recommendations.filter(r => r.type === 'customer').length,
          inventory: recommendations.filter(r => r.type === 'inventory').length,
        },
      },
    });
  } catch (error) {
    console.error('[SalonCopilot] Recommendations error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
});

/**
 * GET /api/salon/:merchantId/campaigns
 * Get marketing campaign recommendations
 */
router.get('/:merchantId/campaigns', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const metrics = await salonHealthScorer.getSalonMetrics(merchantId);
    const recommendations = await salonRecommendationEngine.generateRecommendations(merchantId, metrics);

    const campaigns = recommendations
      .filter(r => r.type === 'marketing')
      .map(rec => ({
        id: rec.id,
        title: rec.title,
        type: rec.category,
        message: rec.template,
        variables: rec.variables,
        impact: rec.impact,
        segment: rec.variables?.segment || 'all_customers',
      }));

    res.json({
      success: true,
      data: {
        campaigns,
        count: campaigns.length,
      },
    });
  } catch (error) {
    console.error('[SalonCopilot] Campaigns error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate campaigns' });
  }
});

/**
 * GET /api/salon/:merchantId/staff-performance
 * Get staff performance metrics
 */
router.get('/:merchantId/staff-performance', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const metrics = await salonHealthScorer.getSalonMetrics(merchantId);

    res.json({
      success: true,
      data: {
        staffCount: metrics.staff.activeStaff,
        avgBookingsPerStylist: metrics.staff.avgBookingsPerStylist,
        topPerformer: metrics.staff.topPerformer,
        commissionTotal: metrics.staff.commissionTotal,
        alerts: [
          {
            type: metrics.staff.avgBookingsPerStylist < 4 ? 'warning' : 'info',
            message: metrics.staff.avgBookingsPerStylist < 4
              ? 'Average bookings per stylist is below target'
              : 'Staff utilization is healthy',
          },
        ],
      },
    });
  } catch (error) {
    console.error('[SalonCopilot] Staff performance error:', error);
    res.status(500).json({ success: false, error: 'Failed to get staff performance' });
  }
});

/**
 * GET /api/salon/:merchantId/insights
 * Get AI-generated insights
 */
router.get('/:merchantId/insights', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const [healthScore, metrics, recommendations] = await Promise.all([
      salonHealthScorer.calculateHealthScore(merchantId),
      salonHealthScorer.getSalonMetrics(merchantId),
      salonRecommendationEngine.generateRecommendations(merchantId, await salonHealthScorer.getSalonMetrics(merchantId)),
    ]);

    // Generate insights based on data
    const insights: unknown[] = [];

    // Calculate percentage change
    const thisWeek = metrics.appointments.thisWeek;
    const lastWeek = metrics.appointments.lastWeek;
    const pctChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;

    // Trend insight
    if (healthScore.trend === 'improving') {
      insights.push({
        type: 'positive',
        title: 'Growing Strong!',
        description: `Bookings up ${Math.abs(pctChange)}% this week`,
      });
    } else if (healthScore.trend === 'declining') {
      insights.push({
        type: 'warning',
        title: 'Bookings Declining',
        description: `Down ${Math.abs(pctChange)}% this week. Consider promotions.`,
      });
    }

    // Utilization insight
    if (metrics.utilization.chairUtilizationRate < 60) {
      insights.push({
        type: 'warning',
        title: 'Empty Chairs = Lost Revenue',
        description: `${100 - metrics.utilization.chairUtilizationRate}% of your time slots are empty. Offer off-peak discounts.`,
      });
    }

    // No-show insight
    if (metrics.customers.noShowRate > 10) {
      insights.push({
        type: 'warning',
        title: 'No-Shows Costing You',
        description: `${metrics.customers.noShowRate}% no-show rate. Send WhatsApp reminders to reduce this.`,
      });
    }

    // Top opportunity
    const topRec = recommendations[0];
    if (topRec) {
      insights.push({
        type: 'opportunity',
        title: 'Quick Win',
        description: topRec.description,
        action: topRec.title,
      });
    }

    res.json({
      success: true,
      data: {
        healthScore: healthScore.overall,
        trend: healthScore.trend,
        insights,
        benchmarks: healthScore.industryBenchmarks,
      },
    });
  } catch (error) {
    console.error('[SalonCopilot] Insights error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate insights' });
  }
});

export default router;
