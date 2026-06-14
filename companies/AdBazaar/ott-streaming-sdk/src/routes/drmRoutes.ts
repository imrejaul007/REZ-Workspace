import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { acquireDRMLicense, getDRMCertificates, validateDRMSession } from '../services/drmService.js';
import { streamingMetrics } from '../middleware/metrics.js';
import { validateBody } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Validation schema
const DRMLicenseRequestSchema = z.object({
  contentId: z.string(),
  drmType: z.enum(['widevine', 'fairplay']),
  deviceInfo: z.object({
    manufacturer: z.string(),
    model: z.string(),
    osVersion: z.string(),
  }),
});

const DRMValidateSchema = z.object({
  sessionToken: z.string(),
  contentId: z.string(),
});

// POST /api/drm/license - Acquire DRM license
router.post(
  '/license',
  validateBody(DRMLicenseRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const request = req.body;

    try {
      const license = await acquireDRMLicense(request);

      // Track metrics
      streamingMetrics.drmLicenseRequests.inc({
        drm_type: request.drmType,
        status: 'success',
      });

      res.json({
        success: true,
        data: license,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      streamingMetrics.drmLicenseRequests.inc({
        drm_type: request.drmType,
        status: 'error',
      });
      throw error;
    }
  })
);

// GET /api/drm/certificates/:drmType - Get DRM certificates
router.get(
  '/certificates/:drmType',
  asyncHandler(async (req: Request, res: Response) => {
    const drmType = req.params.drmType as 'widevine' | 'fairplay';

    if (!['widevine', 'fairplay'].includes(drmType)) {
      res.status(400).json({
        success: false,
        error: 'Invalid DRM type. Must be widevine or fairplay',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const certificates = await getDRMCertificates(drmType);

    res.json({
      success: true,
      data: certificates,
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/drm/validate - Validate DRM session
router.post(
  '/validate',
  validateBody(DRMValidateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionToken, contentId } = req.body;

    const isValid = await validateDRMSession(sessionToken, contentId);

    res.json({
      success: true,
      data: { valid: isValid },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
