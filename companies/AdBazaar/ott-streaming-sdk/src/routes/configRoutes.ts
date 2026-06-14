import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getSDKConfig, updateSDKConfig, getAllConfigs } from '../services/configService.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const UpdateConfigSchema = z.object({
  sdkVersion: z.string().optional(),
  streamConfig: z.object({
    hls: z.object({
      enabled: z.boolean(),
      maxBitrate: z.number(),
      minBitrate: z.number(),
    }),
    dash: z.object({
      enabled: z.boolean(),
      manifestVersion: z.string(),
    }),
  }).optional(),
  drm: z.object({
    widevine: z.object({
      licenseUrl: z.string(),
      serverCertificate: z.string(),
    }),
    fairplay: z.object({
      licenseUrl: z.string(),
      certificateUrl: z.string(),
    }),
  }).optional(),
  analytics: z.object({
    endpoint: z.string(),
    heartbeatInterval: z.number(),
  }).optional(),
  adConfig: z.object({
    adServerUrl: z.string(),
    adTimeout: z.number(),
  }).optional(),
});

// GET /api/config - Get SDK configuration
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const appId = req.query.appId as string || req.appId || 'default';

    const config = await getSDKConfig(appId);

    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString(),
    });
  })
);

// PUT /api/config - Update SDK configuration
router.put(
  '/',
  optionalAuth,
  validateBody(UpdateConfigSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const appId = req.appId || 'default';
    const updates = req.body;

    const config = await updateSDKConfig(appId, updates);

    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/config/all - Get all configs (admin only)
router.get(
  '/all',
  asyncHandler(async (_req: Request, res: Response) => {
    const configs = await getAllConfigs();

    res.json({
      success: true,
      data: configs,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
