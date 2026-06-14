import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireInternalToken } from '../middleware/internalAuth';
import { referralEngine } from '../services/referralEngine';
import { rewardEngine } from '../services/rewardEngine';
import { fraudEngine } from '../services/fraudEngine';
import { creatorEngine } from '../services/creatorEngine';
import { teamEngine } from '../services/teamEngine';
import { ambassadorEngine } from '../services/ambassadorEngine';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const registerReferralSchema = z.object({
  referrerId: z.string(),
  refereeId: z.string(),
  code: z.string().min(6).max(12),
  type: z.enum(['consumer', 'merchant', 'creator']).default('consumer'),
  companyId: z.string().optional(),
  campaignId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const qualifyReferralSchema = z.object({
  refereeId: z.string(),
  action: z.enum(['first_order', 'first_payment', 'account_verified']),
  actionId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

const rewardReferralSchema = z.object({
  referralId: z.string(),
  referrerId: z.string(),
  refereeId: z.string(),
  type: z.enum(['coins', 'cashback', 'discount', 'commission']).default('coins'),
  amount: z.number().positive().optional(),
  coinType: z.string().optional(),
  source: z.enum(['referral', 'ambassador_bonus', 'team_bonus', 'campaign']).default('referral'),
  campaignId: z.string().optional(),
  companyId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

const validateCreditSchema = z.object({
  referrerId: z.string(),
  refereeId: z.string(),
  userId: z.string(),
});

const creatorCommissionSchema = z.object({
  creatorId: z.string(),
  orderAmount: z.number().positive(),
});

/**
 * POST /internal/referral/register
 * Register new referral
 */
router.post('/internal/referral/register', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const validation = registerReferralSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const data = validation.data;

    // Run fraud check
    const fraudResult = await fraudEngine.runFraudChecks({
      referrerId: data.referrerId,
      refereeId: data.refereeId,
      referralCode: data.code,
      ip: req.ip,
      timestamp: new Date(),
    });

    if (fraudResult.recommendation === 'block') {
      return sendError(res, 'FRAUD_BLOCKED', 403, { flags: fraudResult.flags });
    }

    // Register referral
    const referral = await referralEngine.registerReferral({
      referrerId: data.referrerId,
      refereeId: data.refereeId,
      code: data.code,
      type: data.type,
      companyId: data.companyId,
      campaignId: data.campaignId,
      metadata: data.metadata,
    });

    if (!referral) {
      return sendError(res, 'REFERRAL_INVALID', 400);
    }

    // Update fraud score
    if (fraudResult.riskScore > 0) {
      await fraudEngine.updateReferralFraudScore(referral._id.toString(), fraudResult);
    }

    // Record fingerprint
    await fraudEngine.recordFingerprint({
      ip: req.ip,
      refereeId: data.refereeId,
    });

    return sendSuccess(res, {
      referralId: referral._id,
      status: referral.status,
      riskScore: referral.riskScore,
    }, 201);
  } catch (error) {
    logger.error('[InternalRoutes] Error registering referral:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /internal/referral/qualify
 * Mark referral as qualified
 */
router.post('/internal/referral/qualify', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const validation = qualifyReferralSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const { refereeId, action, actionId, idempotencyKey } = validation.data;

    const referral = await referralEngine.qualifyReferral({
      refereeId,
      action,
      actionId,
      idempotencyKey,
    });

    if (!referral) {
      return sendError(res, 'REFERRAL_NOT_FOUND', 404);
    }

    return sendSuccess(res, {
      referralId: referral._id,
      status: referral.status,
      qualifiedAt: referral.qualifiedAt,
    });
  } catch (error) {
    logger.error('[InternalRoutes] Error qualifying referral:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /internal/referral/reward
 * Issue referral reward
 */
router.post('/internal/referral/reward', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const validation = rewardReferralSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const data = validation.data;

    // Validate first
    const validationResult = await rewardEngine.validateReward(data.referrerId, data.refereeId);
    if (!validationResult.valid) {
      return sendError(res, 'VALIDATION_ERROR', 400, validationResult.reason);
    }

    // Issue reward
    const result = await rewardEngine.issueReward({
      referralId: data.referralId,
      referrerId: data.referrerId,
      refereeId: data.refereeId,
      type: data.type,
      amount: data.amount,
      coinType: data.coinType,
      source: data.source,
      campaignId: data.campaignId,
      companyId: data.companyId,
      idempotencyKey: data.idempotencyKey,
    });

    if (!result.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, result.error);
    }

    // Distribute team rewards if applicable
    if (data.source === 'referral') {
      const baseReward = data.amount || 100;
      await teamEngine.distributeTeamRewards(baseReward, data.refereeId, {
        referralId: data.referralId,
        campaignId: data.campaignId,
        companyId: data.companyId,
      });
    }

    // Update ambassador tier
    await ambassadorEngine.updateTier(data.referrerId);

    return sendSuccess(res, {
      success: true,
      rewardId: result.rewardId,
    });
  } catch (error) {
    logger.error('[InternalRoutes] Error issuing reward:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /internal/referral/validate
 * Validate referral credit
 */
router.post('/internal/referral/validate', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const validation = validateCreditSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const { referrerId, refereeId, userId } = validation.data;

    const result = await rewardEngine.validateReward(referrerId, refereeId);

    return sendSuccess(res, {
      valid: result.valid,
      reason: result.reason,
    });
  } catch (error) {
    logger.error('[InternalRoutes] Error validating credit:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /internal/referral/status/:refereeId
 * Get referral status for a user
 */
router.get('/internal/referral/status/:refereeId', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const { refereeId } = req.params;

    const status = await referralEngine.getReferralStatus(refereeId);

    return sendSuccess(res, status);
  } catch (error) {
    logger.error('[InternalRoutes] Error getting status:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /internal/referral/reverse
 * Revoke referral reward
 */
router.post('/internal/referral/reverse', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const { rewardId, reason } = req.body;

    if (!rewardId) {
      return sendError(res, 'VALIDATION_ERROR', 400, 'Reward ID is required');
    }

    await rewardEngine.revokeReward(rewardId, reason || 'Manual revocation');

    return sendSuccess(res, { reversed: true });
  } catch (error) {
    logger.error('[InternalRoutes] Error reversing reward:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /internal/creator/commission
 * Calculate creator commission
 */
router.post('/internal/creator/commission', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const validation = creatorCommissionSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const { creatorId, orderAmount } = validation.data;

    const commission = await creatorEngine.calculateCommission(creatorId, orderAmount);

    return sendSuccess(res, commission);
  } catch (error) {
    logger.error('[InternalRoutes] Error calculating commission:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /internal/creator/payout
 * Process creator payout
 */
router.post('/internal/creator/payout', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const { creatorId, amount, method, bankDetails, upiId, idempotencyKey } = req.body;

    if (!creatorId || !amount || !method) {
      return sendError(res, 'VALIDATION_ERROR', 400, 'Creator ID, amount, and method are required');
    }

    // Validate amount
    if (amount <= 0) {
      return sendError(res, 'VALIDATION_ERROR', 400, 'Amount must be positive');
    }

    // Check for minimum payout threshold
    const MIN_PAYOUT_AMOUNT = 100; // INR
    if (amount < MIN_PAYOUT_AMOUNT) {
      return sendError(res, 'VALIDATION_ERROR', 400, `Minimum payout amount is ${MIN_PAYOUT_AMOUNT} INR`);
    }

    // Validate payout method specifics
    if (method === 'bank_transfer' && !bankDetails) {
      return sendError(res, 'VALIDATION_ERROR', 400, 'Bank details are required for bank transfer');
    }

    if (method === 'upi' && !upiId) {
      return sendError(res, 'VALIDATION_ERROR', 400, 'UPI ID is required for UPI transfer');
    }

    const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    let payoutResult: {
      success: boolean;
      transactionRef?: string;
      status?: string;
      error?: string;
    };

    // Process payout based on method
    if (method === 'bank_transfer') {
      try {
        const BANK_SERVICE_URL = process.env.BANK_SERVICE_URL || 'http://localhost:3005';
        const BANK_SERVICE_API_KEY = process.env.BANK_SERVICE_API_KEY || '';

        const bankPayload = {
          payoutId,
          creatorId,
          amount,
          accountNumber: bankDetails.accountNumber,
          ifscCode: bankDetails.ifscCode,
          accountHolderName: bankDetails.accountHolderName,
          bankName: bankDetails.bankName || 'Unknown',
          idempotencyKey,
          metadata: {
            source: 'creator_payout',
            processedAt: new Date().toISOString(),
          },
        };

        const response = await fetch(`${BANK_SERVICE_URL}/api/payouts/bank-transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Service-Name': 'referral-os',
            'X-Request-Id': `payout-${payoutId}`,
            ...(BANK_SERVICE_API_KEY && { 'Authorization': `Bearer ${BANK_SERVICE_API_KEY}` }),
          },
          body: JSON.stringify(bankPayload),
        });

        payoutResult = await response.json() as typeof payoutResult;

        if (!response.ok) {
          throw new Error(`Bank service returned ${response.status}: ${payoutResult?.error || 'Unknown error'}`);
        }

        logger.info('[InternalRoutes] Bank transfer payout initiated', {
          payoutId,
          creatorId,
          amount,
          transactionRef: payoutResult.transactionRef,
        });
      } catch (error) {
        logger.error('[InternalRoutes] Bank transfer payout failed', {
          payoutId,
          creatorId,
          amount,
          error: error instanceof Error ? error.message : String(error),
        });
        return sendError(res, 'PAYOUT_FAILED', 502, `Bank transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else if (method === 'upi') {
      try {
        const UPI_SERVICE_URL = process.env.UPI_SERVICE_URL || 'http://localhost:3006';
        const UPI_SERVICE_API_KEY = process.env.UPI_SERVICE_API_KEY || '';

        const upiPayload = {
          payoutId,
          creatorId,
          amount,
          upiId,
          idempotencyKey,
          metadata: {
            source: 'creator_payout',
            processedAt: new Date().toISOString(),
          },
        };

        const response = await fetch(`${UPI_SERVICE_URL}/api/payouts/upi`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Service-Name': 'referral-os',
            'X-Request-Id': `payout-${payoutId}`,
            ...(UPI_SERVICE_API_KEY && { 'Authorization': `Bearer ${UPI_SERVICE_API_KEY}` }),
          },
          body: JSON.stringify(upiPayload),
        });

        payoutResult = await response.json() as typeof payoutResult;

        if (!response.ok) {
          throw new Error(`UPI service returned ${response.status}: ${payoutResult?.error || 'Unknown error'}`);
        }

        logger.info('[InternalRoutes] UPI payout initiated', {
          payoutId,
          creatorId,
          amount,
          upiId,
          transactionRef: payoutResult.transactionRef,
        });
      } catch (error) {
        logger.error('[InternalRoutes] UPI payout failed', {
          payoutId,
          creatorId,
          amount,
          error: error instanceof Error ? error.message : String(error),
        });
        return sendError(res, 'PAYOUT_FAILED', 502, `UPI transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      return sendError(res, 'VALIDATION_ERROR', 400, `Unsupported payout method: ${method}`);
    }

    // Record payout in local state (if applicable)
    // This would typically be stored in a Payout collection for audit trail
    logger.info('[InternalRoutes] Payout processed successfully', {
      payoutId,
      creatorId,
      amount,
      method,
      status: payoutResult.status,
      transactionRef: payoutResult.transactionRef,
    });

    return sendSuccess(res, {
      processed: true,
      payoutId,
      creatorId,
      amount,
      method,
      status: payoutResult.status || 'pending',
      transactionRef: payoutResult.transactionRef,
    });
  } catch (error) {
    logger.error('[InternalRoutes] Error processing payout:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

export default router;
