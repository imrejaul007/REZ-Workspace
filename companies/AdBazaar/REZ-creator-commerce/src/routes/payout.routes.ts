import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { payoutService, creatorService } from '../services';
import { logger } from '../services/logger.service';
import { PayoutStatus, PayoutMethod } from '../types';

const router = Router();

// Validation schemas
const requestPayoutSchema = z.object({
  creatorId: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(['bank_transfer', 'upi', 'wallet']).optional(),
  notes: z.string().optional(),
});

const updatePayoutSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  transactionId: z.string().optional(),
  bankReference: z.string().optional(),
  notes: z.string().optional(),
  failureReason: z.string().optional(),
});

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// ============================================
// PAYOUT ROUTES (Nested under creators)
// ============================================

/**
 * GET /api/creators/:creatorId/payouts
 * List payouts for a creator
 */
router.get('/creators/:creatorId/payouts', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as PayoutStatus | undefined;

  // Verify creator exists
  const creator = await creatorService.getById(creatorId);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const result = await payoutService.getByCreator(creatorId, {
    page,
    limit,
    status,
  });

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/creators/:creatorId/payouts/summary
 * Get payout summary for a creator
 */
router.get('/creators/:creatorId/payouts/summary', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.params;

  // Verify creator exists
  const creator = await creatorService.getById(creatorId);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const summary = await payoutService.getCreatorPayoutSummary(creatorId);

  res.json({
    success: true,
    data: summary,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/creators/:creatorId/payouts/eligibility
 * Check payout eligibility
 */
router.get('/creators/:creatorId/payouts/eligibility', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.params;

  // Verify creator exists
  const creator = await creatorService.getById(creatorId);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const eligibility = await payoutService.getPayoutEligibility(creatorId);

  res.json({
    success: true,
    data: eligibility,
    timestamp: new Date().toISOString(),
  });
}));

// ============================================
// PAYOUT ROUTES (Direct)
// ============================================

/**
 * POST /api/payouts/request
 * Request a payout
 */
router.post('/payouts/request', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = requestPayoutSchema.parse(req.body);

  try {
    const payout = await payoutService.request(validatedData.creatorId, {
      amount: validatedData.amount,
      method: validatedData.method,
      notes: validatedData.notes,
    });

    logger.info(`Payout requested via API: ${payout._id}`);

    res.status(201).json({
      success: true,
      data: payout,
      message: 'Payout requested successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = (error as Error).message;
    res.status(400).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * GET /api/payouts/:id
 * Get payout by ID
 */
router.get('/payouts/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const payout = await payoutService.getById(id);
  if (!payout) {
    res.status(404).json({
      success: false,
      error: 'Payout not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: payout,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * PUT /api/payouts/:id
 * Update payout
 */
router.put('/payouts/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updatePayoutSchema.parse(req.body);

  const payout = await payoutService.update(id, validatedData);
  if (!payout) {
    res.status(404).json({
      success: false,
      error: 'Payout not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info(`Payout updated via API: ${id}`);

  res.json({
    success: true,
    data: payout,
    message: 'Payout updated successfully',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * PATCH /api/payouts/:id/process
 * Process payout (admin action)
 */
router.patch('/payouts/:id/process', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { transactionId } = req.body;

  try {
    const payout = await payoutService.processPayout(id, transactionId);
    if (!payout) {
      res.status(404).json({
        success: false,
        error: 'Payout not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info(`Payout processing via API: ${id}`);

    res.json({
      success: true,
      data: payout,
      message: 'Payout is being processed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = (error as Error).message;
    res.status(400).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * PATCH /api/payouts/:id/complete
 * Complete payout (admin action)
 */
router.patch('/payouts/:id/complete', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { bankReference } = req.body;

  try {
    const payout = await payoutService.completePayout(id, bankReference);
    if (!payout) {
      res.status(404).json({
        success: false,
        error: 'Payout not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info(`Payout completed via API: ${id}`);

    res.json({
      success: true,
      data: payout,
      message: 'Payout completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = (error as Error).message;
    res.status(400).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * PATCH /api/payouts/:id/fail
 * Fail payout (admin action)
 */
router.patch('/payouts/:id/fail', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    res.status(400).json({
      success: false,
      error: 'Failure reason is required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const payout = await payoutService.failPayout(id, reason);
    if (!payout) {
      res.status(404).json({
        success: false,
        error: 'Payout not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info(`Payout failed via API: ${id}, reason: ${reason}`);

    res.json({
      success: true,
      data: payout,
      message: 'Payout marked as failed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = (error as Error).message;
    res.status(400).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * PATCH /api/payouts/:id/cancel
 * Cancel payout request (creator action)
 */
router.patch('/payouts/:id/cancel', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { creatorId } = req.body;

  if (!creatorId) {
    res.status(400).json({
      success: false,
      error: 'Creator ID is required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const payout = await payoutService.cancelPayout(id, creatorId);
    if (!payout) {
      res.status(404).json({
        success: false,
        error: 'Payout not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info(`Payout cancelled via API: ${id}`);

    res.json({
      success: true,
      data: payout,
      message: 'Payout cancelled successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = (error as Error).message;
    res.status(400).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * GET /api/payouts/pending
 * Get pending payouts (admin)
 */
router.get('/payouts/pending', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await payoutService.getPendingPayouts({ page, limit });

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/payouts/stats
 * Get platform payout stats
 */
router.get('/payouts/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = await payoutService.getPlatformStats();

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
}));

export default router;