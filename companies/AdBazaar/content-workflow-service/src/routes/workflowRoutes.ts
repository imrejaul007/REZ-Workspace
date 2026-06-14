import { Router, Request, Response, NextFunction } from 'express';
import { workflowService } from '../services/workflowService';
import { authMiddleware, validateBody, createWorkflowSchema, updateWorkflowSchema, submitWorkflowSchema, approveWorkflowSchema, publishWorkflowSchema } from '../middleware/auth';
import { logger } from 'utils/logger.js';

const router = Router();

router.use(authMiddleware);

// Create workflow
router.post('/', validateBody(createWorkflowSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflow = await workflowService.create(req.body);
    logger.info('Workflow created via API', { workflowId: workflow.workflowId });
    res.status(201).json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
});

// Get all workflows
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      status: req.query.status as string,
      type: req.query.type as string,
      createdBy: req.query.createdBy as string,
      assignedTo: req.query.assignedTo as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };
    const result = await workflowService.findAll(filters);
    res.json({
      success: true,
      data: result.workflows,
      pagination: { total: result.total, page: filters.page, limit: filters.limit, pages: Math.ceil(result.total / filters.limit) }
    });
  } catch (error) {
    next(error);
  }
});

// Get workflow by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflow = await workflowService.findById(req.params.id);
    if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
    res.json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
});

// Update workflow
router.put('/:id', validateBody(updateWorkflowSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflow = await workflowService.update(req.params.id, req.body);
    if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
    logger.info('Workflow updated via API', { workflowId: req.params.id });
    res.json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
});

// Submit workflow
router.post('/:id/submit', validateBody(submitWorkflowSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflow = await workflowService.submit(req.params.id, req.body);
    if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
    logger.info('Workflow submitted via API', { workflowId: req.params.id });
    res.json({ success: true, data: workflow });
  } catch (error: any) {
    if (error.message.includes('can only be submitted')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
});

// Approve workflow
router.post('/:id/approve', validateBody(approveWorkflowSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflow = await workflowService.approve(req.params.id, req.body);
    if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
    logger.info('Workflow approved via API', { workflowId: req.params.id, decision: req.body.decision });
    res.json({ success: true, data: workflow });
  } catch (error: any) {
    if (error.message.includes('not in a state')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
});

// Publish workflow
router.post('/:id/publish', validateBody(publishWorkflowSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workflow = await workflowService.publish(req.params.id, req.body);
    if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
    logger.info('Workflow published via API', { workflowId: req.params.id });
    res.json({ success: true, data: workflow });
  } catch (error: any) {
    if (error.message.includes('must be approved')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
});

// Get workflow history
router.get('/:id/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await workflowService.getHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
});

// Get workflow approvals
router.get('/:id/approvals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const approvals = await workflowService.getApprovals(req.params.id);
    res.json({ success: true, data: approvals });
  } catch (error) {
    next(error);
  }
});

export const workflowRoutes = router;