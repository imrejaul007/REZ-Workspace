import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { differentialPrivacyService } from '../services/differentialPrivacyService.js';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

const router = Router();

// Input validation schema
const DifferentialPrivacyComputeSchema = z.object({
  computationId: z.string().optional(),
  query: z.object({
    type: z.enum(['count', 'sum', 'mean', 'variance', 'histogram'], {
      errorMap: () => ({ message: 'Query type must be count, sum, mean, variance, or histogram' }),
    }),
    column: z.string().optional(),
    filters: z.record(z.string(), z.unknown()).optional(),
  }),
  privacyParams: z.object({
    epsilon: z.number().positive().default(1.0),
    delta: z.number().positive().optional().default(1e-5),
    sensitivity: z.number().positive().default(1.0),
    mechanism: z.enum(['laplace', 'gaussian', 'exponential']).default('laplace'),
  }),
  datasetSize: z.number().int().positive().default(1000),
  rawData: z.array(z.number()).optional(),
});

/**
 * POST /api/compute/differential-privacy
 * Execute differential privacy computation
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    // Validate input
    const validationResult = DifferentialPrivacyComputeSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validationResult.error.errors,
      });
    }

    const input = validationResult.data;

    logger.info('Differential privacy request received', {
      queryType: input.query.type,
      epsilon: input.privacyParams.epsilon,
    });

    // Execute differential privacy computation
    const result = await differentialPrivacyService.compute({
      computationId: input.computationId,
      query: input.query,
      privacyParams: input.privacyParams,
      datasetSize: input.datasetSize,
      rawData: input.rawData,
    });

    metrics.activeComputations.labels('differential_privacy').inc();

    res.status(200).json({
      success: true,
      data: result,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('Differential privacy computation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    next(error);
  }
});

/**
 * GET /api/compute/differential-privacy/:id
 * Get differential privacy computation status
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await differentialPrivacyService.getStatus(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Differential privacy computation not found',
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
 * POST /api/compute/differential-privacy/budget-check
 * Check if privacy budget allows for a new query
 */
router.post('/budget-check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { totalBudget, usedBudget, newQueryCost } = req.body;

    if (
      typeof totalBudget !== 'number' ||
      typeof usedBudget !== 'number' ||
      typeof newQueryCost !== 'number'
    ) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'totalBudget, usedBudget, and newQueryCost must be numbers',
      });
    }

    const result = await differentialPrivacyService.checkPrivacyBudget(
      totalBudget,
      usedBudget,
      newQueryCost
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
 * POST /api/compute/differential-privacy/compose
 * Compose multiple differential privacy queries
 */
router.post('/compose', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queries, compositionStrategy } = req.body;

    if (!Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'queries must be a non-empty array',
      });
    }

    // Validate queries
    const validatedQueries = queries.map(q => {
      const result = DifferentialPrivacyComputeSchema.safeParse(q);
      if (!result.success) {
        throw new Error(`Invalid query: ${result.error.message}`);
      }
      return result.data;
    });

    const totalBudget = await differentialPrivacyService.composeQueries(
      validatedQueries,
      compositionStrategy || 'basic'
    );

    res.json({
      success: true,
      data: {
        totalPrivacyBudget: totalBudget,
        queryCount: queries.length,
        compositionStrategy,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as differentialPrivacyRouter };
export default router;