/**
 * REZ Deal Intelligence - Deal Routes
 *
 * API endpoints for deal management with AI insights
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { DealModel, IDeal, DealStage } from '../models/Deal.js';
import { DealScoringService } from '../services/dealScoring.js';
import logger from '../utils/logger.js';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const CreateDealSchema = z.object({
  name: z.string().min(1).max(200),
  value: z.number().positive(),
  currency: z.string().default('USD'),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('lead'),
  companyId: z.string().min(1),
  companyName: z.string().min(1),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  primaryContactId: z.string().optional(),
  primaryContactName: z.string().optional(),
  primaryContactEmail: z.string().email().optional(),
  ownerId: z.string().min(1),
  ownerName: z.string().optional(),
  expectedCloseDate: z.string().datetime().optional(),
  crmDealId: z.string().optional(),
  icpId: z.string().optional(),
});

const UpdateDealSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  value: z.number().positive().optional(),
  currency: z.string().optional(),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
  primaryContactId: z.string().optional(),
  primaryContactName: z.string().optional(),
  primaryContactEmail: z.string().email().optional(),
  ownerId: z.string().optional(),
  ownerName: z.string().optional(),
  expectedCloseDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  competitors: z.array(z.string()).optional(),
});

const ScoreDealSchema = z.object({
  companyScore: z.number().min(0).max(100).optional(),
  signalScore: z.number().min(0).max(100).optional(),
  engagementScore: z.number().min(0).max(100).optional(),
  activityCount: z.number().int().min(0).optional(),
  sentimentScore: z.number().min(0).max(100).optional(),
});

const DealQuerySchema = z.object({
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
  temperature: z.enum(['hot', 'warm', 'cold']).optional(),
  ownerId: z.string().optional(),
  companyId: z.string().optional(),
  sort: z.enum(['score', 'value', 'createdAt', 'expectedCloseDate']).default('score'),
  order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/v1/deals
 * Create a new deal
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = CreateDealSchema.parse(req.body);

    // Generate deal ID
    const dealId = `deal_${uuidv4().slice(0, 8)}`;

    const deal = await DealModel.create({
      ...validated,
      tenantId,
      dealId,
      stage: validated.stage || 'lead',
      currency: validated.currency || 'USD',
      daysInStage: 0,
      totalDays: 0,
      score: {
        overall: 50,
        companyFit: 50,
        intent: 30,
        engagement: 40,
        activity: 0,
        sentiment: 50,
      },
      recommendations: [],
      riskFactors: [],
    });

    // Generate initial recommendations
    const recommendations = DealScoringService.generateRecommendations(deal);
    deal.recommendations = recommendations.map(r => ({
      id: uuidv4(),
      ...r,
      createdAt: new Date(),
    }));
    await deal.save();

    logger.info('Deal created', { tenantId, dealId: deal.dealId, name: deal.name });

    res.status(201).json({
      success: true,
      data: { deal },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to create deal', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to create deal' });
  }
});

/**
 * GET /api/v1/deals
 * List deals with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = DealQuerySchema.parse(req.query);

    const query: any = { tenantId };
    if (validated.stage) query.stage = validated.stage;
    if (validated.temperature) query.temperature = validated.temperature;
    if (validated.ownerId) query.ownerId = validated.ownerId;
    if (validated.companyId) query.companyId = validated.companyId;

    // Sort
    let sortField: string;
    switch (validated.sort) {
      case 'value':
        sortField = 'value';
        break;
      case 'createdAt':
        sortField = 'createdAt';
        break;
      case 'expectedCloseDate':
        sortField = 'expectedCloseDate';
        break;
      default:
        sortField = 'score.overall';
    }
    const sortOrder = validated.order === 'asc' ? 1 : -1;

    const [deals, total] = await Promise.all([
      DealModel.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(validated.offset)
        .limit(validated.limit),
      DealModel.countDocuments(query),
    ]);

    // Pipeline stats
    const pipelineStats = await DealModel.aggregate([
      { $match: { tenantId, stage: { $ne: 'closed_lost' } } },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          value: { $sum: '$value' },
        },
      },
    ]);

    const stats = {
      total,
      byStage: pipelineStats.reduce((acc, s) => {
        acc[s._id] = { count: s.count, value: s.value };
        return acc;
      }, {} as Record<string, any>),
      byTemperature: {
        hot: deals.filter(d => d.temperature === 'hot').length,
        warm: deals.filter(d => d.temperature === 'warm').length,
        cold: deals.filter(d => d.temperature === 'cold').length,
      },
    };

    res.json({
      success: true,
      data: {
        deals,
        pagination: {
          offset: validated.offset,
          limit: validated.limit,
          total,
          hasMore: validated.offset + deals.length < total,
        },
        stats,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to list deals', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to list deals' });
  }
});

/**
 * GET /api/v1/deals/priorities
 * Get prioritized deals for action
 */
