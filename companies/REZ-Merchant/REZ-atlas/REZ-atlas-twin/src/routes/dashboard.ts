/**
 * REZ Atlas Twin - Dashboard Routes
 */

import { Router, Request, Response } from 'express';
import { MerchantTwinModel } from '../models/merchant.js';

const router = Router();

// ============================================================================
// DASHBOARD - Acquisition
// ============================================================================

/**
 * GET /api/dashboard/acquisition
 * Acquisition dashboard
 */
router.get('/api/dashboard/acquisition', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, territoryId } = req.query;

    // Mock data - in production would filter by date range and territory
    const totalMerchants = await MerchantTwinModel.countDocuments();
    const newThisMonth = Math.floor(totalMerchants * 0.1); // Mock 10% new
    const qualifiedLeads = Math.floor(totalMerchants * 0.3); // Mock 30% qualified
    const converted = Math.floor(totalMerchants * 0.15); // Mock 15% converted

    // Funnel data
    const funnel = {
      discovered: totalMerchants,
      contacted: Math.floor(totalMerchants * 0.6),
      qualified: qualifiedLeads,
      proposal: Math.floor(qualifiedLeads * 0.5),
      negotiation: Math.floor(qualifiedLeads * 0.3),
      converted
    };

    // Conversion rate
    const conversionRate = totalMerchants > 0 ? (converted / totalMerchants * 100).toFixed(1) : '0';

    res.json({
      summary: {
        totalMerchants,
        newThisMonth,
        qualifiedLeads,
        converted,
        conversionRate: `${conversionRate}%`
      },
      funnel,
      trend: [
        { month: 'Jan', new: 45, converted: 8 },
        { month: 'Feb', new: 52, converted: 12 },
        { month: 'Mar', new: 48, converted: 10 },
        { month: 'Apr', new: 61, converted: 15 },
        { month: 'May', new: 55, converted: 14 },
        { month: 'Jun', new: 70, converted: 18 }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get acquisition dashboard' });
  }
});

// ============================================================================
// DASHBOARD - Merchant Health
// ============================================================================

/**
 * GET /api/dashboard/health
 * Merchant health dashboard
 */
router.get('/api/dashboard/health', async (req: Request, res: Response) => {
  try {
    const twins = await MerchantTwinModel.find().select('merchantId twinScore status');

    // Calculate health distribution
    const health = {
      healthy: twins.filter(t => t.twinScore.overall >= 70).length,
      atRisk: twins.filter(t => t.twinScore.overall >= 40 && t.twinScore.overall < 70).length,
      critical: twins.filter(t => t.twinScore.overall < 40).length
    };

    // Growth vs decline
    const growing = twins.filter(t => t.twinScore.growth >= 60).length;
    const declining = twins.filter(t => t.twinScore.growth < 40).length;

    // Satisfaction (based on reputation score)
    const satisfied = twins.filter(t => t.twinScore.reputation >= 70).length;
    const dissatisfied = twins.filter(t => t.twinScore.reputation < 40).length;

    res.json({
      health,
      growth: { growing, declining },
      satisfaction: { satisfied, dissatisfied },
      total: twins.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get health dashboard' });
  }
});

// ============================================================================
// MERCHANT DASHBOARD - Individual merchant
// ============================================================================

/**
 * GET /api/merchants/:merchantId/dashboard
 * Individual merchant dashboard
 */
router.get('/api/merchants/:merchantId/dashboard', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const twin = await MerchantTwinModel.findOne({ merchantId })
      .populate('identity')
      .populate('presence')
      .populate('reputation')
      .populate('operations')
      .populate('growth');

    if (!twin) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Build dashboard data
    const dashboard = {
      merchantId,
      overview: {
        name: twin.identity?.name || 'Unknown',
        category: twin.identity?.category || 'Unknown',
        twinScore: twin.twinScore.overall,
        lastSynced: twin.lastSynced
      },
      metrics: {
        identity: {
          score: twin.twinScore.identity,
          complete: twin.identity ? true : false
        },
        presence: {
          score: twin.twinScore.presence,
          hasWebsite: twin.presence?.website ? true : false,
          hasSocial: twin.presence?.social ? true : false
        },
        reputation: {
          score: twin.twinScore.reputation,
          rating: twin.reputation?.rating?.overall || 0,
          reviews: twin.reputation?.rating?.count || 0
        },
        operations: {
          score: twin.twinScore.operations,
          hasPOS: twin.operations?.tech?.hasPOS || false,
          hasQR: twin.operations?.tech?.hasQR || false
        },
        growth: {
          score: twin.twinScore.growth,
          trend: twin.growth?.reviewVelocity?.trend || 'unknown'
        }
      },
      alerts: [
        // Would generate alerts based on conditions
        // e.g., "Response rate below 50%", "No new reviews in 30 days"
      ],
      recommendations: [
        // AI-generated recommendations based on twin analysis
      ]
    };

    res.json({ dashboard });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get merchant dashboard' });
  }
});

// ============================================================================
// KPI TRENDS
// ============================================================================

/**
 * GET /api/merchants/:merchantId/kpi-trends
 */
router.get('/api/merchants/:merchantId/kpi-trends', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { kpis = 'revenue,orders,customers', days = 30 } = req.query;

    const kpiList = (kpis as string).split(',');

    // Generate mock trend data
    const trends: Record<string, any[]> = {};

    for (const kpi of kpiList) {
      const data = [];
      for (let i = Number(days); i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Generate realistic mock data
        const baseValue = Math.random() * 100 + 50;
        const variance = Math.random() * 20 - 10;

        data.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(baseValue + variance)
        });
      }
      trends[kpi] = data;
    }

    res.json({ trends });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get KPI trends' });
  }
});

// ============================================================================
// COMPARE
// ============================================================================

/**
 * GET /api/merchants/:merchantId/compare
 */
router.get('/api/merchants/:merchantId/compare', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { competitors } = req.query;

    const competitorIds = competitors ? (competitors as string).split(',') : [];

    // Get all merchants
    const allIds = [merchantId, ...competitorIds];
    const twins = await MerchantTwinModel.find({
      merchantId: { $in: allIds }
    }).populate('identity');

    // Build comparison
    const comparison = twins.map(twin => ({
      merchantId: twin.merchantId,
      name: twin.identity?.name || twin.merchantId,
      category: twin.identity?.category,
      score: twin.twinScore.overall,
      components: twin.twinScore
    }));

    // Sort by score
    comparison.sort((a, b) => b.score - a.score);

    res.json({ comparison });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compare merchants' });
  }
});

export { router as dashboardRoutes };