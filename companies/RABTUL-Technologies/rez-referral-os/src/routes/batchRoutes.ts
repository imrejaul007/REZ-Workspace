import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireInternalToken } from '../middleware/internalAuth';
import { batchProcessor } from '../services/batchProcessor';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

const batchSchema = z.object({
  referrals: z.array(z.object({
    referrerId: z.string(),
    refereeId: z.string(),
    referralCode: z.string(),
    type: z.enum(['consumer', 'merchant', 'creator']).default('consumer'),
    companyId: z.string().optional(),
    campaignId: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })).min(1).max(1000),
});

/**
 * POST /internal/batch/referrals
 * Process batch referrals
 */
router.post('/batch/referrals', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const validation = batchSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const result = await batchProcessor.processBatch(validation.data.referrals);

    return sendSuccess(res, {
      success: result.success,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    logger.error('[BatchRoutes] Error processing batch:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /internal/batch/qualify
 * Qualify batch referrals
 */
router.post('/batch/qualify', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const { referralIds } = req.body as { referralIds: string[] };

    if (!Array.isArray(referralIds) || referralIds.length === 0) {
      return sendError(res, 'VALIDATION_ERROR', 400, 'referralIds array required');
    }

    const result = await batchProcessor.qualifyBatch(referralIds);

    return sendSuccess(res, {
      success: result.success,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    logger.error('[BatchRoutes] Error qualifying batch:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /internal/cleanup
 * Cleanup expired referrals
 */
router.post('/cleanup', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const { daysOld = 30 } = req.body as { daysOld?: number };

    const deletedCount = await batchProcessor.cleanupExpired(daysOld);

    return sendSuccess(res, { deletedCount });
  } catch (error) {
    logger.error('[BatchRoutes] Error during cleanup:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

export default router;