router.get('/priorities', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const { ownerId, limit = '20' } = req.query;

    const query: any = {
      tenantId,
      stage: { $nin: ['closed_won', 'closed_lost'] },
    };
    if (ownerId) query.ownerId = ownerId;

    // Get deals with high priority recommendations
    const deals = await DealModel.find(query)
      .sort({ 'score.overall': -1, 'recommendations.createdAt': -1 })
      .limit(parseInt(limit as string));

    // Prioritize deals with actionable recommendations
    const prioritized = deals.map(deal => ({
      deal,
      priorityScore: calculatePriorityScore(deal),
    }))
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, parseInt(limit as string))
      .map(p => p.deal);

    res.json({
      success: true,
      data: {
        deals: prioritized,
        count: prioritized.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get priorities', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get priorities' });
  }
});

/**
 * GET /api/v1/deals/stats
 * Get deal statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const stats = await DealModel.aggregate([
      { $match: { tenantId } },
      {
        $facet: {
          byStage: [
            { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } },
          ],
          byTemperature: [
            { $group: { _id: '$temperature', count: { $sum: 1 }, value: { $sum: '$value' } } },
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalDeals: { $sum: 1 },
                totalValue: { $sum: '$value' },
                avgScore: { $avg: '$score.overall' },
                hotDeals: { $sum: { $cond: [{ $eq: ['$temperature', 'hot'] }, 1, 0] } },
                warmDeals: { $sum: { $cond: [{ $eq: ['$temperature', 'warm'] }, 1, 0] } },
                coldDeals: { $sum: { $cond: [{ $eq: ['$temperature', 'cold'] }, 1, 0] } },
              },
            },
          ],
          winRate: [
            {
              $group: {
                _id: null,
                won: { $sum: { $cond: [{ $eq: ['$stage', 'closed_won'] }, 1, 0] } },
                lost: { $sum: { $cond: [{ $eq: ['$stage', 'closed_lost'] }, 1, 0] } },
                total: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const result = stats[0] || {};
    const totals = result.totals?.[0] || {};
    const winRate = result.winRate?.[0] || {};

    res.json({
      success: true,
      data: {
        overview: {
          totalDeals: totals.totalDeals || 0,
          totalValue: totals.totalValue || 0,
          avgScore: Math.round(totals.avgScore || 0),
          hotDeals: totals.hotDeals || 0,
          warmDeals: totals.warmDeals || 0,
          coldDeals: totals.coldDeals || 0,
        },
        byStage: result.byStage?.reduce((acc: any, s: any) => {
          acc[s._id] = { count: s.count, value: s.value };
          return acc;
        }, {}) || {},
        byTemperature: result.byTemperature?.reduce((acc: any, t: any) => {
          acc[t._id] = { count: t.count, value: t.value };
          return acc;
        }, {}) || {},
        winRate: winRate.total > 0 ? Math.round((winRate.won / winRate.total) * 100) : 0,
      },
    });
  } catch (error) {
    logger.error('Failed to get stats', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

/**
 * GET /api/v1/deals/:dealId
 * Get deal by ID
 */
router.get('/:dealId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { dealId } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const deal = await DealModel.findOne({ tenantId, dealId });

    if (!deal) {
      res.status(404).json({ success: false, error: 'Deal not found' });
      return;
    }

    res.json({ success: true, data: { deal } });
  } catch (error) {
    logger.error('Failed to get deal', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get deal' });
  }
});

