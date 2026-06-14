import { Router, Request, Response } from 'express';
import {
  createApprovalRequest,
  getApprovalRequest,
  getApprovalsByWorkflow,
  getApprovalsByAssignee,
  resolveApproval,
  cancelApproval,
  addComment,
  reassignApproval,
  getApprovalStats,
  getTemplates,
  getTemplate,
} from '../services/approval.service';
import logger from '../utils/logger';

const router = Router();

// POST /api/approvals - Create new approval request
router.post('/', (req: Request, res: Response) => {
  try {
    const { workflowId, nodeId, title, description, requestedBy, context, templateId, priority, approverId, approverType, timeoutMinutes, assigneeId } = req.body;

    if (!workflowId || !nodeId || !title || !requestedBy) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const request = createApprovalRequest(workflowId, nodeId, title, description, requestedBy, context || {}, {
      templateId,
      priority,
      approverId,
      approverType,
      timeoutMinutes,
      assigneeId,
    });

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    logger.error('Error creating approval:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/approvals - List approvals with filters
router.get('/', (req: Request, res: Response) => {
  try {
    const { workflowId, assigneeId, status } = req.query;

    let results = Array.from(Object.values({}));

    if (workflowId) {
      results = getApprovalsByWorkflow(workflowId as string);
    } else if (assigneeId) {
      results = getApprovalsByAssignee(assigneeId as string);
    } else {
      // Return pending approvals for current user (placeholder)
      results = [];
    }

    if (status) {
      results = results.filter((r: any) => r.status === status);
    }

    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    logger.error('Error fetching approvals:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/approvals/stats - Get approval statistics
router.get('/stats', (req: Request, res: Response) => {
  try {
    const { workflowId, assigneeId } = req.query;
    const stats = getApprovalStats({
      workflowId: workflowId as string,
      assigneeId: assigneeId as string,
    });
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/approvals/templates - List approval templates
router.get('/templates', (_req: Request, res: Response) => {
  res.json({ success: true, data: getTemplates() });
});

// GET /api/approvals/templates/:id - Get template by ID
router.get('/templates/:id', (req: Request, res: Response) => {
  const template = getTemplate(req.params.id);
  if (!template) {
    res.status(404).json({ success: false, error: 'Template not found' });
    return;
  }
  res.json({ success: true, data: template });
});

// GET /api/approvals/pending - Get pending approvals for current user
router.get('/pending', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User ID required' });
      return;
    }
    const pending = getApprovalsByAssignee(userId);
    res.json({ success: true, data: pending, count: pending.length });
  } catch (error) {
    logger.error('Error fetching pending approvals:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/approvals/:id - Get approval by ID
router.get('/:id', (req: Request, res: Response) => {
  const request = getApprovalRequest(req.params.id);
  if (!request) {
    res.status(404).json({ success: false, error: 'Approval not found' });
    return;
  }
  res.json({ success: true, data: request });
});

// POST /api/approvals/:id/resolve - Resolve an approval
router.post('/:id/resolve', (req: Request, res: Response) => {
  try {
    const { resolution, resolvedBy, details, modifiedContext } = req.body;

    if (!resolution || !resolvedBy) {
      res.status(400).json({ success: false, error: 'Resolution and resolvedBy are required' });
      return;
    }

    if (!['approved', 'rejected', 'modified'].includes(resolution)) {
      res.status(400).json({ success: false, error: 'Invalid resolution' });
      return;
    }

    const request = resolveApproval(req.params.id, resolution, resolvedBy, details, modifiedContext);
    if (!request) {
      res.status(404).json({ success: false, error: 'Approval not found or already resolved' });
      return;
    }

    res.json({ success: true, data: request, message: `Approval ${resolution}` });
  } catch (error) {
    logger.error('Error resolving approval:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/approvals/:id/cancel - Cancel an approval
router.post('/:id/cancel', (req: Request, res: Response) => {
  try {
    const { cancelledBy, reason } = req.body;

    if (!cancelledBy) {
      res.status(400).json({ success: false, error: 'cancelledBy is required' });
      return;
    }

    const request = cancelApproval(req.params.id, cancelledBy, reason);
    if (!request) {
      res.status(404).json({ success: false, error: 'Approval not found' });
      return;
    }

    res.json({ success: true, data: request, message: 'Approval cancelled' });
  } catch (error) {
    logger.error('Error cancelling approval:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/approvals/:id/comment - Add comment to approval
router.post('/:id/comment', (req: Request, res: Response) => {
  try {
    const { comment, commentedBy } = req.body;

    if (!comment || !commentedBy) {
      res.status(400).json({ success: false, error: 'Comment and commentedBy are required' });
      return;
    }

    const request = addComment(req.params.id, comment, commentedBy);
    if (!request) {
      res.status(404).json({ success: false, error: 'Approval not found' });
      return;
    }

    res.json({ success: true, data: request, message: 'Comment added' });
  } catch (error) {
    logger.error('Error adding comment:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/approvals/:id/reassign - Reassign approval
router.post('/:id/reassign', (req: Request, res: Response) => {
  try {
    const { newAssigneeId, newAssigneeName, reassignedBy } = req.body;

    if (!newAssigneeId || !newAssigneeName || !reassignedBy) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const request = reassignApproval(req.params.id, newAssigneeId, newAssigneeName, reassignedBy);
    if (!request) {
      res.status(404).json({ success: false, error: 'Approval not found' });
      return;
    }

    res.json({ success: true, data: request, message: 'Approval reassigned' });
  } catch (error) {
    logger.error('Error reassigning approval:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
