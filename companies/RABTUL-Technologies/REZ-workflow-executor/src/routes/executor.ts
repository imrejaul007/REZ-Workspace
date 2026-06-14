import { Router, Request, Response } from 'express';
import {
  createWorkflow,
  getWorkflow,
  getWorkflows,
  createExecution,
  getExecution,
  getExecutionsByWorkflow,
  getExecutionEvents,
  cancelExecution,
  getExecutionStats,
} from '../services/executor.service';
import logger from '../utils/logger';

const router = Router();

// Workflow management

// POST /api/workflows - Create workflow
router.post('/workflows', (req: Request, res: Response) => {
  try {
    const { name, description, nodes, edges, version } = req.body;

    if (!name || !nodes || !edges) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const workflow = createWorkflow({ name, description, nodes, edges, version: version || '1.0.0' });
    res.status(201).json({ success: true, data: workflow });
  } catch (error) {
    logger.error('Error creating workflow:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/workflows - List workflows
router.get('/workflows', (_req: Request, res: Response) => {
  const workflows = getWorkflows();
  res.json({ success: true, data: workflows, count: workflows.length });
});

// GET /api/workflows/:id - Get workflow by ID
router.get('/workflows/:id', (req: Request, res: Response) => {
  const workflow = getWorkflow(req.params.id);
  if (!workflow) {
    res.status(404).json({ success: false, error: 'Workflow not found' });
    return;
  }
  res.json({ success: true, data: workflow });
});

// Execution management

// POST /api/executions - Create and start execution
router.post('/executions', (req: Request, res: Response) => {
  try {
    const { workflowId, name, context } = req.body;

    if (!workflowId || !name) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    createExecution(workflowId, name, context).then(execution => {
      if (!execution) {
        res.status(404).json({ success: false, error: 'Workflow not found' });
        return;
      }
      res.status(201).json({ success: true, data: execution });
    });
  } catch (error) {
    logger.error('Error creating execution:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/executions - List executions
router.get('/executions', (req: Request, res: Response) => {
  const { workflowId } = req.query;
  let executions = Array.from(Object.values({}));

  if (workflowId && typeof workflowId === 'string') {
    executions = getExecutionsByWorkflow(workflowId);
  }

  res.json({ success: true, data: executions, count: executions.length });
});

// GET /api/executions/stats - Get execution stats
router.get('/executions/stats', (_req: Request, res: Response) => {
  res.json({ success: true, data: getExecutionStats() });
});

// GET /api/executions/:id - Get execution by ID
router.get('/executions/:id', (req: Request, res: Response) => {
  const execution = getExecution(req.params.id);
  if (!execution) {
    res.status(404).json({ success: false, error: 'Execution not found' });
    return;
  }
  res.json({ success: true, data: execution });
});

// GET /api/executions/:id/events - Get execution events
router.get('/executions/:id/events', (req: Request, res: Response) => {
  const executionEvents = getExecutionEvents(req.params.id);
  res.json({ success: true, data: executionEvents });
});

// POST /api/executions/:id/cancel - Cancel execution
router.post('/executions/:id/cancel', (req: Request, res: Response) => {
  const execution = cancelExecution(req.params.id);
  if (!execution) {
    res.status(404).json({ success: false, error: 'Execution not found' });
    return;
  }
  res.json({ success: true, data: execution, message: 'Execution cancelled' });
});

export default router;
