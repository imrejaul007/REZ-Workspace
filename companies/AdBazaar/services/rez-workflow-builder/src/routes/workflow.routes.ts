import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { WorkflowEngine } from '../../engine/workflow.engine';

const router = Router();
const engine = new WorkflowEngine();

// List workflows
router.get('/', (req, res) => {
  const { status, tenantId } = req.query;
  // Mock data for demo
  const workflows = [
    {
      id: 'wf-1',
      tenantId: tenantId || 'default',
      name: 'Welcome Sequence',
      status: 'active',
      stats: { totalRuns: 150, successRuns: 148, failedRuns: 2 },
      createdAt: new Date()
    },
    {
      id: 'wf-2',
      tenantId: tenantId || 'default',
      name: 'Abandoned Cart Reminder',
      status: 'active',
      stats: { totalRuns: 89, successRuns: 87, failedRuns: 2 },
      createdAt: new Date()
    }
  ];
  res.json({ success: true, data: workflows });
});

// Get workflow
router.get('/:id', (req, res) => {
  const workflow = engine.getWorkflow(req.params.id);
  if (!workflow) {
    return res.status(404).json({ success: false, error: 'Workflow not found' });
  }
  res.json({ success: true, data: workflow });
});

// Create workflow
router.post('/', (req, res) => {
  const workflow = engine.createWorkflow({
    tenantId: req.headers['x-tenant-id'] as string || 'default',
    ...req.body,
    status: req.body.status || 'draft'
  });
  res.status(201).json({ success: true, data: workflow });
});

// Update workflow
router.put('/:id', (req, res) => {
  const workflow = engine.updateWorkflow(req.params.id, req.body);
  if (!workflow) {
    return res.status(404).json({ success: false, error: 'Workflow not found' });
  }
  res.json({ success: true, data: workflow });
});

// Delete workflow
router.delete('/:id', (req, res) => {
  engine.updateWorkflow(req.params.id, { status: 'archived' } as any);
  res.json({ success: true, message: 'Workflow archived' });
});

// Execute workflow
router.post('/:id/execute', async (req, res) => {
  try {
    const execution = await engine.execute(req.params.id, req.body.input || {});
    res.json({ success: true, data: execution });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get executions
router.get('/:id/executions', (req, res) => {
  const executions = engine.getExecutions(req.params.id);
  res.json({ success: true, data: executions });
});

export { router as workflowRoutes };
