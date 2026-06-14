import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { creatorService } from '../services';
import { logger } from '../services/logger.service';
import { CreatorStatus } from '../types';

const router = Router();

// Validation schemas
const createCreatorSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  bio: z.string().max(1000).optional(),
  avatar: z.string().url().optional(),
  socialLinks: z.object({
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    youtube: z.string().url().optional(),
    tiktok: z.string().url().optional(),
    website: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    facebook: z.string().url().optional(),
  }).optional(),
  categories: z.array(z.string()).optional(),
  bankDetails: z.object({
    accountNumber: z.string().min(1),
    ifsc: z.string().min(1),
    bankName: z.string().min(1),
    accountHolder: z.string().min(1),
    upiId: z.string().optional(),
  }).optional(),
});

const updateCreatorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(1000).optional(),
  avatar: z.string().url().optional(),
  socialLinks: z.object({
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    youtube: z.string().url().optional(),
    tiktok: z.string().url().optional(),
    website: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    facebook: z.string().url().optional(),
  }).optional(),
  categories: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  bankDetails: z.object({
    accountNumber: z.string().min(1),
    ifsc: z.string().min(1),
    bankName: z.string().min(1),
    accountHolder: z.string().min(1),
    upiId: z.string().optional(),
  }).optional(),
});

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// ============================================
// CREATOR ROUTES
// ============================================

/**
 * GET /api/creators
 * List all creators with pagination and filters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as CreatorStatus | undefined;
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const sortBy = req.query.sortBy as string || 'createdAt';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

  const result = await creatorService.list({
    page,
    limit,
    status,
    category,
    search,
    sortBy,
    sortOrder,
  });

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * POST /api/creators
 * Create a new creator
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createCreatorSchema.parse(req.body);

  // Check if email already exists
  const existing = await creatorService.getByEmail(validatedData.email);
  if (existing) {
    res.status(400).json({
      success: false,
      error: 'Email already registered',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const creator = await creatorService.create(validatedData);

  logger.info(`Creator created via API: ${creator._id}`);

  res.status(201).json({
    success: true,
    data: creator,
    message: 'Creator created successfully',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/creators/:id
 * Get creator by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const creator = await creatorService.getById(id);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: creator,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * PUT /api/creators/:id
 * Update creator
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateCreatorSchema.parse(req.body);

  const creator = await creatorService.update(id, validatedData);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info(`Creator updated via API: ${id}`);

  res.json({
    success: true,
    data: creator,
    message: 'Creator updated successfully',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * DELETE /api/creators/:id
 * Delete creator
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = await creatorService.delete(id);
  if (!deleted) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info(`Creator deleted via API: ${id}`);

  res.json({
    success: true,
    message: 'Creator deleted successfully',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/creators/:id/stats
 * Get creator stats
 */
router.get('/:id/stats', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const stats = await creatorService.getStats(id);
  if (!stats) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * POST /api/creators/:id/onboarding
 * Complete creator onboarding
 */
router.post('/:id/onboarding', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const creator = await creatorService.completeOnboarding(id);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info(`Creator onboarding completed: ${id}`);

  res.json({
    success: true,
    data: creator,
    message: 'Onboarding completed successfully',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/creators/top
 * Get top creators by earnings
 */
router.get('/top/earners', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;

  const creators = await creatorService.getTopCreators(limit);

  res.json({
    success: true,
    data: creators,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/creators/category/:category
 * Get creators by category
 */
router.get('/category/:category', asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;

  const creators = await creatorService.getByCategory(category);

  res.json({
    success: true,
    data: creators,
    timestamp: new Date().toISOString(),
  });
}));

export default router;