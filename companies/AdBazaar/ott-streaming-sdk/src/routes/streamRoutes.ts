import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getStreamAsset, getManifest, getAllStreamAssets, searchStreamAssets } from '../services/streamService.js';
import { streamingMetrics } from '../middleware/metrics.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const StreamQuerySchema = z.object({
  region: z.string().optional(),
});

const ManifestQuerySchema = z.object({
  quality: z.string().optional().default('1080p'),
  type: z.enum(['hls', 'dash']).optional().default('hls'),
});

const SearchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.string().transform(Number).optional(),
});

// GET /api/stream/:contentId - Get stream URLs
router.get(
  '/:contentId',
  optionalAuth,
  validateQuery(StreamQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { contentId } = req.params;
    const { region } = req.query as { region?: string };

    const startTime = Date.now();
    const stream = await getStreamAsset(contentId, region);
    const duration = (Date.now() - startTime) / 1000;

    if (!stream) {
      streamingMetrics.streamLatency.observe({ cdn: 'none' }, duration);
      res.status(404).json({
        success: false,
        error: 'Stream not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Track quality distribution
    const qualityCount: Record<string, number> = {};
    for (const s of stream.streams) {
      qualityCount[s.quality] = (qualityCount[s.quality] || 0) + 1;
    }
    for (const [quality, count] of Object.entries(qualityCount)) {
      streamingMetrics.qualityDistribution.set({ quality }, count);
    }

    streamingMetrics.streamLatency.observe({ cdn: region || 'default' }, duration);

    res.json({
      success: true,
      data: stream,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/stream - Get all streams (admin)
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const streams = await getAllStreamAssets(limit, offset);

    res.json({
      success: true,
      data: streams,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
