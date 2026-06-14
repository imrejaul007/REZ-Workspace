/**
 * REZ Signal Service - Company Routes
 *
 * API endpoints for company signal aggregation
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { CompanySignalsModel } from '../models/CompanySignals.js';
import logger from '../utils/logger.js';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const CompanyQuerySchema = z.object({
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxScore: z.coerce.number().min(0).max(100).optional(),
  intentStage: z.enum(['awareness', 'consideration', 'decision', 'purchase']).optional(),
  trend: z.enum(['increasing', 'stable', 'decreasing']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  sort: z.enum(['score', 'trend', 'recent', 'engagement']).default('score'),
  order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/v1/companies
 * List companies with signal data
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = CompanyQuerySchema.parse(req.query);

    const query: any = { tenantId, isMonitored: true };

    if (validated.minScore) {
      query.overallScore = { ...query.overallScore, $gte: validated.minScore };
    }
    if (validated.maxScore) {
      query.overallScore = { ...query.overallScore, $lte: validated.maxScore };
    }
    if (validated.intentStage) {
      query.intentStage = validated.intentStage;
    }
    if (validated.trend) {
      query.trendDirection = validated.trend;
    }
    if (validated.priority) {
      query.priority = validated.priority;
    }

    // Build sort
    let sortField: string;
    switch (validated.sort) {
      case 'trend':
        sortField = 'trendPercentage';
        break;
      case 'recent':
        sortField = 'lastSignalAt';
        break;
      case 'engagement':
        sortField = 'totalEngagement';
        break;
      default:
        sortField = 'overallScore';
    }
    const sortOrder = validated.order === 'asc' ? 1 : -1;

    const [companies, total] = await Promise.all([
      CompanySignalsModel.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(validated.offset)
        .limit(validated.limit),
      CompanySignalsModel.countDocuments(query),
    ]);

    // Stats
    const stats = {
      total,
      avgScore: companies.length > 0
        ? Math.round(companies.reduce((sum, c) => sum + c.overallScore, 0) / companies.length)
        : 0,
      highIntent: companies.filter(c => c.overallScore >= 70).length,
      increasingTrend: companies.filter(c => c.trendDirection === 'increasing').length,
      byIntentStage: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
    };

    for (const company of companies) {
      stats.byIntentStage[company.intentStage] = (stats.byIntentStage[company.intentStage] || 0) + 1;
      stats.byPriority[company.priority] = (stats.byPriority[company.priority] || 0) + 1;
    }

    res.json({
      success: true,
      data: {
        companies,
        pagination: {
          offset: validated.offset,
          limit: validated.limit,
          total,
          hasMore: validated.offset + companies.length < total,
        },
        stats,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to list companies', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to list companies' });
  }
});

/**
 * GET /api/v1/companies/intent-leaderboard
 * Get companies ranked by intent
 */
router.get('/intent-leaderboard', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const { limit = '20' } = req.query;

    const companies = await CompanySignalsModel.find({
      tenantId,
      isMonitored: true,
    })
      .sort({ overallScore: -1, trendPercentage: -1 })
      .limit(parseInt(limit as string));

    const leaderboard = companies.map((company, index) => ({
      rank: index + 1,
      companyId: company.companyId,
      companyName: company.companyName,
      overallScore: company.overallScore,
      intentStage: company.intentStage,
      trendDirection: company.trendDirection,
      trendPercentage: company.trendPercentage,
      signalCount: company.totalSignals,
      lastActivity: company.lastSignalAt,
    }));

    res.json({
      success: true,
      data: {
        leaderboard,
        total: companies.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get leaderboard', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get leaderboard' });
  }
});

/**
 * GET /api/v1/companies/active-signals
 * Get companies with active signal trends
 */
router.get('/active-signals', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const { limit = '20' } = req.query;

    const companies = await CompanySignalsModel.find({
      tenantId,
      isMonitored: true,
      trendDirection: 'increasing',
    })
      .sort({ trendPercentage: -1, overallScore: -1 })
      .limit(parseInt(limit as string));

    res.json({
      success: true,
      data: {
        companies,
        count: companies.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get active signals', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get active signals' });
  }
});

/**
 * GET /api/v1/companies/stats
 * Get aggregate stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const stats = await CompanySignalsModel.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: null,
          totalCompanies: { $sum: 1 },
          avgScore: { $avg: '$overallScore' },
          totalSignals: { $sum: '$totalSignals' },
          avgTrend: { $avg: '$trendPercentage' },
          highIntent: {
            $sum: { $cond: [{ $gte: ['$overallScore', 70] }, 1, 0] },
          },
          increasingTrend: {
            $sum: { $cond: [{ $eq: ['$trendDirection', 'increasing'] }, 1, 0] },
          },
        },
      },
    ]);

    const intentDistribution = await CompanySignalsModel.aggregate([
      { $match: { tenantId } },
      { $group: { _id: '$intentStage', count: { $sum: 1 } } },
    ]);

    const priorityDistribution = await CompanySignalsModel.aggregate([
      { $match: { tenantId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalCompanies: 0,
          avgScore: 0,
          totalSignals: 0,
          avgTrend: 0,
          highIntent: 0,
          increasingTrend: 0,
        },
        byIntentStage: intentDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        byPriority: priorityDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    logger.error('Failed to get stats', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

/**
 * PATCH /api/v1/companies/:companyId/priority
 * Update company priority
 */
router.patch('/:companyId/priority', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { companyId } = req.params;
    const { priority, isMonitored } = req.body as { priority?: string; isMonitored?: boolean };

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const update: any = {};
    if (priority) update.priority = priority;
    if (typeof isMonitored === 'boolean') update.isMonitored = isMonitored;

    const company = await CompanySignalsModel.findOneAndUpdate(
      { tenantId, companyId },
      update,
      { new: true }
    );

    if (!company) {
      res.status(404).json({ success: false, error: 'Company not found' });
      return;
    }

    logger.info('Company priority updated', {
      tenantId,
      companyId,
      priority: company.priority,
      isMonitored: company.isMonitored,
    });

    res.json({ success: true, data: { company } });
  } catch (error) {
    logger.error('Failed to update company priority', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to update company priority' });
  }
});

export default router;
