/**
 * REZ Signal Service - Signal Routes
 *
 * API endpoints for signal management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { SignalModel, SignalType, IntentStage } from '../models/Signal.js';
import { SignalDetector } from '../services/signalDetector.js';
import logger from '../utils/logger.js';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const CreateSignalSchema = z.object({
  companyId: z.string().min(1),
  companyName: z.string().min(1),
  type: z.enum([
    'jobPosting', 'funding', 'news', 'technologyChange', 'expansion',
    'executiveChange', 'partnership', 'productLaunch', 'regulatory',
    'socialEngagement', 'websiteVisit', 'contentEngagement',
    'emailEngagement', 'adEngagement'
  ]),
  source: z.enum(['linkedin', 'twitter', 'news', 'jobBoard', 'website', 'email', 'ad', 'manual', 'api']),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  url: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

const SignalQuerySchema = z.object({
  companyId: z.string().optional(),
  types: z.string().optional(), // comma-separated
  minScore: z.coerce.number().min(0).max(100).optional(),
  intentStage: z.enum(['awareness', 'consideration', 'decision', 'purchase']).optional(),
  limit: z.coerce.number().min(1).max(500).default(50),
  offset: z.coerce.number().min(0).default(0),
  timeframe: z.coerce.number().min(1).max(365).optional(),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/v1/signals
 * Create a new signal
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = CreateSignalSchema.parse(req.body);

    const signal = await SignalDetector.createSignal({
      tenantId,
      ...validated,
    });

    logger.info('Signal created via API', {
      tenantId,
      signalId: signal._id,
      type: signal.type,
    });

    res.status(201).json({
      success: true,
      data: { signal },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to create signal', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to create signal' });
  }
});

/**
 * POST /api/v1/signals/batch
 * Create multiple signals at once
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const { signals } = req.body as { signals: z.infer<typeof CreateSignalSchema>[] };

    if (!Array.isArray(signals) || signals.length === 0) {
      res.status(400).json({ success: false, error: 'signals array is required' });
      return;
    }

    const createdSignals = [];
    const errors = [];

    for (let i = 0; i < signals.length; i++) {
      try {
        const validated = CreateSignalSchema.parse(signals[i]);
        const signal = await SignalDetector.createSignal({
          tenantId,
          ...validated,
        });
        createdSignals.push(signal);
      } catch (err) {
        errors.push({ index: i, error: (err as Error).message });
      }
    }

    logger.info('Batch signals created', {
      tenantId,
      created: createdSignals.length,
      errors: errors.length,
    });

    res.status(201).json({
      success: true,
      data: {
        created: createdSignals.length,
        errors: errors.length,
        signals: createdSignals,
        errorDetails: errors,
      },
    });
  } catch (error) {
    logger.error('Failed to create batch signals', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to create batch signals' });
  }
});

/**
 * GET /api/v1/signals
 * List signals with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = SignalQuerySchema.parse(req.query);

    const query: any = { tenantId, isActive: true };

    if (validated.companyId) {
      query.companyId = validated.companyId;
    }
    if (validated.types) {
      query.type = { $in: validated.types.split(',') };
    }
    if (validated.minScore) {
      query.score = { $gte: validated.minScore };
    }
    if (validated.intentStage) {
      query.intentStage = validated.intentStage;
    }
    if (validated.timeframe) {
      query.timestamp = { $gte: new Date(Date.now() - validated.timeframe * 24 * 60 * 60 * 1000) };
    }

    const [signals, total] = await Promise.all([
      SignalModel.find(query)
        .sort({ score: -1, timestamp: -1 })
        .skip(validated.offset)
        .limit(validated.limit),
      SignalModel.countDocuments(query),
    ]);

    // Aggregate stats
    const stats = {
      total,
      avgScore: signals.length > 0
        ? Math.round(signals.reduce((sum, s) => sum + s.score, 0) / signals.length)
        : 0,
      byType: {} as Record<string, number>,
      byIntentStage: {} as Record<string, number>,
    };

    for (const signal of signals) {
      stats.byType[signal.type] = (stats.byType[signal.type] || 0) + 1;
      stats.byIntentStage[signal.intentStage] = (stats.byIntentStage[signal.intentStage] || 0) + 1;
    }

    res.json({
      success: true,
      data: {
        signals,
        pagination: {
          offset: validated.offset,
          limit: validated.limit,
          total,
          hasMore: validated.offset + signals.length < total,
        },
        stats,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to list signals', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to list signals' });
  }
});

/**
 * GET /api/v1/signals/top
 * Get top signals across all companies
 */
