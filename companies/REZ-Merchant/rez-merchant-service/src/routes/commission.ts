
/**
 * Commission Tracking Routes
 *
 * API endpoints for commission tracking:
 * - Get staff commissions
 * - Get staff earnings summary
 * - Mark commissions as paid
 * - Get commission reports
 * - Set commission rates
 */

import { Router, Request, Response } from 'express';
import { query, body, validationResult } from 'express-validator';
import { merchantAuth } from '../middleware/auth';
import { CommissionService } from '../services/commissionService';

const router = Router();
router.use(merchantAuth);

const commissionService = new CommissionService();

// ── Validation Helpers ───────────────────────────────────────────────────────────

const validate = (req: Request, res: Response, next: () => void): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  next();
};

// ── Staff Commission Routes ─────────────────────────────────────────────────────

/**
 * GET /api/commissions/staff/:staffId/commissions
 * Get all commissions for a staff member in a specific month/year
 */
router.get(
  '/staff/:staffId/commissions',
  [
    query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
    query('year').optional().isInt({ min: 2020, max: 2100 }).toInt(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { staffId } = req.params;
      const merchantId = req.merchantId;

      // Default to current month/year if not specified
      const now = new Date();
      const month = parseInt(req.query.month as string) || now.getMonth() + 1;
      const year = parseInt(req.query.year as string) || now.getFullYear();

      const commissions = await commissionService.getStaffCommissions(staffId, month, year);

      res.json({
        success: true,
        data: {
          staffId,
          month,
          year,
          commissions,
          count: commissions.length,
        },
      });
    } catch (error: unknown) {
      console.error('Error fetching staff commissions:', error);
      const message =
        process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message;
      res.status(500).json({ success: false, message });
    }
  },
);

/**
 * GET /api/commissions/staff/:staffId/earnings
 * Get earnings summary (total, pending, paid) for a staff member
 */
router.get(
  '/staff/:staffId/earnings',
  [
    query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
    query('year').optional().isInt({ min: 2020, max: 2100 }).toInt(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { staffId } = req.params;

      // Default to current month/year if not specified
      const now = new Date();
      const month = parseInt(req.query.month as string) || now.getMonth() + 1;
      const year = parseInt(req.query.year as string) || now.getFullYear();

      const earnings = await commissionService.getStaffEarnings(staffId, month, year);

      res.json({
        success: true,
        data: {
          staffId,
          month,
          year,
          ...earnings,
        },
      });
    } catch (error: unknown) {
      console.error('Error fetching staff earnings:', error);
      const message =
        process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message;
      res.status(500).json({ success: false, message });
    }
  },
);

/**
 * POST /api/commissions/mark-paid
 * Mark multiple commissions as paid
 */
router.post(
  '/mark-paid',
  [
    body('commissionIds').isArray({ min: 1 }).withMessage('commissionIds must be a non-empty array'),
    body('commissionIds.*').isMongoId().withMessage('Each commission ID must be a valid MongoDB ObjectId'),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { commissionIds } = req.body;
      const merchantId = req.merchantId;

      if (!merchantId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await commissionService.markAsPaid(commissionIds);

      res.json({
        success: true,
        data: {
          markedCount: commissionIds.length,
          markedIds: commissionIds,
          markedAt: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      console.error('Error marking commissions as paid:', error);
      const message =
        process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message;
      res.status(500).json({ success: false, message });
    }
  },
);

/**
 * GET /api/commissions/report
 * Get commission report for a store in a specific month/year
 */
router.get(
  '/report',
  [
    query('storeId').isMongoId().withMessage('storeId is required and must be a valid MongoDB ObjectId'),
    query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
    query('year').optional().isInt({ min: 2020, max: 2100 }).toInt(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { storeId } = req.query;

      // Default to current month/year if not specified
      const now = new Date();
      const month = parseInt(req.query.month as string) || now.getMonth() + 1;
      const year = parseInt(req.query.year as string) || now.getFullYear();

      const report = await commissionService.getCommissionReport(
        storeId as string,
        month,
        year,
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error: unknown) {
      console.error('Error fetching commission report:', error);
      const message =
        process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message;
      res.status(500).json({ success: false, message });
    }
  },
);

/**
 * POST /api/commissions/rates
 * Set custom commission rate for a staff/service combination
 */
router.post(
  '/rates',
  [
    body('staffId').isMongoId().withMessage('staffId is required and must be a valid MongoDB ObjectId'),
    body('serviceId').isMongoId().withMessage('serviceId is required and must be a valid MongoDB ObjectId'),
    body('percent')
      .isFloat({ min: 0, max: 100 })
      .withMessage('percent must be between 0 and 100'),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { staffId, serviceId, percent } = req.body;
      const merchantId = req.merchantId;

      if (!merchantId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await commissionService.setCommissionRate(staffId, serviceId, percent);

      res.json({
        success: true,
        data: {
          staffId,
          serviceId,
          commissionPercent: percent,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      console.error('Error setting commission rate:', error);
      const message =
        process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message;
      res.status(500).json({ success: false, message });
    }
  },
);

/**
 * POST /api/commissions/calculate
 * Calculate commission for a completed booking
 */
router.post(
  '/calculate',
  [
    body('bookingId').isMongoId().withMessage('bookingId is required and must be a valid MongoDB ObjectId'),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.body;
      const merchantId = req.merchantId;

      if (!merchantId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const commission = await commissionService.calculateCommission(bookingId);

      res.status(201).json({
        success: true,
        data: commission,
      });
    } catch (error: unknown) {
      console.error('Error calculating commission:', error);
      const message =
        process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message;
      res.status(500).json({ success: false, message });
    }
  },
);

/**
 * GET /api/commissions/stats
 * Get commission statistics for a store
 */
router.get(
  '/stats',
  [
    query('storeId').isMongoId().withMessage('storeId is required and must be a valid MongoDB ObjectId'),
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { storeId, startDate, endDate } = req.query;
      const merchantId = req.merchantId;

      if (!merchantId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      // Default to current month date range if not specified
      const now = new Date();
      const start = startDate
        ? new Date(startDate as string)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endDate
        ? new Date(endDate as string)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const stats = await commissionService.getCommissionStats(storeId as string, start, end);

      res.json({
        success: true,
        data: {
          storeId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          ...stats,
        },
      });
    } catch (error: unknown) {
      console.error('Error fetching commission stats:', error);
      const message =
        process.env.NODE_ENV === 'production' ? 'An error occurred' : error.message;
      res.status(500).json({ success: false, message });
    }
  },
);

export default router;
