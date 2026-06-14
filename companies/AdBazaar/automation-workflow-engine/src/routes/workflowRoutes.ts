import { Router, Response } from 'express';
import { z } from 'zod';
import { workflowService, executionService } from '../services';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { createChildLogger } from '../utils/logger';

const logger = createChildLogger('WorkflowRoutes');
const router = Router();

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  trigger: z.object({
    type: z.enum(['manual', 'scheduled', 'event', 'webhook', 'condition']),
    config: z.record(z.unknown())
  }),
  actions: z.array(z.object({
    type: z.string(),
    config: z.record(z.unknown()),
    order: z.number(),
    retryConfig: z.object({
      maxRetries: z.number(),
      retryDelay: z.number()
    }).optional()
  })),
  conditions: z.object({
    type: z.enum(['and', 'or']),
    rules: z.array(z.record(z.unknown()))
  }).optional(),
  variables: z.record(z.unknown()).optional(),
  isTemplate: z.boolean().optional()
});

// Create workflow
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = createWorkflowSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const workflow = await workflowService.create({
      userId: req.userId!,
      ...validation.data
    });

    res.status(201).json(workflow);
  } catch (error) {
    logger.error('Error creating workflow', { error });
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// Get workflow by ID
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workflow = await workflowService.findById(req.params.id);

    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    res.json(workflow);
  } catch (error) {
    logger.error('Error fetching workflow', { error });
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

// Get all workflows
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, isTemplate } = req.query;
    const workflows = await workflowService.findByUser(req.userId!, {
      status: status as string,
      isTemplate: isTemplate === 'true'
    });

    res.json(workflows);
  } catch (error) {
    logger.error('Error fetching workflows', { error });
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// Update workflow
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workflow = await workflowService.update(req.params.id, req.body);

    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    res.json(workflow);
  } catch (error) {
    logger.error('Error updating workflow', { error });
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// Enable/activate workflow
router.post('/:id/enable', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workflow = await workflowService.updateStatus(req.params.id, 'active');

    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    res.json(workflow);
  } catch (error) {
    logger.error('Error enabling workflow', { error });
    res.status(500).json({ error: 'Failed to enable workflow' });
  }
});

// Pause workflow
router.post('/:id/pause', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workflow = await workflowService.updateStatus(req.params.id, 'paused');

    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    res.json(workflow);
  } catch (error) {
    logger.error('Error pausing workflow', { error });
    res.status(500).json({ error: 'Failed to pause workflow' });
  }
});

// Trigger workflow manually
router.post('/:id/trigger', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workflow = await workflowService.findById(req.params.id);
    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    if (workflow.status !== 'active') {
      res.status(400).json({ error: 'Workflow must be active to trigger' });
      return;
    }

    const execution = await executionService.createExecution(
      workflow._id.toString(),
      req.userId!,
      { type: 'manual', source: 'api' },
      req.body.input
    );

    res.status(201).json(execution);
  } catch (error) {
    logger.error('Error triggering workflow', { error });
    res.status(500).json({ error: 'Failed to trigger workflow' });
  }
});

// Get workflow logs
router.get('/:id/logs', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit, status } = req.query;
    const executions = await executionService.findByWorkflow(req.params.id, {
      limit: limit ? parseInt(limit as string) : 10
    });

    if (executions.length === 0) {
      res.json([]);
      return;
    }

    const logs = await executionService.getLogs(executions[0]._id.toString(), {
      level: status as string,
      limit: 100
    });

    res.json(logs);
  } catch (error) {
    logger.error('Error fetching workflow logs', { error });
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Delete workflow
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await workflowService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting workflow', { error });
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// Duplicate workflow
router.post('/:id/duplicate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workflow = await workflowService.duplicateWorkflow(req.params.id, req.userId!);
    res.status(201).json(workflow);
  } catch (error) {
    logger.error('Error duplicating workflow', { error });
    res.status(500).json({ error: 'Failed to duplicate workflow' });
  }
});

// Get workflow stats
router.get('/stats/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await workflowService.getWorkflowStats(req.userId!);
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching workflow stats', { error });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;