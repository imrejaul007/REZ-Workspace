/**
 * Playbooks Router - API routes for crisis playbooks
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { CrisisPlaybook, ICrisisPlaybook } from '../models';
import { AuthRequest } from '../middleware/auth';
import { crisisMetrics } from '../utils/metrics';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createPlaybookSchema = z.object({
  name: z.string().min(1).max(200),
  triggerConditions: z.object({
    sentimentThreshold: z.number().optional(),
    mentionThreshold: z.number().optional(),
    velocityThreshold: z.number().optional(),
    keywords: z.array(z.string()).optional(),
  }),
  steps: z
    .array(
      z.object({
        order: z.number().min(1),
        action: z.string().min(1),
        assignee: z.string().optional(),
        delayMinutes: z.number().min(0).optional(),
      })
    )
    .min(1),
  notifications: z
    .array(
      z.object({
        channel: z.enum(['slack', 'email']),
        recipients: z.array(z.string()).min(1),
        template: z.string().min(1),
      })
    )
    .min(1),
});

const updatePlaybookSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  triggerConditions: z
    .object({
      sentimentThreshold: z.number().optional(),
      mentionThreshold: z.number().optional(),
      velocityThreshold: z.number().optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
  steps: z
    .array(
      z.object({
        order: z.number().min(1),
        action: z.string().min(1),
        assignee: z.string().optional(),
        delayMinutes: z.number().min(0).optional(),
      })
    )
    .optional(),
  notifications: z
    .array(
      z.object({
        channel: z.enum(['slack', 'email']),
        recipients: z.array(z.string()).min(1),
        template: z.string().min(1),
      })
    )
    .optional(),
});

/**
 * GET /api/playbooks
 * List all playbooks
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, search } = req.query;

    const query: Record<string, unknown> = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const playbooks = await CrisisPlaybook.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: playbooks,
      count: playbooks.length,
    });
  } catch (error) {
    logger.error('Failed to list playbooks', { error });
    res.status(500).json({ success: false, error: 'Failed to list playbooks' });
  }
});

/**
 * POST /api/playbooks
 * Create a new playbook
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = createPlaybookSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues,
      });
      return;
    }

    const playbook = new CrisisPlaybook({
      playbookId: `PLAYBOOK-${uuidv4().slice(0, 8).toUpperCase()}`,
      ...validation.data,
      createdBy: req.user?.userId || 'unknown',
    });

    await playbook.save();

    crisisMetrics.incrementPlaybooksCreated();

    logger.info('Playbook created', {
      playbookId: playbook.playbookId,
      name: playbook.name,
    });

    res.status(201).json({
      success: true,
      data: playbook,
    });
  } catch (error) {
    logger.error('Failed to create playbook', { error });
    res.status(500).json({ success: false, error: 'Failed to create playbook' });
  }
});

/**
 * GET /api/playbooks/:id
 * Get playbook by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const playbook = await CrisisPlaybook.findOne({ playbookId: req.params.id });

    if (!playbook) {
      res.status(404).json({ success: false, error: 'Playbook not found' });
      return;
    }

    res.json({
      success: true,
      data: playbook,
    });
  } catch (error) {
    logger.error('Failed to get playbook', { error });
    res.status(500).json({ success: false, error: 'Failed to get playbook' });
  }
});

/**
 * PATCH /api/playbooks/:id
 * Update a playbook
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const validation = updatePlaybookSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues,
      });
      return;
    }

    const playbook = await CrisisPlaybook.findOneAndUpdate(
      { playbookId: req.params.id },
      { $set: validation.data },
      { new: true }
    );

    if (!playbook) {
      res.status(404).json({ success: false, error: 'Playbook not found' });
      return;
    }

    logger.info('Playbook updated', { playbookId: playbook.playbookId });

    res.json({
      success: true,
      data: playbook,
    });
  } catch (error) {
    logger.error('Failed to update playbook', { error });
    res.status(500).json({ success: false, error: 'Failed to update playbook' });
  }
});

/**
 * DELETE /api/playbooks/:id
 * Delete a playbook
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await CrisisPlaybook.deleteOne({ playbookId: req.params.id });

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, error: 'Playbook not found' });
      return;
    }

    logger.info('Playbook deleted', { playbookId: req.params.id });

    res.json({
      success: true,
      message: 'Playbook deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete playbook', { error });
    res.status(500).json({ success: false, error: 'Failed to delete playbook' });
  }
});

/**
 * POST /api/playbooks/:id/execute
 * Manually execute a playbook (for testing)
 */
router.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const playbook = await CrisisPlaybook.findOne({ playbookId: req.params.id });

    if (!playbook) {
      res.status(404).json({ success: false, error: 'Playbook not found' });
      return;
    }

    // In a real implementation, this would execute the playbook steps
    crisisMetrics.incrementPlaybooksExecuted(playbook.playbookId);

    logger.info('Playbook manually executed', {
      playbookId: playbook.playbookId,
      name: playbook.name,
    });

    res.json({
      success: true,
      message: 'Playbook executed successfully',
      steps: playbook.steps.map((step) => ({
        order: step.order,
        action: step.action,
        status: 'pending',
      })),
    });
  } catch (error) {
    logger.error('Failed to execute playbook', { error });
    res.status(500).json({ success: false, error: 'Failed to execute playbook' });
  }
});

/**
 * GET /api/playbooks/:id/executions
 * Get playbook execution history
 */
router.get('/:id/executions', async (req: Request, res: Response) => {
  try {
    const playbook = await CrisisPlaybook.findOne({ playbookId: req.params.id });

    if (!playbook) {
      res.status(404).json({ success: false, error: 'Playbook not found' });
      return;
    }

    // In a real implementation, this would return execution history from a separate collection
    res.json({
      success: true,
      data: [],
      message: 'Execution history not yet implemented',
    });
  } catch (error) {
    logger.error('Failed to get playbook executions', { error });
    res.status(500).json({ success: false, error: 'Failed to get playbook executions' });
  }
});

export { router as playbooksRouter };