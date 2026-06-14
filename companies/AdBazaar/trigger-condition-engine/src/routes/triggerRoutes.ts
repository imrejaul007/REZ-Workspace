import { Router, Response } from 'express';
import { z } from 'zod';
import { triggerService, conditionService, historyService } from '../services';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { createChildLogger } from '../utils/logger';

const logger = createChildLogger('TriggerRoutes');
const router = Router();

const createTriggerSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['scheduled', 'event', 'webhook', 'manual', 'data_change', 'threshold']),
  source: z.string(),
  config: z.object({
    schedule: z.string().optional(),
    eventType: z.string().optional(),
    webhookPath: z.string().optional(),
    dataPath: z.string().optional(),
    threshold: z.number().optional(),
    thresholdOperator: z.string().optional(),
    comparisonValue: z.unknown().optional()
  }).optional(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.unknown(),
    value2: z.unknown().optional()
  })).optional(),
  conditionLogic: z.enum(['and', 'or']).optional(),
  actions: z.array(z.object({
    type: z.string(),
    config: z.record(z.unknown()),
    delay: z.number().optional()
  })).optional(),
  throttle: z.object({
    enabled: z.boolean(),
    maxFires: z.number(),
    windowMs: z.number()
  }).optional()
});

// Create trigger
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = createTriggerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const trigger = await triggerService.create({
      userId: req.userId!,
      ...validation.data
    });

    res.status(201).json(trigger);
  } catch (error) {
    logger.error('Error creating trigger', { error });
    res.status(500).json({ error: 'Failed to create trigger' });
  }
});

// Get trigger by ID
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trigger = await triggerService.findById(req.params.id);

    if (!trigger) {
      res.status(404).json({ error: 'Trigger not found' });
      return;
    }

    res.json(trigger);
  } catch (error) {
    logger.error('Error fetching trigger', { error });
    res.status(500).json({ error: 'Failed to fetch trigger' });
  }
});

// Get all triggers
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, type } = req.query;
    const triggers = await triggerService.findByUser(req.userId!, {
      status: status as string,
      type: type as string
    });

    res.json(triggers);
  } catch (error) {
    logger.error('Error fetching triggers', { error });
    res.status(500).json({ error: 'Failed to fetch triggers' });
  }
});

// Update trigger
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trigger = await triggerService.update(req.params.id, req.body);

    if (!trigger) {
      res.status(404).json({ error: 'Trigger not found' });
      return;
    }

    res.json(trigger);
  } catch (error) {
    logger.error('Error updating trigger', { error });
    res.status(500).json({ error: 'Failed to update trigger' });
  }
});

// Pause trigger
router.post('/:id/pause', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trigger = await triggerService.updateStatus(req.params.id, 'paused');

    if (!trigger) {
      res.status(404).json({ error: 'Trigger not found' });
      return;
    }

    res.json(trigger);
  } catch (error) {
    logger.error('Error pausing trigger', { error });
    res.status(500).json({ error: 'Failed to pause trigger' });
  }
});

// Enable trigger
router.post('/:id/enable', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trigger = await triggerService.updateStatus(req.params.id, 'active');

    if (!trigger) {
      res.status(404).json({ error: 'Trigger not found' });
      return;
    }

    res.json(trigger);
  } catch (error) {
    logger.error('Error enabling trigger', { error });
    res.status(500).json({ error: 'Failed to enable trigger' });
  }
});

// Test trigger
router.post('/:id/test', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trigger = await triggerService.findById(req.params.id);
    if (!trigger) {
      res.status(404).json({ error: 'Trigger not found' });
      return;
    }

    const testData = req.body.data || {};
    const result = conditionService.evaluateConditions(
      trigger.conditions,
      testData,
      trigger.conditionLogic
    );

    res.json({
      triggerId: trigger._id,
      conditions: result
    });
  } catch (error) {
    logger.error('Error testing trigger', { error });
    res.status(500).json({ error: 'Failed to test trigger' });
  }
});

// Get trigger history
router.get('/:id/history', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit, status } = req.query;
    const history = await historyService.findByTrigger(req.params.id, {
      limit: limit ? parseInt(limit as string) : 50,
      status: status as string
    });

    res.json(history);
  } catch (error) {
    logger.error('Error fetching trigger history', { error });
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get trigger stats
router.get('/:id/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await historyService.getHistoryStats(req.params.id);
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching trigger stats', { error });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Delete trigger
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await triggerService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({ error: 'Trigger not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting trigger', { error });
    res.status(500).json({ error: 'Failed to delete trigger' });
  }
});

// Duplicate trigger
router.post('/:id/duplicate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trigger = await triggerService.duplicateTrigger(req.params.id, req.userId!);
    res.status(201).json(trigger);
  } catch (error) {
    logger.error('Error duplicating trigger', { error });
    res.status(500).json({ error: 'Failed to duplicate trigger' });
  }
});

export default router;