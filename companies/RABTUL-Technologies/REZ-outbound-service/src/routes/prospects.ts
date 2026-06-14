/**
 * REZ Outbound Service - Prospect Routes
 *
 * API endpoints for prospect management in sequences
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ProspectModel, ProspectStatus } from '../models/Prospect.js';
import { SequenceModel } from '../models/Sequence.js';
import logger from '../utils/logger.js';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const AddProspectSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  title: z.string().optional(),
  companyId: z.string(),
  companyName: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  phone: z.string().optional(),
  variables: z.record(z.string()).optional(),
  notes: z.string().optional(),
});

const AddProspectsBatchSchema = z.object({
  sequenceId: z.string(),
  prospects: z.array(AddProspectSchema),
  ownerId: z.string(),
  ownerName: z.string().optional(),
});

const UpdateProspectSchema = z.object({
  status: z.enum(['pending', 'active', 'completed', 'opted_out', 'bounced', 'failed']).optional(),
  replyStatus: z.enum(['none', 'replied', 'interested', 'not_interested', 'demo_scheduled']).optional(),
  notes: z.string().optional(),
  variables: z.record(z.string()).optional(),
});

const ProspectQuerySchema = z.object({
  sequenceId: z.string().optional(),
  status: z.enum(['pending', 'active', 'completed', 'opted_out', 'bounced', 'failed']).optional(),
  replyStatus: z.enum(['none', 'replied', 'interested', 'not_interested', 'demo_scheduled']).optional(),
  ownerId: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/v1/prospects
 * Add prospect to sequence
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const { sequenceId, ...prospectData } = AddProspectSchema.extend({
      sequenceId: z.string(),
    }).parse(req.body);

    // Verify sequence exists and is active
    const sequence = await SequenceModel.findOne({ _id: sequenceId, tenantId });

    if (!sequence) {
      res.status(404).json({ success: false, error: 'Sequence not found' });
      return;
    }

    if (sequence.status !== 'active') {
      res.status(400).json({ success: false, error: 'Sequence is not active' });
      return;
    }

    // Check for duplicate
    const existing = await ProspectModel.findOne({
      tenantId,
      sequenceId,
      email: prospectData.email.toLowerCase(),
    });

    if (existing) {
      res.status(400).json({ success: false, error: 'Prospect already in sequence' });
      return;
    }

    const prospect = await ProspectModel.create({
      ...prospectData,
      tenantId,
      sequenceId,
      email: prospectData.email.toLowerCase(),
      status: 'pending',
      replyStatus: 'none',
      ownerId: req.headers['x-user-id'] as string || 'system',
    });

    // Update sequence stats
    await SequenceModel.findByIdAndUpdate(sequenceId, {
      $inc: { 'stats.totalProspects': 1 },
    });

    logger.info('Prospect added to sequence', {
      tenantId,
      prospectId: prospect._id,
      sequenceId,
    });

    res.status(201).json({
      success: true,
      data: { prospect },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to add prospect', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to add prospect' });
  }
});

/**
 * POST /api/v1/prospects/batch
 * Add multiple prospects to sequence
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const { sequenceId, prospects, ownerId, ownerName } = AddProspectsBatchSchema.parse(req.body);

    // Verify sequence
    const sequence = await SequenceModel.findOne({ _id: sequenceId, tenantId });

    if (!sequence) {
      res.status(404).json({ success: false, error: 'Sequence not found' });
      return;
    }

    const added: any[] = [];
    const skipped: any[] = [];

    for (const prospectData of prospects) {
      // Check duplicate
      const existing = await ProspectModel.findOne({
        tenantId,
        sequenceId,
        email: prospectData.email.toLowerCase(),
      });

      if (existing) {
        skipped.push({ email: prospectData.email, reason: 'duplicate' });
        continue;
      }

      const prospect = await ProspectModel.create({
        ...prospectData,
        tenantId,
        sequenceId,
        email: prospectData.email.toLowerCase(),
        status: 'pending',
        replyStatus: 'none',
        ownerId,
        ownerName,
      });

      added.push(prospect);
    }

    // Update sequence stats
    await SequenceModel.findByIdAndUpdate(sequenceId, {
      $inc: { 'stats.totalProspects': added.length },
    });

    logger.info('Batch prospects added', {
      tenantId,
      sequenceId,
      added: added.length,
      skipped: skipped.length,
    });

    res.status(201).json({
      success: true,
      data: {
        added: added.length,
        skipped: skipped.length,
        prospects: added,
        skippedDetails: skipped,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to add batch prospects', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to add batch prospects' });
  }
});

/**
 * GET /api/v1/prospects
 * List prospects
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = ProspectQuerySchema.parse(req.query);

    const query: any = { tenantId };
    if (validated.sequenceId) query.sequenceId = validated.sequenceId;
    if (validated.status) query.status = validated.status;
    if (validated.replyStatus) query.replyStatus = validated.replyStatus;
    if (validated.ownerId) query.ownerId = validated.ownerId;
    if (validated.search) {
      query.$or = [
        { email: { $regex: validated.search, $options: 'i' } },
        { firstName: { $regex: validated.search, $options: 'i' } },
        { lastName: { $regex: validated.search, $options: 'i' } },
        { companyName: { $regex: validated.search, $options: 'i' } },
      ];
    }

    const [prospects, total] = await Promise.all([
      ProspectModel.find(query)
        .sort({ addedAt: -1 })
        .skip(validated.offset)
        .limit(validated.limit),
      ProspectModel.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        prospects,
        pagination: {
          offset: validated.offset,
          limit: validated.limit,
          total,
          hasMore: validated.offset + prospects.length < total,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to list prospects', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to list prospects' });
  }
});

/**
 * GET /api/v1/prospects/:id
 * Get prospect by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const prospect = await ProspectModel.findOne({ _id: id, tenantId });

    if (!prospect) {
      res.status(404).json({ success: false, error: 'Prospect not found' });
      return;
    }

    res.json({ success: true, data: { prospect } });
  } catch (error) {
    logger.error('Failed to get prospect', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get prospect' });
  }
});

/**
 * PATCH /api/v1/prospects/:id
 * Update prospect
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = UpdateProspectSchema.parse(req.body);

    const prospect = await ProspectModel.findOneAndUpdate(
      { _id: id, tenantId },
      validated,
      { new: true }
    );

    if (!prospect) {
      res.status(404).json({ success: false, error: 'Prospect not found' });
      return;
    }

    logger.info('Prospect updated', { tenantId, prospectId: id });

    res.json({ success: true, data: { prospect } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to update prospect', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to update prospect' });
  }
});

/**
 * POST /api/v1/prospects/:id/opt-out
 * Opt out prospect from sequence
 */
