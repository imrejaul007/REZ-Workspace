import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireInternalToken } from '../middleware/internalAuth';
import { fraudEngine } from '../services/fraudEngine';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

const fraudScoreSchema = z.object({
  referrerId: z.string(),
  refereeId: z.string(),
  ip: z.string().optional(),
  deviceId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  bankAccount: z.string().optional(),
  upiId: z.string().optional(),
  referralCode: z.string(),
});

/**
 * POST /score
 * Calculate fraud risk score
 */
router.post('/score', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const validation = fraudScoreSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const input = validation.data;

    const result = await fraudEngine.runFraudChecks({
      ...input,
      timestamp: new Date(),
    });

    return sendSuccess(res, {
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      flags: result.flags,
      recommendation: result.recommendation,
    });
  } catch (error) {
    logger.error('[FraudRoutes] Error calculating fraud score:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /suspicious
 * Get suspicious referrals
 */
router.get('/suspicious', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const minRiskScore = parseInt(req.query.minRiskScore as string) || 50;
    const limit = parseInt(req.query.limit as string) || 50;

    const suspicious = await fraudEngine.getSuspiciousReferrals({
      minRiskScore,
      limit,
    }) as Array<{
      _id: string;
      referrerId: string;
      refereeId: string;
      riskScore: number;
      riskLevel: string;
      flags: string[];
      createdAt: Date;
    }>;

    return sendSuccess(res, {
      suspiciousReferrals: suspicious.map((s) => ({
        id: s._id,
        referrerId: s.referrerId,
        refereeId: s.refereeId,
        riskScore: s.riskScore,
        riskLevel: s.riskLevel,
        flags: s.flags,
        createdAt: s.createdAt,
      })),
      total: suspicious.length,
    });
  } catch (error) {
    logger.error('[FraudRoutes] Error getting suspicious referrals:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

export default router;