/**
 * PATCH /api/v1/deals/:dealId
 * Update deal
 */
router.patch('/:dealId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { dealId } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = UpdateDealSchema.parse(req.body);

    const deal = await DealModel.findOneAndUpdate(
      { tenantId, dealId },
      validated,
      { new: true }
    );

    if (!deal) {
      res.status(404).json({ success: false, error: 'Deal not found' });
      return;
    }

    // Re-score if needed
    if (validated.stage) {
      await DealScoringService.scoreDeal(dealId);
    }

    logger.info('Deal updated', { tenantId, dealId });

    res.json({ success: true, data: { deal } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to update deal', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to update deal' });
  }
});

/**
 * POST /api/v1/deals/:dealId/score
 * Score/update deal intelligence
 */
router.post('/:dealId/score', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { dealId } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = ScoreDealSchema.parse(req.body);

    // Get existing deal
    let deal = await DealModel.findOne({ tenantId, dealId });
    if (!deal) {
      res.status(404).json({ success: false, error: 'Deal not found' });
      return;
    }

    // Update with new scores if provided
    if (validated.companyScore) deal.score.companyFit = validated.companyScore;
    if (validated.signalScore) deal.score.intent = validated.signalScore;
    if (validated.engagementScore) deal.score.engagement = validated.engagementScore;
    if (validated.sentimentScore) deal.score.sentiment = validated.sentimentScore;
    if (validated.activityCount !== undefined) deal.score.activity = validated.activityCount;

    // Re-score
    deal = await DealScoringService.scoreDeal(dealId);

    logger.info('Deal scored', { tenantId, dealId, score: deal?.score.overall });

    res.json({ success: true, data: { deal } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to score deal', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to score deal' });
  }
});

/**
 * POST /api/v1/deals/:dealId/stage
 * Move deal to new stage
 */
router.post('/:dealId/stage', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { dealId } = req.params;
    const { stage } = req.body as { stage: DealStage };

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const deal = await DealModel.findOne({ tenantId, dealId });

    if (!deal) {
      res.status(404).json({ success: false, error: 'Deal not found' });
      return;
    }

    const previousStage = deal.stage;
    deal.stage = stage;
    deal.daysInStage = 0;

    if (stage === 'closed_won' || stage === 'closed_lost') {
      deal.actualCloseDate = new Date();
    }

    await deal.save();

    logger.info('Deal stage updated', {
      tenantId,
      dealId,
      from: previousStage,
      to: stage,
    });

    res.json({ success: true, data: { deal } });
  } catch (error) {
    logger.error('Failed to update stage', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to update stage' });
  }
});

/**
 * POST /api/v1/deals/:dealId/close
 * Close deal (won or lost)
 */
router.post('/:dealId/close', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { dealId } = req.params;
    const { won, notes } = req.body as { won: boolean; notes?: string };

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const deal = await DealModel.findOne({ tenantId, dealId });

    if (!deal) {
      res.status(404).json({ success: false, error: 'Deal not found' });
      return;
    }

    deal.stage = won ? 'closed_won' : 'closed_lost';
    deal.actualCloseDate = new Date();
    if (notes) deal.notes = notes;

    await deal.save();

    logger.info('Deal closed', { tenantId, dealId, won });

    res.json({ success: true, data: { deal } });
  } catch (error) {
    logger.error('Failed to close deal', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to close deal' });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

function calculatePriorityScore(deal: IDeal): number {
  let score = deal.score?.overall || 50;

  // Boost for high-value deals
  if (deal.value > 100000) score += 10;
  else if (deal.value > 50000) score += 5;

  // Boost for high-priority recommendations
  const highPriorityRecs = deal.recommendations.filter(r => r.priority === 'high').length;
  score += highPriorityRecs * 5;

  // Reduce for stalled deals
  if (deal.daysInStage > 21) score -= 15;
  else if (deal.daysInStage > 14) score -= 5;

  // Reduce for risks
  const highRisks = deal.riskFactors.filter(r => r.severity === 'high').length;
  score -= highRisks * 10;

  return Math.max(0, Math.min(100, score));
}

export default router;
