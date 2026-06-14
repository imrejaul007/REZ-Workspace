/**
 * Analytics Routes
 *
 * Workforce analytics and insights
 */

import { Router, Request, Response } from 'express';
import { ProfessionalTwin, AccessGrant } from '../index.js';

const router = Router();

// =============================================================================
// WORKFORCE TWIN ANALYTICS (Platform Level)
// =============================================================================

router.get('/workforce', async (_req: Request, res: Response) => {
  try {
    const [totalTwins, activeTwins, byType, avgProductivity] = await Promise.all([
      ProfessionalTwin.countDocuments(),
      ProfessionalTwin.countDocuments({ status: 'ACTIVE' }),
      ProfessionalTwin.aggregate([
        { $group: { _id: '$twinType', count: { $sum: 1 } } }
      ]),
      ProfessionalTwin.aggregate([
        { $match: { status: 'ACTIVE' } },
        { $group: { _id: null, avgProductivity: { $avg: '$metrics.productivityMultiplier' } } }
      ])
    ]);

    // Get total access grants
    const [totalHires, activeHires] = await Promise.all([
      AccessGrant.countDocuments(),
      AccessGrant.countDocuments({ isActive: true })
    ]);

    res.json({
      success: true,
      data: {
        platform: {
          totalTwins,
          activeTwins,
          totalHires,
          activeHires,
          avgProductivityMultiplier: avgProductivity[0]?.avgProductivity.toFixed(2) || '1.0'
        },
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        insights: {
          totalProductivityGain: activeTwins * (avgProductivity[0]?.avgProductivity || 1),
          marketplaceActivity: `${activeHires}/${totalHires} active hires`,
          trainingProgress: `${Math.round((activeTwins / totalTwins) * 100)}% twins fully trained`
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// TWIN-SPECIFIC ANALYTICS
// =============================================================================

router.get('/:twinId', async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params;

    const twin = await ProfessionalTwin.findOne({ twinId });

    if (!twin) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Twin not found' }
      });
    }

    // Get access history
    const accessHistory = await AccessGrant.find({ twinId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Calculate growth metrics
    const growth = {
      productivityGrowth: twin.learning.totalTrainingHours > 0
        ? `${((twin.metrics.productivityMultiplier - 1) * 100).toFixed(0)}% gain`
        : 'Just started',
      scoreImprovement: twin.metrics.combinedScore > 50 ? 'Above average' : 'Building up',
      trainingProgress: `${Math.min(100, twin.learning.totalTrainingHours)}% trained`
    };

    // Estimate value
    const valueEstimate = {
      productivityValue: `${twin.metrics.productivityMultiplier}x baseline`,
      knowledgeValue: `${twin.knowledge.expertise.length} expertise areas`,
      reliabilityValue: `${twin.metrics.reliabilityScore}% reliability`
    };

    res.json({
      success: true,
      data: {
        twinId: twin.twinId,
        ownerName: twin.ownerName,
        twinType: twin.twinType,
        status: twin.status,

        metrics: twin.metrics,

        learning: {
          sources: twin.learning.sources.length,
          totalHours: twin.learning.totalTrainingHours.toFixed(1),
          lastActive: twin.learning.lastActiveAt
        },

        knowledge: {
          domains: twin.knowledge.domains,
          expertise: twin.knowledge.expertise,
          tools: twin.knowledge.tools
        },

        behavior: twin.behavior,

        growth,
        valueEstimate,

        accessHistory: accessHistory.map(a => ({
          company: a.companyName || a.companyCorpId,
          accessType: a.accessType,
          isActive: a.isActive,
          usage: a.usage
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// OWNER ANALYTICS (For employees viewing their twins)
// =============================================================================

router.get('/owner/:corpId', async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    const twins = await ProfessionalTwin.find({ ownerCorpId: corpId }).lean();

    if (twins.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No twins found for this owner' }
      });
    }

    // Calculate total value
    const totalProductivity = twins.reduce((sum, t) => sum + t.metrics.productivityMultiplier, 0);
    const avgScore = twins.reduce((sum, t) => sum + t.metrics.combinedScore, 0) / twins.length;
    const totalHours = twins.reduce((sum, t) => sum + t.learning.totalTrainingHours, 0);

    // Get all grants
    const grants = await AccessGrant.find({
      ownerCorpId: corpId,
      isActive: true
    }).lean();

    // Calculate earnings potential (simplified)
    const earningsPotential = grants.length * totalProductivity * 100; // ₹100 per productivity point

    res.json({
      success: true,
      data: {
        ownerCorpId: corpId,
        ownerName: twins[0].ownerName,
        twinCount: twins.length,

        portfolio: {
          totalProductivityMultiplier: totalProductivity.toFixed(1),
          avgCombinedScore: Math.round(avgScore),
          totalTrainingHours: Math.round(totalHours),
          companiesWithAccess: grants.length
        },

        twins: twins.map(t => ({
          twinId: t.twinId,
          twinType: t.twinType,
          status: t.status,
          metrics: t.metrics,
          productivityGain: `${((t.metrics.productivityMultiplier - 1) * 100).toFixed(0)}%`
        })),

        value: {
          productivityValue: `${totalProductivity}x baseline productivity`,
          knowledgePortfolio: twins.reduce((sum, t) => sum + t.knowledge.expertise.length, 0) + ' skills',
          reliabilityScore: Math.round(twins.reduce((sum, t) => sum + t.metrics.reliabilityScore, 0) / twins.length) + '%'
        },

        insights: {
          tagline: `${twins[0].ownerName} is worth ${totalProductivity}x in productivity`,
          advice: totalProductivity > 5
            ? 'Highly productive! Consider showcasing in marketplace.'
            : 'Keep training your twins to increase their value.'
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// COMPANY ANALYTICS (For companies viewing their hired twins)
// =============================================================================

router.get('/company/:companyCorpId', async (req: Request, res: Response) => {
  try {
    const { companyCorpId } = req.params;

    const grants = await AccessGrant.find({
      companyCorpId,
      isActive: true
    }).lean();

    if (grants.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No active twins found for this company' }
      });
    }

    // Get twin details
    const twinIds = grants.map(g => g.twinId);
    const twins = await ProfessionalTwin.find({ twinId: { $in: twinIds } }).lean();
    const twinMap = new Map(twins.map(t => [t.twinId, t]));

    // Calculate workforce metrics
    const totalProductivity = twins.reduce((sum, t) => sum + t.metrics.productivityMultiplier, 0);
    const avgSatisfaction = grants.reduce((sum, g) => sum + (g.usage?.avgSatisfaction || 0), 0) / grants.length;
    const totalInvocations = grants.reduce((sum, g) => sum + (g.usage?.totalInvocations || 0), 0);

    // Group by type
    const byType: Record<string, { count: number; productivity: number }> = {};
    twins.forEach(t => {
      if (!byType[t.twinType]) {
        byType[t.twinType] = { count: 0, productivity: 0 };
      }
      byType[t.twinType].count++;
      byType[t.twinType].productivity += t.metrics.productivityMultiplier;
    });

    res.json({
      success: true,
      data: {
        companyCorpId,
        workforce: {
          totalTwins: twins.length,
          totalProductivityMultiplier: totalProductivity.toFixed(1),
          avgSatisfaction: avgSatisfaction.toFixed(1),
          totalInvocations,
          productivityGain: `${((totalProductivity - twins.length) * 100).toFixed(0)}% increase`
        },

        byType: Object.entries(byType).map(([type, data]) => ({
          twinType: type,
          count: data.count,
          productivity: data.productivity.toFixed(1)
        })),

        twins: twins.map(t => {
          const grant = grants.find(g => g.twinId === t.twinId);
          return {
            twinId: t.twinId,
            ownerName: t.ownerName,
            twinType: t.twinType,
            productivity: t.metrics.productivityMultiplier,
            usage: grant?.usage || { totalInvocations: 0, avgSatisfaction: 0 }
          };
        }),

        insights: {
          productivityValue: `Your workforce is ${totalProductivity}x more productive`,
          efficiency: `${avgSatisfaction.toFixed(1)}/5 average satisfaction`,
          recommendation: twins.length > 10
            ? 'Consider optimizing twin usage'
            : 'Room to add more twins to your workforce'
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// MARKETPLACE TRENDS
// =============================================================================

router.get('/trends/marketplace', async (_req: Request, res: Response) => {
  try {
    // Get trends over time (simplified)
    const recentTwins = await ProfessionalTwin.find({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).lean();

    const byType = await ProfessionalTwin.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$twinType', avgProductivity: { $avg: '$metrics.productivityMultiplier' } } }
    ]);

    // Top performing twins
    const topTwins = await ProfessionalTwin.find({
      status: 'ACTIVE',
      'metrics.productivityMultiplier': { $gt: 3 }
    })
      .select('twinId ownerName twinType metrics.productivityMultiplier')
      .sort({ 'metrics.productivityMultiplier': -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        trends: {
          newTwinsThisMonth: recentTwins.length,
          avgProductivity: (byType.reduce((sum, t) => sum + t.avgProductivity, 0) / byType.length || 1).toFixed(2)
        },
        topPerformingTwins: topTwins.map(t => ({
          twinId: t.twinId,
          ownerName: t.ownerName,
          twinType: t.twinType,
          productivity: t.metrics.productivityMultiplier
        })),
        byType: byType.map(t => ({
          twinType: t._id,
          avgProductivity: t.avgProductivity.toFixed(2)
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

export { router as analyticsRoutes };
