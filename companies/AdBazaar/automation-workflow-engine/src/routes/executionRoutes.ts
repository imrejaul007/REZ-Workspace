import { Router, Response } from 'express';
import { executionService } from '../services';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { createChildLogger } from '../utils/logger';

const logger = createChildLogger('ExecutionRoutes');
const router = Router();

// Get execution by ID
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const execution = await executionService.findById(req.params.id);

    if (!execution) {
      res.status(404).json({ error: 'Execution not found' });
      return;
    }

    res.json(execution);
  } catch (error) {
    logger.error('Error fetching execution', { error });
    res.status(500).json({ error: 'Failed to fetch execution' });
  }
});

// Get execution logs
router.get('/:id/logs', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { level, limit } = req.query;
    const logs = await executionService.getLogs(req.params.id, {
      level: level as string,
      limit: limit ? parseInt(limit as string) : 100
    });

    res.json(logs);
  } catch (error) {
    logger.error('Error fetching execution logs', { error });
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Cancel execution
router.post('/:id/cancel', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const execution = await executionService.cancelExecution(req.params.id);

    if (!execution) {
      res.status(404).json({ error: 'Execution not found' });
      return;
    }

    res.json(execution);
  } catch (error) {
    logger.error('Error cancelling execution', { error });
    res.status(500).json({ error: 'Failed to cancel execution' });
  }
});

// Get executions for workflow
router.get('/workflow/:workflowId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit, status } = req.query;
    const executions = await executionService.findByWorkflow(req.params.workflowId, {
      limit: limit ? parseInt(limit as string) : 50,
      status: status as string
    });

    res.json(executions);
  } catch (error) {
    logger.error('Error fetching workflow executions', { error });
    res.status(500).json({ error: 'Failed to fetch executions' });
  }
});

// Get execution stats
router.get('/stats/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await executionService.getExecutionStats(req.userId!);
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching execution stats', { error });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;