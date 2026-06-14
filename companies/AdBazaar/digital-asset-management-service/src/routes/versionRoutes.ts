import { Router, Request, Response, NextFunction } from 'express';
import { assetService } from '../services/assetService';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation schema
const createVersionSchema = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  size: z.number().positive(),
  checksum: z.string().min(1),
  changes: z.string().optional(),
  createdBy: z.string().min(1)
});

// Create new version
router.post('/:id/versions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    createVersionSchema.parse(req.body);

    const version = await assetService.createVersion(req.params.id, req.body);
    if (!version) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    logger.info('Asset version created via API', {
      assetId: req.params.id,
      version: version.version
    });

    res.status(201).json({
      success: true,
      data: version
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    next(error);
  }
});

// Get all versions for an asset
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

export const versionRoutes = router;