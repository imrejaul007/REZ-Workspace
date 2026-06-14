import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { secureAggregationService } from '../services/secureAggregationService.js';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

const router = Router();

// Input validation schema
const SecureAggregationComputeSchema = z.object({
  computationId: z.string().optional(),
  participants: z.array(z.string()).min(2, 'At least 2 participants required'),
  values: z.record(z.string(), z.number(), {
    errorMap: () => ({ message: 'Values must be a record of participant ID to numeric value' }),
  }),
  config: z.object({
    secureSum: z.boolean().default(true),
    secureMean: z.boolean().default(false),
    clippingRange: z.number().positive().default(10.0),
    threshold: z.number().int().positive().default(2),
  }).optional(),
});

/**
 * POST /api/compute/secure-aggregation
 * Execute secure aggregation
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    // Validate input
    const validationResult = SecureAggregationComputeSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validationResult.error.errors,
      });
    }

    const input = validationResult.data;

    logger.info('Secure aggregation request received', {
      participants: input.participants.length,
    });

    // Execute secure aggregation
    const result = await secureAggregationService.compute({
      computationId: input.computationId,
      participants: input.participants,
      values: input.values,
      config: input.config,
    });

    metrics.activeComputations.labels('secure_aggregation').inc();

    res.status(200).json({
      success: true,
      data: result,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('Secure aggregation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    next(error);
  }
});

/**
 * GET /api/compute/secure-aggregation/:id
 * Get secure aggregation status
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await secureAggregationService.getStatus(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Secure aggregation not found',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compute/secure-aggregation/:id/verify
 * Verify secure aggregation result
 */
router.post('/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { expectedSum, tolerance } = req.body;

    if (typeof expectedSum !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'expectedSum must be a number',
      });
    }

    const result = await secureAggregationService.verifyAggregation(
      id,
      expectedSum,
      tolerance || 0.01
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compute/secure-aggregation/median
 * Calculate secure median
 */
router.post('/median', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { values } = req.body;

    if (!values || typeof values !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'values must be provided',
      });
    }

    const median = await secureAggregationService.secureMedian(values);

    res.json({
      success: true,
      data: {
        median,
        participantCount: Object.keys(values).length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compute/secure-aggregation/percentile
 * Calculate secure percentile
 */
router.post('/percentile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { values, percentile } = req.body;

    if (!values || typeof values !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'values must be provided',
      });
    }

    if (typeof percentile !== 'number' || percentile < 0 || percentile > 100) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'percentile must be a number between 0 and 100',
      });
    }

    const result = await secureAggregationService.securePercentile(values, percentile);

    res.json({
      success: true,
      data: {
        percentile,
        value: result,
        participantCount: Object.keys(values).length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as secureAggregationRouter };
export default router;