router.post('/:id/opt-out', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const prospect = await ProspectModel.findOneAndUpdate(
      { _id: id, tenantId },
      {
        status: 'opted_out',
        replyStatus: 'not_interested',
      },
      { new: true }
    );

    if (!prospect) {
      res.status(404).json({ success: false, error: 'Prospect not found' });
      return;
    }

    // Update sequence stats
    await SequenceModel.findByIdAndUpdate(prospect.sequenceId, {
      $inc: {
        'stats.optedOutProspects': 1,
        'stats.activeProspects': -1,
      },
    });

    logger.info('Prospect opted out', { tenantId, prospectId: id });

    res.json({ success: true, data: { prospect } });
  } catch (error) {
    logger.error('Failed to opt out prospect', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to opt out prospect' });
  }
});

/**
 * POST /api/v1/prospects/:id/reply
 * Record reply from prospect
 */
router.post('/:id/reply', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;
    const { replyType, replyText } = req.body as { replyType?: string; replyText?: string };

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const prospect = await ProspectModel.findOneAndUpdate(
      { _id: id, tenantId },
      {
        $inc: { repliesReceived: 1 },
        $set: {
          replyStatus: replyType === 'interested' ? 'interested' : 'replied',
          lastActivityAt: new Date(),
        },
      },
      { new: true }
    );

    if (!prospect) {
      res.status(404).json({ success: false, error: 'Prospect not found' });
      return;
    }

    // Add activity
    prospect.activities.push({
      stepOrder: prospect.currentStep,
      type: 'replied',
      timestamp: new Date(),
      details: replyText,
    });
    await prospect.save();

    // Update sequence stats
    await SequenceModel.findByIdAndUpdate(prospect.sequenceId, {
      $inc: { 'stats.repliedProspects': 1 },
    });

    logger.info('Reply recorded', { tenantId, prospectId: id });

    res.json({ success: true, data: { prospect } });
  } catch (error) {
    logger.error('Failed to record reply', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to record reply' });
  }
});

/**
 * GET /api/v1/prospects/due
 * Get prospects due for next step
 */
router.get('/sequence/due', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const { sequenceId, limit = '50' } = req.query;

    const query: any = {
      tenantId,
      status: 'active',
      nextScheduledAt: { $lte: new Date() },
    };

    if (sequenceId) query.sequenceId = sequenceId;

    const prospects = await ProspectModel.find(query)
      .sort({ nextScheduledAt: 1 })
      .limit(parseInt(limit as string));

    res.json({
      success: true,
      data: {
        prospects,
        count: prospects.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get due prospects', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get due prospects' });
  }
});

export default router;
