import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from 'utils/logger.js';

export const createMetadataSchema = z.object({
  contentId: z.string().min(1),
  contentType: z.string().min(1),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  attributes: z.record(z.any()).optional(),
  language: z.string().default('en'),
  region: z.string().optional(),
  audience: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional()
  }).optional(),
  visibility: z.enum(['public', 'private', 'restricted']).default('public'),
  createdBy: z.string().min(1)
});

export const updateMetadataSchema = z.object({
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  attributes: z.record(z.any()).optional(),
  language: z.string().optional(),
  region: z.string().optional(),
  audience: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional()
  }).optional(),
  visibility: z.enum(['public', 'private', 'restricted']).optional(),
  updatedBy: z.string().min(1)
});

export const createTaxonomySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['category', 'genre', 'topic', 'industry', 'custom']),
  parentId: z.string().optional(),
  metadata: z.object({
    icon: z.string().optional(),
    color: z.string().optional(),
    image: z.string().optional()
  }).optional()
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['content', 'brand', 'campaign', 'audience', 'custom']).default('content'),
  category: z.string().optional(),
  color: z.string().optional(),
  synonyms: z.array(z.string()).default([])
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().default(0),
  icon: z.string().optional(),
  image: z.string().optional()
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
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error', service: 'content-metadata-service' });
};