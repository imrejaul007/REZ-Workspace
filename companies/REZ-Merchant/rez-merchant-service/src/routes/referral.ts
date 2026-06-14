
/**
 * Referral Routes
 *
 * API endpoints for managing referrals:
 * - Generate referral codes
 * - Apply referral codes
 * - View referral statistics
 * - Process referrals
 */

import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { merchantAuth, requireVerifiedMerchant } from '../middleware/auth';
import { referralService } from '../services/referralService';
import { logger } from '../config/logger';

const router = Router();

// Apply authentication to all routes
router.use(merchantAuth);
router.use(requireVerifiedMerchant);

// Validation helper
const validate = (req: Request, res: Response, next: Function): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  next();
};

/**
 * POST /api/v1/merchant/referral/code
 * Generate a new referral code for the authenticated user
 */
router.post(
  '/code',
  [
    body('merchantId').optional().isMongoId().withMessage('Invalid merchant ID'),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.merchantUserId;
      const merchantId = req.body.merchantId || req.merchantId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      // Check if user already has an active referral code
      const existingCode = await referralService.generateReferralCode(userId, merchantId);

      logger.info('Referral code generated', {
        userId,
        merchantId,
        code: existingCode.code,
      });

      res.status(201).json({
        success: true,
        data: {
          code: existingCode.code,
          expiresAt: existingCode.expiresAt,
        },
      });
    } catch (error) {
      logger.error('Failed to generate referral code', { error, userId: req.merchantUserId });
      res.status(500).json({ success: false, message: 'Failed to generate referral code' });
    }
  }
);

/**
 * POST /api/v1/merchant/referral/apply
 * Apply a referral code (for new users)
 */
router.post(
  '/apply',
  [
    body('code').notEmpty().isString().isLength({ min: 6, max: 12 }).withMessage('Valid referral code required'),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      const userId = req.merchantUserId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const referral = await referralService.applyReferralCode(code, userId);

      if (!referral) {
        res.status(404).json({
          success: false,
          message: 'Invalid or expired referral code',
        });
        return;
      }

      logger.info('Referral code applied', {
        userId,
        code,
        referralId: referral._id,
      });

      res.status(200).json({
        success: true,
        data: {
          referralId: referral._id,
          status: referral.status,
          message: 'Referral code applied successfully',
        },
      });
    } catch (error) {
      logger.error('Failed to apply referral code', { error, code: req.body.code, userId: req.merchantUserId });
      res.status(500).json({ success: false, message: 'Failed to apply referral code' });
    }
  }
);

/**
 * POST /api/v1/merchant/referral/process
 * Process a pending referral and award points (merchant/admin action)
 */
router.post(
  '/process',
  [
    body('referralId').notEmpty().isMongoId().withMessage('Valid referral ID required'),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { referralId } = req.body;

      const result = await referralService.processReferral(referralId);

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Referral not found or already processed',
        });
        return;
      }

      logger.info('Referral processed', {
        referralId,
        merchantId: req.merchantId,
        referrerPoints: result.referrerPointsAwarded,
        referredPoints: result.referredPointsAwarded,
      });

      res.status(200).json({
        success: true,
        data: {
          referralId: result.referral._id,
          status: 'completed',
          referrerPointsAwarded: result.referrerPointsAwarded,
          referredPointsAwarded: result.referredPointsAwarded,
        },
      });
    } catch (error) {
      logger.error('Failed to process referral', { error, referralId: req.body.referralId });
      res.status(500).json({ success: false, message: 'Failed to process referral' });
    }
  }
);

/**
 * GET /api/v1/merchant/referral/stats
 * Get referral statistics for the authenticated user
 */
router.get(
  '/stats',
  async (req: Request, res: Response) => {
    try {
      const userId = req.merchantUserId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const stats = await referralService.getReferralStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get referral stats', { error, userId: req.merchantUserId });
      res.status(500).json({ success: false, message: 'Failed to get referral statistics' });
    }
  }
);

/**
 * GET /api/v1/merchant/referral/history
 * Get referral history for the authenticated user
 */
router.get(
  '/history',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.merchantUserId;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const result = await referralService.getReferralHistory(userId, page, limit);

      res.json({
        success: true,
        data: {
          referrals: result.referrals,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get referral history', { error, userId: req.merchantUserId });
      res.status(500).json({ success: false, message: 'Failed to get referral history' });
    }
  }
);

/**
 * GET /api/v1/merchant/referral/validate/:code
 * Validate a referral code (public endpoint for new users)
 */
router.get(
  '/validate/:code',
  async (req: Request, res: Response) => {
    try {
      const { code } = req.params;

      // Check if code exists
      const { Referral } = await import('../models/Referral');
      const referral = await Referral.findOne({ referralCode: code.toUpperCase() }).lean();

      if (!referral) {
        res.status(404).json({
          success: false,
          valid: false,
          message: 'Invalid referral code',
        });
        return;
      }

      if (referral.status === 'completed') {
        res.status(400).json({
          success: false,
          valid: false,
          message: 'Referral code already used',
        });
        return;
      }

      if (referral.expiresAt && referral.expiresAt < new Date()) {
        res.status(400).json({
          success: false,
          valid: false,
          message: 'Referral code expired',
        });
        return;
      }

      res.json({
        success: true,
        valid: true,
        data: {
          referralCode: referral.referralCode,
          expiresAt: referral.expiresAt,
        },
      });
    } catch (error) {
      logger.error('Failed to validate referral code', { error, code: req.params.code });
      res.status(500).json({ success: false, message: 'Failed to validate referral code' });
    }
  }
);

export default router;
