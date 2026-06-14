import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from 'utils/logger.js';

export const createLocalizationSchema = z.object({
  contentId: z.string().min(1),
  contentType: z.string().min(1),
  sourceLocale: z.string().min(2),
  targetLocale: z.string().min(2),
  translations: z.array(z.object({
    field: z.string().min(1),
    sourceText: z.string().min(1),
    translatedText: z.string().min(1),
    machineTranslated: z.boolean().optional(),
    confidence: z.number().min(0).max(1).optional()
  })).optional(),
  createdBy: z.string().min(1)
});

export const updateLocalizationSchema = z.object({
  status: z.enum(['draft', 'in_progress', 'review', 'approved', 'published']).optional(),
  translations: z.array(z.object({
    field: z.string().min(1),
    sourceText: z.string().optional(),
    translatedText: z.string().min(1),
    status: z.enum(['pending', 'in_progress', 'completed', 'rejected']).optional(),
    translator: z.string().optional(),
    notes: z.string().optional()
  })).optional(),
  updatedBy: z.string().min(1)
});

export const translateSchema = z.object({
  fields: z.array(z.object({
    field: z.string().min(1),
    sourceText: z.string().min(1)
  })),
  translator: z.string().min(1),
  useMachineTranslation: z.boolean().default(true)
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
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error', service: 'content-localization-service' });
};