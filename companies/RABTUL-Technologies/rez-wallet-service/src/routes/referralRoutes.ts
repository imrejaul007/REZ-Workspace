import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { requireInternalToken } from '../middleware/internalAuth';
import * as referralService from '../services/referralService';
import { logger } from '../config/logger';

function auditLog(req: Request, action: string, meta: Record<string, unknown>) {
  logger.info('[ReferralAudit]', {
    action,
    correlationId: req.headers['x-correlation-id'],
    requestId: req.headers['x-request-id'],
    ip: req.ip,
    ...meta,
  });
}

const router = Router();

// All internal routes require service-to-service token
router.use(requireInternalToken);

// ── POST /internal/referral/register — Register a new referral (called by auth service on signup) ──
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { referrerId, refereeId, rewardAmount, rewardCoinType } = req.body;

    if (!referrerId || !refereeId) {
      res.status(400).json({
        success: false,
        message: 'referrerId and refereeId required',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(referrerId)) {
      res.status(400).json({ success: false, message: 'Invalid referrerId' });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(refereeId)) {
      res.status(400).json({ success: false, message: 'Invalid refereeId' });
      return;
    }

    const amount = rewardAmount ? Number(rewardAmount) : 100;
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'rewardAmount must be a positive number',
      });
      return;
    }

    const coinType = rewardCoinType || 'rez';

    const referral = await referralService.registerReferral(
      referrerId,
      refereeId,
      amount,
      coinType,
    );

    auditLog(req, 'referral.register', {
      referrerId,
      refereeId,
      rewardAmount: amount,
      rewardCoinType: coinType,
    });

    res.status(201).json({
      success: true,
      data: referral,
    });
  } catch (err) {
    const statusCode = err.message?.includes('Self-referral')
      ? 400
      : err.message?.includes('already exists')
        ? 409
        : 500;
    res.status(statusCode).json({
      success: false,
      message: err.message,
    });
  }
});

// ── POST /internal/referral/qualify — Mark referral as qualified (called by order service) ──
router.post('/qualify', async (req: Request, res: Response) => {
  try {
    const { refereeId, action, actionId, idempotencyKey } = req.body;

    if (!refereeId) {
      res.status(400).json({
        success: false,
        message: 'refereeId required',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(refereeId)) {
      res.status(400).json({ success: false, message: 'Invalid refereeId' });
      return;
    }

    const qualifyingAction = action || 'first_order';
    if (!['first_order', 'first_payment', 'account_verified'].includes(qualifyingAction)) {
      res.status(400).json({
        success: false,
        message: "action must be one of: first_order, first_payment, account_verified",
      });
      return;
    }

    // BAK-MED-005 FIX: Idempotency key for referral qualification.
    // The ReferralConversion model has a unique sparse index on idempotencyKey.
    // If the same idempotencyKey is passed twice, the DB rejects the duplicate
    // and we return 409 Conflict. Uses atomic findOneAndUpdate internally so
    // concurrent calls with the same refereeId are handled safely.
    const effectiveIdempotencyKey = idempotencyKey ||
      (actionId ? `qualify:${refereeId}:${actionId}` : `qualify:${refereeId}:${qualifyingAction}`);

    const referral = await referralService.qualifyReferral(
      refereeId,
      qualifyingAction as unknown,
      actionId,
      effectiveIdempotencyKey,
    );

    if (!referral) {
      res.status(404).json({
        success: false,
        message: 'No pending referral found for this referee',
      });
      return;
    }

    auditLog(req, 'referral.qualify', {
      refereeId,
      referrerId: referral.referrerId,
      action: qualifyingAction,
      actionId,
      idempotencyKey: effectiveIdempotencyKey,
    });

    res.json({
      success: true,
      data: referral,
    });
  } catch (err) {
    // Handle duplicate key error from idempotency index
    if (err.message?.includes('duplicate') || err.message?.includes('E11000')) {
      res.status(409).json({
        success: false,
        message: 'Referral qualification already processed (idempotent replay)',
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ── GET /internal/referral/status/:refereeId — Check referral status ──
router.get('/status/:refereeId', async (req: Request, res: Response) => {
  try {
    const refereeId = typeof req.params.refereeId === 'string'
      ? req.params.refereeId
      : Array.isArray(req.params.refereeId)
        ? req.params.refereeId[0]
        : undefined;

    if (!refereeId) {
      res.status(400).json({
        success: false,
        message: 'refereeId required',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(refereeId)) {
      res.status(400).json({ success: false, message: 'Invalid refereeId' });
      return;
    }

    const referral = await referralService.getReferralStatus(refereeId);

    res.json({
      success: true,
      data: referral,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ── POST /internal/referral/validate — Validate referral credit before awarding ──
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { referrerId, refereeId, userId } = req.body;

    if (!referrerId || !refereeId || !userId) {
      res.status(400).json({
        success: false,
        message: 'referrerId, refereeId, and userId required',
      });
      return;
    }

    const validation = await referralService.validateReferralCredit(
      referrerId,
      refereeId,
      userId,
    );

    auditLog(req, 'referral.validate', {
      referrerId,
      refereeId,
      userId,
      valid: validation.valid,
      reason: validation.reason,
    });

    res.json({
      success: true,
      data: validation,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
