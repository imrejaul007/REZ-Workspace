import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { federatedService } from '../services/federatedService.js';
import { FederatedInputSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

const router = Router();

// Input validation schema
const FederatedComputeSchema = z.object({
  computationId: z.string().optional(),
  modelId: z.string().min(1, 'Model ID is required'),
  participants: z.array(z.string()).min(2, 'At least 2 participants required'),
  config: z.object({
    rounds: z.number().int().positive().default(10),
    minParticipants: z.number().int().positive().default(2),
    aggregationStrategy: z.enum(['fedavg', 'fedmed', 'fedopt']).default('fedavg'),
    privacyBudget: z.number().positive().default(1.0),
    clipNorm: z.number().positive().default(1.0),
  }).optional(),
  initialModel: z.array(z.number()).optional(),
});

/**
 * POST /api/compute/federated
 * Execute federated learning computation
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    // Validate input
    const validationResult = FederatedComputeSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validationResult.error.errors,
      });
    }

    const input = validationResult.data;

    logger.info('Federated learning request received', {
      modelId: input.modelId,
      participants: input.participants.length,
    });

    // Execute federated learning
    const result = await federatedService.compute({
      computationId: input.computationId,
      modelId: input.modelId,
      participants: input.participants,
      config: input.config,
      initialModel: input.initialModel,
    });

    metrics.activeComputations.labels('federated').inc();

    res.status(200).json({
      success: true,
      data: result,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('Federated learning computation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    next(error);
  }
});

/**
 * GET /api/compute/federated/:id
 * Get federated learning status
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await federatedService.getStatus(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Federated computation not found',
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
 * POST /api/compute/federated/:id/cancel
 * Cancel federated learning computation
 */
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    logger.info('Federated learning cancellation requested', { computationId: id });

    // In production, would implement actual cancellation logic
    res.json({
      success: true,
      message: 'Cancellation requested',
      computationId: id,
    });
  } catch (error) {
    next(error);
  }
});

export { router as federatedRouter };
export default router;