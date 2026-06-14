import { Router, Request, Response, NextFunction } from 'express';
import { assetService } from '../services/assetService';
import { authMiddleware, validateBody, createAssetSchema, updateAssetSchema } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create asset
router.post('/', validateBody(createAssetSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await assetService.create(req.body);
    logger.info('Asset created via API', { assetId: asset.assetId });
    res.status(201).json({
      success: true,
      data: asset
    });
  } catch (error) {
    next(error);
  }
});

// Get all assets with filters
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      type: req.query.type as string,
      status: req.query.status as string,
      folderId: req.query.folderId as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await assetService.findAll(filters);
    res.json({
      success: true,
      data: result.assets,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single asset by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await assetService.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    // Increment views
    await assetService.incrementAnalytics(req.params.id, 'views');

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    next(error);
  }
});

// Update asset
router.put('/:id', validateBody(updateAssetSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await assetService.update(req.params.id, req.body);
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    logger.info('Asset updated via API', { assetId: req.params.id });
    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    next(error);
  }
});

// Delete asset (soft delete)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await assetService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    logger.info('Asset deleted via API', { assetId: req.params.id });
    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get asset versions
router.get('/:id/versions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const versions = await assetService.getVersions(req.params.id);
    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    next(error);
  }
});

// Track analytics
router.post('/:id/track', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.body;
    if (!['views', 'downloads', 'shares'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid analytics type'
      });
    }

    await assetService.incrementAnalytics(req.params.id, type);
    res.json({
      success: true,
      message: 'Analytics tracked'
    });
  } catch (error) {
    next(error);
  }
});

export const assetRoutes = router;