import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from 'utils/logger.js';

export const trackEventSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().optional(),
  eventType: z.enum(['view', 'click', 'scroll', 'share', 'download', 'comment', 'like', 'save']),
  eventData: z.object({
    element: z.string().optional(),
    position: z.object({
      x: z.number(),
      y: z.number()
    }).optional(),
    scrollDepth: z.number().min(0).max(100).optional(),
    referrer: z.string().optional(),
    device: z.string().optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional(),
    duration: z.number().optional(),
    metadata: z.record(z.any()).optional()
  }).optional()
});

export const createSegmentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  criteria: z.object({
    contentTypes: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime()
    }).optional(),
    minViews: z.number().optional(),
    maxViews: z.number().optional(),
    minEngagement: z.number().optional(),
    maxEngagement: z.number().optional(),
    countries: z.array(z.string()).optional(),
    devices: z.array(z.string()).optional(),
    referrers: z.array(z.string()).optional()
  }),
  createdBy: z.string().min(1)
});

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!token) {
    (req as any).user = { userId: 'system', role: 'admin' };
    return next();
  }
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64').toString());
    (req as any).user = { userId: payload.sub || payload.userId, role: payload.role || 'user' };
    next();
  } catch (error) {
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
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      next(error);
    }
  };
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request error', { error: err.message, stack: err.stack, path: req.path, method: req.method });
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error', service: 'content-heatmap-service' });
};