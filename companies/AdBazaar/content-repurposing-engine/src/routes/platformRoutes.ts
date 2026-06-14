import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getSupportedPlatforms } from '../services/platformConfig.js';

const router = Router();

// GET /api/platforms - Supported platforms info
router.get(
  '/',
  authMiddleware,
  async (_req, res: Response, next) => {
    try {
      const platforms = getSupportedPlatforms();

      const platformInfo = platforms.map((platform) => ({
        id: platform.id,
        name: platform.name,
        type: platform.type,
        capabilities: {
          maxTitleLength: platform.maxTitleLength,
          maxDescriptionLength: platform.maxDescriptionLength,
          maxHashtags: platform.maxHashtags,
          supportedAspectRatios: platform.supportedAspectRatios,
          features: platform.features,
        },
        formatting: platform.formatting,
      }));

      res.json({
        success: true,
        data: {
          platforms: platformInfo,
          total: platformInfo.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;