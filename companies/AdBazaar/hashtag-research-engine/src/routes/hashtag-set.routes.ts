import { Router, Request, Response } from 'express';
import {
  listHashtagSets,
  createHashtagSet,
  getHashtagSetById,
  updateHashtagSet,
  deleteHashtagSet,
  searchHashtagSets,
  getPopularHashtagSets,
  incrementUsageCount,
} from '../services/hashtag-set.service';
import { asyncHandler, AuthenticatedRequest } from '../middleware';
import { createHashtagSetSchema } from '../utils/validators';
import { hashtagSetCounter } from '../config/prometheus';

const router = Router();

// List hashtag sets
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { limit, offset, category, isPublic } = req.query;

    const result = await listHashtagSets({
      limit: limit ? parseInt(limit as string, 10) : 20,
      offset: offset ? parseInt(offset as string, 10) : 0,
      category: category as string,
      isPublic: isPublic !== undefined ? isPublic === 'true' : true,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// Get popular sets
router.get(
  '/popular',
  asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query;
    const sets = await getPopularHashtagSets(limit ? parseInt(limit as string, 10) : 10);

    res.json({
      success: true,
      data: sets,
    });
  })
);

// Search hashtag sets
router.get(
  '/search',
  asyncHandler(async (req: Request, res: Response) => {
    const { q, limit, offset } = req.query;

    if (!q) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Query parameter "q" is required',
      });
      return;
    }

    const result = await searchHashtagSets(q as string, {
      limit: limit ? parseInt(limit as string, 10) : 20,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// Get hashtag set by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const set = await getHashtagSetById(id);

    if (!set) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Hashtag set not found',
      });
      return;
    }

    // Increment usage count
    await incrementUsageCount(id);

    res.json({
      success: true,
      data: set,
    });
  })
);

// Create hashtag set
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const validated = createHashtagSetSchema.parse(req.body);

    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;

    const set = await createHashtagSet({
      name: validated.name,
      tags: validated.tags,
      category: validated.category,
      isPublic: validated.isPublic,
      createdBy: userId,
    });

    hashtagSetCounter.inc();

    res.status(201).json({
      success: true,
      data: set,
    });
  })
);

// Update hashtag set
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const set = await updateHashtagSet(id, updates);

    if (!set) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Hashtag set not found',
      });
      return;
    }

    res.json({
      success: true,
      data: set,
    });
  })
);

// Delete hashtag set
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await deleteHashtagSet(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Hashtag set not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Hashtag set deleted successfully',
    });
  })
);

export default router;