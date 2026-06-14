import { Router, Request, Response } from 'express';
import { z } from 'zod';
import workflowService from '../services/workflowService';
import { CreateWorkflowInput, UpdateWorkflowInput, ApprovalActionInput, ApiResponse, PaginatedResponse, ApprovalWorkflow, ApprovalStatus } from '../types';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  steps: z.array(z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['review', 'approval', 'final_approval']),
    order: z.number().int().min(0),
    approverRole: z.string().min(1).max(50),
    requiredApprovals: z.number().int().min(1).default(1)
  })).min(1)
});

const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  steps: z.array(z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['review', 'approval', 'final_approval']),
    order: z.number().int().min(0),
    approverRole: z.string().min(1).max(50),
    requiredApprovals: z.number().int().min(1).default(1)
  })).optional(),
  isActive: z.boolean().optional()
});

const submitContentSchema = z.object({
  contentId: z.string().uuid(),
  workflowId: z.string().uuid()
});

const approvalActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_revision']),
  comment: z.string().max(1000).optional()
});

// Middleware to extract tenant ID
const getTenantId = (req: Request): string => {
  return req.headers['x-tenant-id'] as string || 'default';
};

const getUserId = (req: Request): string => {
  return req.headers['x-user-id'] as string || 'anonymous';
};

// Workflow routes
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = createWorkflowSchema.parse(req.body);
    const workflow = workflowService.createWorkflow(validatedData, tenantId);

    const response: ApiResponse<ApprovalWorkflow> = {
      success: true,
      data: workflow,
      message: 'Workflow created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error creating workflow:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const workflows = workflowService.getAllWorkflows(tenantId);

    const response: PaginatedResponse<ApprovalWorkflow> = {
      success: true,
      data: workflows,
      total: workflows.length,
      page: 1,
      limit: workflows.length,
      totalPages: 1
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching workflows:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const workflow = workflowService.getWorkflow(req.params.id, tenantId);

    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    const response: ApiResponse<ApprovalWorkflow> = {
      success: true,
      data: workflow
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching workflow:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = updateWorkflowSchema.parse(req.body);
    const workflow = workflowService.updateWorkflow(req.params.id, validatedData, tenantId);

    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    const response: ApiResponse<ApprovalWorkflow> = {
      success: true,
      data: workflow,
      message: 'Workflow updated successfully'
    };
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error updating workflow:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const deleted = workflowService.deleteWorkflow(req.params.id, tenantId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    res.json({ success: true, message: 'Workflow deleted successfully' });
  } catch (error) {
    logger.error('Error deleting workflow:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Submission routes
router.post('/submissions', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const validatedData = submitContentSchema.parse(req.body);
    const submission = workflowService.submitContent(validatedData, userId, tenantId);

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    const response: ApiResponse<typeof submission> = {
      success: true,
      data: submission,
      message: 'Content submitted for approval'
    };
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error submitting content:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/submissions/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const submission = workflowService.getSubmission(req.params.id, tenantId);

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    const history = workflowService.getSubmissionHistory(req.params.id, tenantId);

    const response: ApiResponse<typeof submission & { history: typeof history }> = {
      success: true,
      data: { ...submission, history }
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching submission:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/submissions/list/all', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as ApprovalStatus | undefined;
    const contentId = req.query.contentId as string | undefined;

    const { submissions, total } = workflowService.getSubmissions(tenantId, {
      page,
      limit,
      status,
      contentId
    });

    const response: PaginatedResponse<typeof submissions[0]> = {
      success: true,
      data: submissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching submissions:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Approval action routes
router.post('/submissions/:id/action', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const validatedData = approvalActionSchema.parse(req.body);
    const result = workflowService.performAction(req.params.id, validatedData, userId, tenantId);

    if (!result) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: `Action '${validatedData.action}' performed successfully`
    };
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error performing action:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
