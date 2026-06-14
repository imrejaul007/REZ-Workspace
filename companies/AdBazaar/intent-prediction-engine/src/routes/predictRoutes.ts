import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../config/logger.js';
import { authenticate } from '../middleware/auth.js';
import { intentScoringService } from '../services/IntentScoringService.js';
import { dormancyDetectionService } from '../services/DormancyDetectionService.js';
import { audienceSegmentationService } from '../services/AudienceSegmentationService.js';
import { lookalikeGenerationService } from '../services/LookalikeGenerationService.js';
import { timingPredictionService } from '../services/TimingPredictionService.js';
import {
  IntentSignalSchema,
  AudienceSegmentRequestSchema,
  LookalikeRequestSchema,
  IntentCategory,
  ApiResponse,
  IntentScoreResult,
  DormantIntent,
  LookalikeResult,
} from '../types.js';

const router = Router();

// Validation schemas
const intentScoreSchema = z.object({
  userId: z.string().min(1),
  category: z.enum(['DINING', 'TRAVEL', 'RETAIL', 'HEALTHCARE', 'GENERAL']),
  intentKey: z.string().min(1),
  signals: z.object({
    searchQueries: z.array(z.string()).optional(),
    pageViews: z.number().optional(),
    dwellTime: z.number().optional(),
    clicks: z.number().optional(),
    conversions: z.number().optional(),
    engagementScore: z.number().min(0).max(1).optional(),
  }),
});

const audienceSegmentSchema = z.object({
  category: z.enum(['DINING', 'TRAVEL', 'RETAIL', 'HEALTHCARE', 'GENERAL']).optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  maxDaysDormant: z.number().optional(),
  geoFilters: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(10000).default(1000),
});

const lookalikeSchema = z.object({
  sourceSegmentId: z.string().min(1),
  targetSize: z.number().int().min(1).max(100000).default(1000),
  similarityThreshold: z.number().min(0).max(1).default(0.7),
});

// Helper for API responses
function sendResponse<T>(res: Response, data: T, status = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  res.status(status).json(response);
}

function sendError(res: Response, error: string, status = 400): void {
  res.status(status).json({
    success: false,
    error,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/predict/intent-score
 * Get intent confidence score for user/category
 */
router.post('/intent-score', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = intentScoreSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      sendError(res, `Validation error: ${errors.join(', ')}`, 400);
      return;
    }

    const signal = {
      ...validationResult.data,
      timestamp: new Date(),
    };

    logger.info('Intent score request', {
      userId: signal.userId,
      category: signal.category,
      intentKey: signal.intentKey,
    });

    const result = await intentScoringService.scoreIntent(signal);

    sendResponse(res, result);
  } catch (error) {
    logger.error('Error in intent-score endpoint', { error: (error as Error).message });
    sendError(res, 'Failed to calculate intent score', 500);
  }
});

/**
 * POST /api/predict/audience
 * Generate intent audience segment
 */
router.post('/audience', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = audienceSegmentSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      sendError(res, `Validation error: ${errors.join(', ')}`, 400);
      return;
    }

    logger.info('Audience segment request', validationResult.data);

    const result = await audienceSegmentationService.generateAudienceSegment(validationResult.data);

    sendResponse(res, {
      segment: result.segment,
      userCount: result.userIds.length,
      userIds: result.userIds.slice(0, 100), // Return first 100 for preview
      totalMatched: result.userIds.length,
    });
  } catch (error) {
    logger.error('Error in audience endpoint', { error: (error as Error).message });
    sendError(res, 'Failed to generate audience segment', 500);
  }
});

/**
 * GET /api/predict/revival-candidates
 * Get dormant intents ready for revival
 */
router.get('/revival-candidates', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const minScore = parseFloat(req.query.minScore as string) || 0.5;
    const maxDaysDormant = parseInt(req.query.maxDaysDormant as string, 10) || 90;
    const category = req.query.category as string | undefined;
    const limit = parseInt(req.query.limit as string, 10) || 100;

    logger.info('Revival candidates request', { minScore, maxDaysDormant, category, limit });

    const candidates = await dormancyDetectionService.findRevivalCandidates({
      minScore,
      maxDaysDormant,
      category,
      limit,
    });

    const formattedCandidates = candidates.map((c) => ({
      dormantIntentId: c.dormantIntentId,
      userId: c.userId,
      category: c.category,
      intentKey: c.intentKey,
      daysDormant: c.daysDormant,
      revivalScore: c.revivalScore,
      idealTiming: c.idealTiming,
      lastSignalTimestamp: c.lastSignalTimestamp,
    }));

    sendResponse(res, {
      candidates: formattedCandidates,
      count: formattedCandidates.length,
      filters: { minScore, maxDaysDormant, category, limit },
    });
  } catch (error) {
    logger.error('Error in revival-candidates endpoint', { error: (error as Error).message });
    sendError(res, 'Failed to get revival candidates', 500);
  }
});

