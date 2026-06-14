import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getManifest } from '../services/streamService.js';
import { streamingMetrics } from '../middleware/metrics.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const ManifestQuerySchema = z.object({
  quality: z.string().optional().default('1080p'),
  type: z.enum(['hls', 'dash']).optional().default('hls'),
});

// GET /api/manifest/:contentId - Get processed manifest
router.get(
  '/:contentId',
  optionalAuth,
  validateQuery(ManifestQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { contentId } = req.params;
    const { quality, type } = req.query as { quality?: string; type?: 'hls' | 'dash' };

    const manifest = await getManifest(contentId, quality, type);

    if (!manifest) {
      res.status(404).json({
        success: false,
        error: 'Manifest not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      data: manifest,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
