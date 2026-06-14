/**
 * REZ Outbound Service - Sequence Routes
 *
 * API endpoints for sequence management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { SequenceModel, ISequence } from '../models/Sequence.js';
import { ProspectModel } from '../models/Prospect.js';
import logger from '../utils/logger.js';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const CreateSequenceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['email', 'linkedin', 'sms', 'call', 'multi-channel']).default('email'),
  channel: z.enum(['email', 'linkedin_connection', 'linkedin_message', 'linkedin_post', 'sms', 'call', 'task']).default('email'),
  steps: z.array(z.object({
    order: z.number(),
    type: z.enum(['email', 'linkedin_connection', 'linkedin_message', 'linkedin_post', 'sms', 'call', 'task']),
    delay: z.number().min(0).default(24),
    delayUnit: z.enum(['minutes', 'hours', 'days', 'weeks']).default('hours'),
    delayFrom: z.enum(['previous_step', 'start', 'prospect_added']).default('previous_step'),
    content: z.object({
      subject: z.string().optional(),
      body: z.string().optional(),
      templateId: z.string().optional(),
      linkedinMessage: z.string().optional(),
      smsBody: z.string().optional(),
      callScript: z.string().optional(),
    }),
    conditions: z.object({
      skipIfNoReply: z.boolean().optional(),
      skipIfClicked: z.boolean().optional(),
      skipIfOpened: z.boolean().optional(),
      skipIfReplied: z.boolean().optional(),
    }).optional(),
  })).optional(),
  targetTags: z.array(z.string()).optional(),
  excludeTags: z.array(z.string()).optional(),
  dailyLimit: z.number().min(1).optional(),
  maxProspects: z.number().min(1).optional(),
});

const UpdateSequenceSchema = CreateSequenceSchema.partial();

const SequenceQuerySchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).optional(),
  type: z.enum(['email', 'linkedin', 'sms', 'call', 'multi-channel']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/v1/sequences
 * Create new sequence
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.headers['x-user-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = CreateSequenceSchema.parse(req.body);

    // Calculate total duration
    const totalDurationDays = validated.steps?.reduce((sum, step) => {
      const hours = step.delayUnit === 'hours' ? step.delay :
        step.delayUnit === 'days' ? step.delay * 24 :
          step.delayUnit === 'weeks' ? step.delay * 168 : step.delay / 60;
      return sum + hours / 24;
    }, 0) || 30;

    const sequence = await SequenceModel.create({
      ...validated,
      tenantId,
      createdBy: userId || 'system',
      status: 'draft',
      totalDurationDays: Math.ceil(totalDurationDays),
      stats: {
        totalProspects: 0,
        activeProspects: 0,
        completedProspects: 0,
        optedOutProspects: 0,
        repliedProspects: 0,
        interestedProspects: 0,
        avgReplyRate: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        avgConversionRate: 0,
      },
    });

    logger.info('Sequence created', {
      tenantId,
      sequenceId: sequence._id,
      name: sequence.name,
    });

    res.status(201).json({
      success: true,
      data: { sequence },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to create sequence', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to create sequence' });
  }
});

/**
 * GET /api/v1/sequences
 * List sequences
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = SequenceQuerySchema.parse(req.query);

    const query: any = { tenantId };
    if (validated.status) query.status = validated.status;
    if (validated.type) query.type = validated.type;

    const [sequences, total] = await Promise.all([
      SequenceModel.find(query)
        .sort({ updatedAt: -1 })
        .skip(validated.offset)
        .limit(validated.limit),
      SequenceModel.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        sequences,
        pagination: {
          offset: validated.offset,
          limit: validated.limit,
          total,
          hasMore: validated.offset + sequences.length < total,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to list sequences', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to list sequences' });
  }
});

/**
 * GET /api/v1/sequences/:id
 * Get sequence by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const sequence = await SequenceModel.findOne({ _id: id, tenantId });

    if (!sequence) {
      res.status(404).json({ success: false, error: 'Sequence not found' });
      return;
    }

    res.json({ success: true, data: { sequence } });
  } catch (error) {
    logger.error('Failed to get sequence', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get sequence' });
  }
});

/**
 * PUT /api/v1/sequences/:id
 * Update sequence
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = UpdateSequenceSchema.parse(req.body);

    const sequence = await SequenceModel.findOneAndUpdate(
      { _id: id, tenantId },
      validated,
      { new: true }
    );

    if (!sequence) {
      res.status(404).json({ success: false, error: 'Sequence not found' });
      return;
    }

    logger.info('Sequence updated', { tenantId, sequenceId: id });

    res.json({ success: true, data: { sequence } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to update sequence', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to update sequence' });
  }
});

/**
 * POST /api/v1/sequences/:id/activate
 * Activate sequence
 */
