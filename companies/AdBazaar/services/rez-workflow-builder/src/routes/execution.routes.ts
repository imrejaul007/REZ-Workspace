import { Router } from 'express';
import { logger } from '../../utils/logger';

const router = Router();

// List executions
router.get('/', (req, res) => {
  const { workflowId, status } = req.query;
  // Mock executions
  res.json({
    success: true,
    data: [
      {
        id: 'exec-1',
        workflowId: workflowId || 'wf-1',
        status: status || 'completed',
        startedAt: new Date(),
        completedAt: new Date()
      }
    ]
  });
});

// Get execution details
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      nodeExecutions: [
        { nodeId: 'node-1', status: 'completed' },
        { nodeId: 'node-2', status: 'completed' }
      ]
    }
  });
});

export { router as executionRoutes };
