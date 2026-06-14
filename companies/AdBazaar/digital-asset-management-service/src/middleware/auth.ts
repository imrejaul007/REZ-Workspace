import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Validation schemas
export const createAssetSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['image', 'video', 'audio', 'document', 'other']),
  mimeType: z.string().min(1),
  size: z.number().positive(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  folderId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    duration: z.number().optional(),
    format: z.string().optional(),
    colorSpace: z.string().optional(),
    resolution: z.string().optional()
  }).optional(),
  permissions: z.object({
    public: z.boolean().default(false),
    allowedUsers: z.array(z.string()).optional(),
    allowedRoles: z.array(z.string()).optional()
  }).optional(),
  createdBy: z.string().min(1),
  updatedBy: z.string().min(1)
});

export const updateAssetSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  folderId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    duration: z.number().optional(),
    format: z.string().optional(),
    colorSpace: z.string().optional(),
    resolution: z.string().optional()
  }).optional(),
  status: z.enum(['draft', 'active', 'archived', 'deleted']).optional(),
  updatedBy: z.string().min(1)
});

export const createVersionSchema = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  size: z.number().positive(),
  checksum: z.string().min(1),
  changes: z.string().optional(),
  createdBy: z.string().min(1)
});

export const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  parentId: z.string().optional(),
  createdBy: z.string().min(1),
  permissions: z.object({
    public: z.boolean().default(false),
    allowedUsers: z.array(z.string()).optional(),
    allowedRoles: z.array(z.string()).optional()
  }).optional()
});

// Auth middleware
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token && process.env.NODE_ENV === 'production') {
    logger.warn('Authentication failed: No token provided', { path: req.path });
    return res.status(401).json({ error: 'Authentication required' });
  }

  // In development, allow requests without auth
  if (!token) {
    (req as any).user = { userId: 'system', role: 'admin' };
    return next();
  }

  try {
    // In production, validate the token with RABTUL auth service
    // For now, decode basic JWT structure
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

// Validation middleware factory
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation failed', { errors: error.errors });
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
};

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    service: 'digital-asset-management-service'
  });
};