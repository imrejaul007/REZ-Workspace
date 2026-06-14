import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from 'utils/logger.js';

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['content_review', 'campaign_approval', 'asset_publishing', 'custom']),
  contentId: z.string().optional(),
  contentType: z.string().optional(),
  stages: z.array(z.object({
    name: z.string().min(1),
    order: z.number().min(0),
    type: z.enum(['submission', 'review', 'approval', 'publish']),
    assignees: z.array(z.string()),
    requiredApprovals: z.number().min(1).default(1)
  })).min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  createdBy: z.string().min(1),
  assignedTo: z.string().optional(),
  deadline: z.string().datetime().optional()
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional(),
  deadline: z.string().datetime().optional()
});

export const submitWorkflowSchema = z.object({
  submittedBy: z.string().min(1),
  comments: z.string().optional()
});

export const approveWorkflowSchema = z.object({
  approverId: z.string().min(1),
  approverName: z.string().min(1),
  decision: z.enum(['approve', 'reject', 'request_changes']),
  comments: z.string().optional(),
  delegatedTo: z.string().optional()
});

export const publishWorkflowSchema = z.object({
  publishedBy: z.string().min(1),
  comments: z.string().optional()
});

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token && process.env.NODE_ENV === 'production') {
    logger.warn('Authentication failed: No token provided', { path: req.path });
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!token) {
    (req as any).user = { userId: 'system', role: 'admin' };
    return next();
  }
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64').toString());
    (req as any).user = {
      userId: payload.sub || payload.userId,
      role: payload.role || 'user'
    };
    next();
  } catch (error) {
    logger.warn('Authentication failed: Invalid token', { error });
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    (req as any).user = { userId: 'system', role: 'admin' };
    next();
  }
};

export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation failed', { errors: error.errors });
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      next(error);
    }
  };
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request error', { error: err.message, stack: err.stack, path: req.path, method: req.method });
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation Error', details: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    service: 'content-workflow-service'
  });
};