router.post('/:id/activate', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const sequence = await SequenceModel.findOneAndUpdate(
      { _id: id, tenantId, status: { $in: ['draft', 'paused'] } },
      { status: 'active' },
      { new: true }
    );

    if (!sequence) {
      res.status(404).json({ success: false, error: 'Sequence not found or cannot be activated' });
      return;
    }

    logger.info('Sequence activated', { tenantId, sequenceId: id });

    res.json({ success: true, data: { sequence } });
  } catch (error) {
    logger.error('Failed to activate sequence', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to activate sequence' });
  }
});

/**
 * POST /api/v1/sequences/:id/pause
 * Pause sequence
 */
router.post('/:id/pause', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const sequence = await SequenceModel.findOneAndUpdate(
      { _id: id, tenantId, status: 'active' },
      { status: 'paused' },
      { new: true }
    );

    if (!sequence) {
      res.status(404).json({ success: false, error: 'Active sequence not found' });
      return;
    }

    logger.info('Sequence paused', { tenantId, sequenceId: id });

    res.json({ success: true, data: { sequence } });
  } catch (error) {
    logger.error('Failed to pause sequence', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to pause sequence' });
  }
});

/**
 * POST /api/v1/sequences/:id/clone
 * Clone sequence
 */
router.post('/:id/clone', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const original = await SequenceModel.findOne({ _id: id, tenantId });

    if (!original) {
      res.status(404).json({ success: false, error: 'Sequence not found' });
      return;
    }

    const { _id, createdAt, updatedAt, ...sequenceData } = original.toObject();

    const cloned = await SequenceModel.create({
      ...sequenceData,
      _id: undefined,
      name: `${original.name} (Copy)`,
      status: 'draft',
      createdBy: userId || 'system',
      stats: {
        totalProspects: 0,
        activeProspects: 0,
        completedProspects: 0,
        optedOutProspects: 0,
        repliedProspects: 0,
        interestedProspects: 0,
        avgReplyRate: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        avgConversionRate: 0,
      },
    });

    logger.info('Sequence cloned', {
      tenantId,
      originalId: id,
      newId: cloned._id,
    });

    res.status(201).json({ success: true, data: { sequence: cloned } });
  } catch (error) {
    logger.error('Failed to clone sequence', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to clone sequence' });
  }
});

/**
 * GET /api/v1/sequences/:id/stats
 * Get sequence statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const sequence = await SequenceModel.findOne({ _id: id, tenantId });

    if (!sequence) {
      res.status(404).json({ success: false, error: 'Sequence not found' });
      return;
    }

    // Get prospect stats from database
    const prospectStats = await ProspectModel.aggregate([
      { $match: { tenantId, sequenceId: sequence._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgOpenRate: { $avg: { $cond: [{ $gt: ['$emailsSent', 0] }, { $divide: ['$emailsOpened', '$emailsSent'] }, 0] } },
          avgClickRate: { $avg: { $cond: [{ $gt: ['$emailsOpened', 0] }, { $divide: ['$emailsClicked', '$emailsOpened'] }, 0] } },
        },
      },
    ]);

    const stats = {
      sequence: sequence.stats,
      prospectBreakdown: prospectStats.reduce((acc, s) => {
        acc[s._id] = { count: s.count, avgOpenRate: s.avgOpenRate, avgClickRate: s.avgClickRate };
        return acc;
      }, {} as Record<string, any>),
    };

    res.json({ success: true, data: { stats } });
  } catch (error) {
    logger.error('Failed to get stats', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

export default router;