router.get('/top', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const { minScore = '50', limit = '20', timeframe = '7' } = req.query;

    const signals = await SignalDetector.getTopSignals(tenantId, {
      minScore: parseInt(minScore as string),
      limit: parseInt(limit as string),
      timeframe: parseInt(timeframe as string),
    });

    // Group by company
    const byCompany: Record<string, { companyName: string; signals: typeof signals; totalScore: number }> = {};
    for (const signal of signals) {
      if (!byCompany[signal.companyId]) {
        byCompany[signal.companyId] = {
          companyName: signal.companyName,
          signals: [],
          totalScore: 0,
        };
      }
      byCompany[signal.companyId].signals.push(signal);
      byCompany[signal.companyId].totalScore += signal.score;
    }

    const ranked = Object.entries(byCompany)
      .map(([companyId, data]) => ({
        companyId,
        companyName: data.companyName,
        signalCount: data.signals.length,
        totalScore: data.totalScore,
        avgScore: Math.round(data.totalScore / data.signals.length),
        topSignal: data.signals[0],
      }))
      .sort((a, b) => b.totalScore - a.totalScore);

    res.json({
      success: true,
      data: {
        signals,
        companies: ranked,
        stats: {
          totalSignals: signals.length,
          totalCompanies: Object.keys(byCompany).length,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get top signals', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get top signals' });
  }
});

/**
 * GET /api/v1/signals/company/:companyId
 * Get signals for a specific company
 */
router.get('/company/:companyId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { companyId } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const { limit = '50', offset = '0', minScore = '0' } = req.query;

    const { signals, total } = await SignalDetector.getCompanySignals(tenantId, companyId, {
      minScore: parseInt(minScore as string),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: {
        companyId,
        signals,
        pagination: {
          offset: parseInt(offset as string),
          limit: parseInt(limit as string),
          total,
          hasMore: parseInt(offset as string) + signals.length < total,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get company signals', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get company signals' });
  }
});

/**
 * GET /api/v1/signals/types
 * Get available signal types
 */
router.get('/types', async (_req: Request, res: Response) => {
  const types = [
    { id: 'jobPosting', name: 'Job Posting', description: 'Hiring activity signals', category: 'growth' },
    { id: 'funding', name: 'Funding', description: 'Investment and funding news', category: 'growth' },
    { id: 'news', name: 'News', description: 'Press releases and news', category: 'general' },
    { id: 'technologyChange', name: 'Technology Change', description: 'Tech stack or vendor changes', category: 'intent' },
    { id: 'expansion', name: 'Expansion', description: 'Business expansion signals', category: 'growth' },
    { id: 'executiveChange', name: 'Executive Change', description: 'Leadership changes', category: 'general' },
    { id: 'partnership', name: 'Partnership', description: 'New partnerships', category: 'intent' },
    { id: 'productLaunch', name: 'Product Launch', description: 'New product launches', category: 'general' },
    { id: 'regulatory', name: 'Regulatory', description: 'Compliance requirements', category: 'intent' },
    { id: 'socialEngagement', name: 'Social Engagement', description: 'Social media activity', category: 'engagement' },
    { id: 'websiteVisit', name: 'Website Visit', description: 'Website activity', category: 'engagement' },
    { id: 'contentEngagement', name: 'Content Engagement', description: 'Content consumption', category: 'engagement' },
    { id: 'emailEngagement', name: 'Email Engagement', description: 'Email opens/clicks', category: 'engagement' },
    { id: 'adEngagement', name: 'Ad Engagement', description: 'Ad interactions', category: 'engagement' },
  ];

  res.json({ success: true, data: { types } });
});

/**
 * PATCH /api/v1/signals/:id/engage
 * Record engagement with a signal
 */
router.patch('/:id/engage', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;
    const { score = 1 } = req.body as { score?: number };

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const signal = await SignalModel.findOneAndUpdate(
      { _id: id, tenantId },
      {
        $inc: { engagementCount: 1 },
        $set: { lastEngagedAt: new Date() },
      },
      { new: true }
    );

    if (!signal) {
      res.status(404).json({ success: false, error: 'Signal not found' });
      return;
    }

    res.json({ success: true, data: { signal } });
  } catch (error) {
    logger.error('Failed to record engagement', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to record engagement' });
  }
});

export default router;
