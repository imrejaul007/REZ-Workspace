import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { matchingService, MergeInput } from '../services/matchingService';
import { confidenceService } from '../services/confidenceService';
import { mergeService } from '../services/mergeService';
import { logger } from '../utils/logger';
import { internalAuth } from '../middleware/auth';

const router = Router();

// Zod schemas for validation
const matchInputSchema = z.object({
  deviceIds: z.array(z.string()).min(2),
  features: z.object({
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    deviceFingerprint: z.string().optional(),
    behavioral: z.record(z.unknown()).optional(),
    temporal: z.object({
      firstSeen: z.string().datetime().optional(),
      lastSeen: z.string().datetime().optional(),
      sessionTimes: z.array(z.string()).optional()
    }).optional(),
    geographic: z.object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional(),
      timezone: z.string().optional()
    }).optional()
  }),
  sources: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  modelConfig: z.object({
    algorithm: z.enum(['naive-bayes', 'logistic-regression', 'random-forest', 'neural-network']).optional(),
    thresholds: z.object({
      highConfidence: z.number().optional(),
      mediumConfidence: z.number().optional(),
      lowConfidence: z.number().optional()
    }).optional(),
    weights: z.object({
      ip: z.number().optional(),
      userAgent: z.number().optional(),
      deviceFingerprint: z.number().optional(),
      behavioral: z.number().optional(),
      temporal: z.number().optional(),
      geographic: z.number().optional()
    }).optional()
  }).optional()
});

const batchMatchInputSchema = z.object({
  matches: z.array(matchInputSchema).min(1).max(100)
});

const mergeInputSchema = z.object({
  sourceMatchIds: z.array(z.string()).min(2),
  targetMatchId: z.string().optional(),
  reason: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

// POST /api/match/probabilistic - Probabilistic match
router.post('/probabilistic', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = matchInputSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const result = await matchingService.performMatch(validationResult.data);

    logger.info('Probabilistic match created', {
      matchId: result.matchId,
      deviceIds: result.deviceIds
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/match/batch - Batch matching
router.post('/batch', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = batchMatchInputSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const result = await matchingService.performBatchMatch(validationResult.data.matches);

    logger.info('Batch match completed', {
      total: result.total,
      successful: result.successful,
      failed: result.failed
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/match/:id - Get match result
router.get('/:id', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const match = await matchingService.getMatch(id);

    if (!match) {
      res.status(404).json({ error: 'Match not found', matchId: id });
      return;
    }

    res.json(match);
  } catch (error) {
    next(error);
  }
});

// GET /api/match/stats - Match statistics
router.get('/stats', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await matchingService.getMatchStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// POST /api/match/merge - Merge matches
router.post('/merge', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = mergeInputSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const result = await mergeService.mergeMatches(validationResult.data);

    logger.info('Match merge completed', {
      mergeId: result.mergeId,
      status: result.status
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/match/confidence/:id - Confidence score
router.get('/confidence/:id', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const thresholds = req.query.thresholds as string;

    let thresholdConfig;
    if (thresholds) {
      try {
        thresholdConfig = JSON.parse(thresholds);
      } catch {
        res.status(400).json({ error: 'Invalid thresholds JSON' });
        return;
      }
    }

    const result = await confidenceService.calculateConfidence(id, thresholdConfig);

    if (!result) {
      res.status(404).json({ error: 'Match not found', matchId: id });
      return;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/match/:id/confirm - Confirm a match
router.patch('/:id/confirm', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const match = await matchingService.confirmMatch(id);

    if (!match) {
      res.status(404).json({ error: 'Match not found', matchId: id });
      return;
    }

    logger.info('Match confirmed', { matchId: id });

    res.json(match);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/match/:id/reject - Reject a match
router.patch('/:id/reject', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const match = await matchingService.rejectMatch(id);

    if (!match) {
      res.status(404).json({ error: 'Match not found', matchId: id });
      return;
    }

    logger.info('Match rejected', { matchId: id });

    res.json(match);
  } catch (error) {
    next(error);
  }
});

// GET /api/match/device/:deviceId - Get matches for device
router.get('/device/:deviceId', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const matches = await matchingService.findMatchesForDevice(deviceId);

    res.json({
      deviceId,
      matchCount: matches.length,
      matches
    });
  } catch (error) {
    next(error);
  }
});

export default router;