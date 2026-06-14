import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { fingerprintService } from '../services/fingerprintService';
import { logger } from '../utils/logger';
import { internalAuth } from '../middleware/auth';

const router = Router();

// Zod schemas for validation
const fingerprintInputSchema = z.object({
  deviceId: z.string().min(1),
  features: z.object({
    userAgent: z.string().optional(),
    screenResolution: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
    platform: z.string().optional(),
    browser: z.string().optional(),
    cookiesEnabled: z.boolean().optional(),
    doNotTrack: z.boolean().optional(),
    javaEnabled: z.boolean().optional(),
    webglVendor: z.string().optional(),
    webglRenderer: z.string().optional(),
    audioContext: z.string().optional(),
    fonts: z.array(z.string()).optional(),
    canvas: z.string().optional(),
    plugins: z.array(z.string()).optional(),
    headers: z.record(z.string()).optional()
  }),
  sources: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional()
});

const fingerprintUpdateSchema = z.object({
  features: z.object({
    userAgent: z.string().optional(),
    screenResolution: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
    platform: z.string().optional(),
    browser: z.string().optional(),
    cookiesEnabled: z.boolean().optional(),
    doNotTrack: z.boolean().optional(),
    javaEnabled: z.boolean().optional(),
    webglVendor: z.string().optional(),
    webglRenderer: z.string().optional(),
    audioContext: z.string().optional(),
    fonts: z.array(z.string()).optional(),
    canvas: z.string().optional(),
    plugins: z.array(z.string()).optional(),
    headers: z.record(z.string()).optional()
  })
});

// POST /api/match/fingerprint - Create fingerprint
router.post('/', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = fingerprintInputSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const result = await fingerprintService.createFingerprint(validationResult.data);

    logger.info('Fingerprint created', {
      fingerprintId: result.fingerprintId,
      deviceId: result.deviceId
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/match/fingerprint/:id - Get fingerprint
router.get('/:id', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const fingerprint = await fingerprintService.getFingerprint(id);

    if (!fingerprint) {
      res.status(404).json({ error: 'Fingerprint not found', fingerprintId: id });
      return;
    }

    res.json(fingerprint);
  } catch (error) {
    next(error);
  }
});

// GET /api/match/fingerprint/device/:deviceId - Get fingerprints for device
router.get('/device/:deviceId', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const fingerprints = await fingerprintService.getFingerprintsForDevice(deviceId);

    res.json({
      deviceId,
      fingerprintCount: fingerprints.length,
      fingerprints
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/match/fingerprint/similar/:hash - Find similar fingerprints
router.get('/similar/:hash', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hash } = req.params;
    const threshold = parseFloat(req.query.threshold as string) || 0.8;

    const fingerprints = await fingerprintService.findSimilarFingerprints(hash, threshold);

    res.json({
      hash,
      threshold,
      similarCount: fingerprints.length,
      fingerprints
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/match/fingerprint/compare - Compare two fingerprints
router.post('/compare', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fingerprintId1, fingerprintId2 } = req.body;

    if (!fingerprintId1 || !fingerprintId2) {
      res.status(400).json({ error: 'Both fingerprint IDs are required' });
      return;
    }

    const result = await fingerprintService.compareFingerprints(fingerprintId1, fingerprintId2);

    if (!result) {
      res.status(404).json({ error: 'One or both fingerprints not found' });
      return;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/match/fingerprint/:id - Update fingerprint
router.put('/:id', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validationResult = fingerprintUpdateSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const fingerprint = await fingerprintService.updateFingerprint(id, validationResult.data.features);

    if (!fingerprint) {
      res.status(404).json({ error: 'Fingerprint not found', fingerprintId: id });
      return;
    }

    logger.info('Fingerprint updated', { fingerprintId: id });

    res.json(fingerprint);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/match/fingerprint/:id - Deactivate fingerprint
router.delete('/:id', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const fingerprint = await fingerprintService.deactivateFingerprint(id);

    if (!fingerprint) {
      res.status(404).json({ error: 'Fingerprint not found', fingerprintId: id });
      return;
    }

    logger.info('Fingerprint deactivated', { fingerprintId: id });

    res.json({ message: 'Fingerprint deactivated', fingerprintId: id });
  } catch (error) {
    next(error);
  }
});

// GET /api/match/fingerprint/stats - Get fingerprint statistics
router.get('/stats', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deviceId = req.query.deviceId as string | undefined;
    const stats = await fingerprintService.getFingerprintStats(deviceId);

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;