/**
 * POST /api/predict/lookalike
 * Generate lookalike audience
 */
router.post('/lookalike', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = lookalikeSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      sendError(res, `Validation error: ${errors.join(', ')}`, 400);
      return;
    }

    logger.info('Lookalike request', validationResult.data);

    const result = await lookalikeGenerationService.generateLookalike(validationResult.data);

    sendResponse(res, result);
  } catch (error) {
    logger.error('Error in lookalike endpoint', { error: (error as Error).message });
    if ((error as Error).message.includes('not found')) {
      sendError(res, 'Source segment not found', 404);
    } else {
      sendError(res, 'Failed to generate lookalike audience', 500);
    }
  }
});

/**
 * GET /api/predict/segments
 * List available segments
 */
router.get('/segments', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.query.category as IntentCategory | undefined;
    const status = req.query.status as 'active' | 'paused' | 'archived' | undefined;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    logger.info('Segments list request', { category, status, page, limit });

    const result = await audienceSegmentationService.listSegments({
      category,
      status,
      page,
      limit,
    });

    sendResponse(res, {
      segments: result.segments.map((s) => ({
        segmentId: s.segmentId,
        name: s.name,
        description: s.description,
        category: s.category,
        criteria: s.criteria,
        userCount: s.userCount,
        avgConfidence: s.avgConfidence,
        qualityScore: s.qualityScore,
        status: s.status,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    logger.error('Error in segments endpoint', { error: (error as Error).message });
    sendError(res, 'Failed to list segments', 500);
  }
});

/**
 * GET /api/predict/segments/:segmentId
 * Get segment by ID
 */
router.get('/segments/:segmentId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { segmentId } = req.params;

    logger.info('Get segment request', { segmentId });

    const segment = await audienceSegmentationService.getSegment(segmentId);

    if (!segment) {
      sendError(res, 'Segment not found', 404);
      return;
    }

    sendResponse(res, segment);
  } catch (error) {
    logger.error('Error in get segment endpoint', { error: (error as Error).message });
    sendError(res, 'Failed to get segment', 500);
  }
});

/**
 * POST /api/predict/segments
 * Create a new segment
 */
router.post('/segments', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const createSchema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().min(1).max(500),
      category: z.enum(['DINING', 'TRAVEL', 'RETAIL', 'HEALTHCARE', 'GENERAL']),
      criteria: z.object({
        minConfidence: z.number().min(0).max(1),
        maxDaysDormant: z.number().optional(),
        sources: z.array(z.string()).optional(),
        geoFilters: z.array(z.string()).optional(),
      }),
    });

    const validationResult = createSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      sendError(res, `Validation error: ${errors.join(', ')}`, 400);
      return;
    }

    logger.info('Create segment request', validationResult.data);

    const segment = await audienceSegmentationService.createSegment(validationResult.data);

    sendResponse(res, segment, 201);
  } catch (error) {
    logger.error('Error in create segment endpoint', { error: (error as Error).message });
    sendError(res, 'Failed to create segment', 500);
  }
});

/**
 * GET /api/predict/timing/:userId
 * Predict optimal timing for user
 */
router.get('/timing/:userId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const category = req.query.category as string || 'GENERAL';

    logger.info('Timing prediction request', { userId, category });

    const prediction = await timingPredictionService.predictOptimalTiming(userId, category, 'general');

    sendResponse(res, prediction);
  } catch (error) {
    logger.error('Error in timing endpoint', { error: (error as Error).message });
    sendError(res, 'Failed to predict timing', 500);
  }
});

/**
 * GET /api/predict/statistics
 * Get dormancy detection statistics
 */
router.get('/statistics', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Statistics request');

    const stats = await dormancyDetectionService.getStatistics();

    sendResponse(res, stats);
  } catch (error) {
    logger.error('Error in statistics endpoint', { error: (error as Error).message });
    sendError(res, 'Failed to get statistics', 500);
  }
});

/**
 * POST /api/predict/batch-score
 * Batch score multiple intent signals
 */
router.post('/batch-score', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const batchSchema = z.object({
      signals: z.array(intentScoreSchema).min(1).max(100),
    });

    const validationResult = batchSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      sendError(res, `Validation error: ${errors.join(', ')}`, 400);
      return;
    }

    logger.info('Batch score request', { count: validationResult.data.signals.length });

    const signalsWithTimestamp = validationResult.data.signals.map((s) => ({
      ...s,
      timestamp: new Date(),
    }));

    const results = await intentScoringService.batchScore(signalsWithTimestamp);

    sendResponse(res, {
      results,
      count: results.length,
      avgConfidence: results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length,
    });
  } catch (error) {
    logger.error('Error in batch-score endpoint', { error: (error as Error).message });
    sendError(res, 'Failed to batch score', 500);
  }
});

export default router;