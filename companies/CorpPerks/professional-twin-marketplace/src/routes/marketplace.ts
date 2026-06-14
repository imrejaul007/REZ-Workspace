/**
 * Marketplace Routes
 *
 * Browse and search professional twins
 */

import { Router, Request, Response } from 'express';
import { ProfessionalTwin, AccessGrant } from '../index.js';

const router = Router();

// =============================================================================
// SEARCH TWINS
// =============================================================================

router.get('/search', async (req: Request, res: Response) => {
  try {
    const {
      query,
      twinType,
      skills,
      minScore,
      maxScore,
      minProductivity,
      department,
      page = 1,
      limit = 20
    } = req.query;

    const filter: any = {
      status: 'ACTIVE',
      'privacy.showInResume': true
    };

    // Text search
    if (query) {
      filter.$or = [
        { ownerName: { $regex: query, $options: 'i' } },
        { 'knowledge.domains': { $regex: query, $options: 'i' } },
        { 'knowledge.expertise': { $regex: query, $options: 'i' } }
      ];
    }

    // Twin type filter
    if (twinType) {
      filter.twinType = twinType;
    }

    // Skills filter
    if (skills) {
      const skillList = (skills as string).split(',').map(s => s.trim());
      filter['knowledge.expertise'] = { $in: skillList };
    }

    // Score filter
    if (minScore) {
      filter['metrics.combinedScore'] = { $gte: parseInt(minScore as string) };
    }

    // Productivity filter
    if (minProductivity) {
      filter['metrics.productivityMultiplier'] = { $gte: parseFloat(minProductivity as string) };
    }

    // Department filter
    if (department) {
      filter['knowledge.domains'] = { $regex: department, $options: 'i' };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const pageLimit = Math.min(100, parseInt(limit as string));

    const [twins, total] = await Promise.all([
      ProfessionalTwin.find(filter)
        .select('-learning.sources')
        .skip(skip)
        .limit(pageLimit)
        .sort({ 'metrics.combinedScore': -1 })
        .lean(),
      ProfessionalTwin.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        twins: twins.map(t => ({
          twinId: t.twinId,
          ownerName: t.ownerName,
          twinType: t.twinType,
          domains: t.knowledge.domains,
          expertise: t.knowledge.expertise,
          tools: t.knowledge.tools.slice(0, 5),
          metrics: {
            combinedScore: t.metrics.combinedScore,
            productivityMultiplier: t.metrics.productivityMultiplier,
            reliabilityScore: t.metrics.reliabilityScore
          },
          learningHours: Math.round(t.learning.totalTrainingHours),
          status: t.status
        })),
        pagination: {
          page: parseInt(page as string),
          limit: pageLimit,
          total,
          totalPages: Math.ceil(total / pageLimit)
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
// FEATURED TWINS
// =============================================================================

router.get('/featured', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    // Get top twins by combined score
    const twins = await ProfessionalTwin.find({
      status: 'ACTIVE',
      'privacy.showInResume': true
    })
      .select('-learning.sources')
      .limit(parseInt(limit as string) || 10)
      .sort({ 'metrics.combinedScore': -1 })
      .lean();

    res.json({
      success: true,
      data: {
        twins: twins.map(t => ({
          twinId: t.twinId,
          ownerName: t.ownerName,
          twinType: t.twinType,
          topExpertise: t.knowledge.expertise.slice(0, 3),
          metrics: t.metrics,
          highlight: t.learning.totalTrainingHours > 500 ? 'Highly Trained' :
                     t.metrics.productivityMultiplier > 3 ? 'High Productivity' :
                     t.metrics.combinedScore > 85 ? 'Top Rated' : 'Rising Star'
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
// BROWSE BY CATEGORY
// =============================================================================

router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await ProfessionalTwin.aggregate([
      { $match: { status: 'ACTIVE', 'privacy.showInResume': true } },
      {
        $group: {
          _id: '$twinType',
          count: { $sum: 1 },
          avgScore: { $avg: '$metrics.combinedScore' },
          avgProductivity: { $avg: '$metrics.productivityMultiplier' },
          topExpertise: { $push: { $arrayElemAt: ['$knowledge.expertise', 0] } }
        }
      }
    ]);

    const categoryMap: Record<string, { name: string; description: string }> = {
      KNOWLEDGE: { name: 'Knowledge Twins', description: 'Domain experts with deep knowledge' },
      SKILL: { name: 'Skill Twins', description: 'Practical skills and capabilities' },
      CAREER: { name: 'Career Twins', description: 'Career growth and planning' },
      PRODUCTIVITY: { name: 'Productivity Twins', description: 'Work optimization specialists' },
      EXECUTION: { name: 'Execution Twins', description: 'Task execution and delegation' }
    };

    res.json({
      success: true,
      data: categories.map(c => ({
        twinType: c._id,
        ...categoryMap[c._id],
        count: c.count,
        avgScore: Math.round(c.avgScore),
        avgProductivity: c.avgProductivity.toFixed(1),
        topSkills: [...new Set(c.topExpertise)].slice(0, 5)
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// GET TWIN PROFILE (Public View)
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

    // Only show twins that are visible
    if (!twin.privacy.showInResume) {
      return res.status(403).json({
        success: false,
        error: { code: 'PRIVATE', message: 'This twin is not publicly visible' }
      });
    }

    // Get reviews
    const reviews = await AccessGrant.find({ twinId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.usage?.avgSatisfaction || 0), 0) / reviews.length
      : 0;

    res.json({
      success: true,
      data: {
        twin: {
          twinId: twin.twinId,
          ownerName: twin.ownerName,
          twinType: twin.twinType,
          knowledge: twin.knowledge,
          behavior: {
            workStyle: twin.behavior.workStyle,
            communicationStyle: twin.behavior.communicationStyle,
            decisionPattern: twin.behavior.decisionPattern
          },
          metrics: twin.metrics,
          privacy: twin.privacy,
          status: twin.status,
          learningHours: Math.round(twin.learning.totalTrainingHours)
        },
        stats: {
          reviewCount: reviews.length,
          avgRating: avgRating.toFixed(1),
          verifiedClaims: twin.privacy.verifiedClaims.length
        },
        tagline: `Combined Productivity: ${twin.metrics.productivityMultiplier}x`,
        benefit: 'Hire this employee + twin for enhanced productivity'
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
// COMPARE TWINS
// =============================================================================

router.post('/compare', async (req: Request, res: Response) => {
  try {
    const { twinIds } = req.body;

    if (!twinIds || twinIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Provide at least 2 twin IDs to compare' }
      });
    }

    const twins = await ProfessionalTwin.find({
      twinId: { $in: twinIds },
      status: 'ACTIVE'
    }).lean();

    if (twins.length < 2) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Not enough twins found' }
      });
    }

    // Build comparison
    const comparison = {
      twins: twins.map(t => ({
        twinId: t.twinId,
        ownerName: t.ownerName,
        twinType: t.twinType,
        expertise: t.knowledge.expertise,
        metrics: t.metrics,
        learningHours: t.learning.totalTrainingHours
      })),
      rankings: {
        highestScore: twins.sort((a, b) => b.metrics.combinedScore - a.metrics.combinedScore)[0]?.twinId,
        highestProductivity: twins.sort((a, b) => b.metrics.productivityMultiplier - a.metrics.productivityMultiplier)[0]?.twinId,
        mostTrained: twins.sort((a, b) => b.learning.totalTrainingHours - a.learning.totalTrainingHours)[0]?.twinId
      },
      recommendation: twins.sort((a, b) =>
        (b.metrics.combinedScore * 0.4 + b.metrics.productivityMultiplier * 0.6 * 100) -
        (a.metrics.combinedScore * 0.4 + a.metrics.productivityMultiplier * 0.6 * 100)
      )[0]
    };

    res.json({
      success: true,
      data: comparison
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

export { router as marketplaceRoutes };
