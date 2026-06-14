import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { mpcService } from '../services/mpcService.js';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

const router = Router();

// Input validation schema
const MPCComputeSchema = z.object({
  computationId: z.string().optional(),
  operation: z.enum(['addition', 'multiplication', 'comparison', 'dot_product'], {
    errorMap: () => ({ message: 'Operation must be addition, multiplication, comparison, or dot_product' }),
  }),
  parties: z.array(z.string()).min(2, 'At least 2 parties required'),
  inputs: z.record(z.string(), z.string(), {
    errorMap: () => ({ message: 'Inputs must be a record of party ID to encrypted value' }),
  }),
  config: z.object({
    threshold: z.number().int().positive().default(2),
    modulus: z.string().default('prime'),
  }).optional(),
});

/**
 * POST /api/compute/mpc
 * Execute multi-party computation
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    // Validate input
    const validationResult = MPCComputeSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validationResult.error.errors,
      });
    }

    const input = validationResult.data;

    logger.info('MPC computation request received', {
      operation: input.operation,
      parties: input.parties.length,
    });

    // Execute MPC
    const result = await mpcService.compute({
      computationId: input.computationId,
      operation: input.operation,
      parties: input.parties,
      inputs: input.inputs,
      config: input.config,
    });

    metrics.activeComputations.labels('mpc').inc();

    res.status(200).json({
      success: true,
      data: result,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('MPC computation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    next(error);
  }
});

/**
 * GET /api/compute/mpc/:id
 * Get MPC computation status
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await mpcService.getStatus(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'MPC computation not found',
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
 * POST /api/compute/mpc/:id/reconstruct
 * Reconstruct secret from shares
 */
router.post('/:id/reconstruct', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { shares, threshold } = req.body;

    if (!shares || !Array.isArray(shares) || shares.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Shares array is required',
      });
    }

    const reconstructed = await mpcService.reconstruct(shares, threshold || 2);

    if (!reconstructed) {
      return res.status(400).json({
        success: false,
        error: 'Reconstruction Failed',
        message: 'Not enough shares to reconstruct secret',
      });
    }

    res.json({
      success: true,
      data: {
        computationId: id,
        reconstructedValue: reconstructed,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as mpcRouter };
export default router;