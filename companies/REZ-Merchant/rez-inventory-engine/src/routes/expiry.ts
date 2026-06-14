import { Router, Request, Response, NextFunction } from 'express';
import { expiryService } from '../services/expiryService';

const router = Router();

// Middleware to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route   GET /api/expiry/expiring
 * @desc    Get items expiring soon
 * @access  Public
 * @query   storeId - required store identifier
 * @query   days - optional number of days (default: 30)
 */
router.get(
  '/expiring',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId, days } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'storeId query parameter is required',
      });
    }

    const daysNumber = days ? parseInt(days as string, 10) : 30;

    if (isNaN(daysNumber) || daysNumber < 1) {
      return res.status(400).json({
        success: false,
        message: 'days must be a positive number',
      });
    }

    const expiringSoon = await expiryService.getExpiringSoon(storeId as string, daysNumber);

    res.json({
      success: true,
      data: expiringSoon,
      count: expiringSoon.length,
      query: {
        storeId,
        days: daysNumber,
      },
    });
  })
);

/**
 * @route   GET /api/expiry/expired
 * @desc    Get expired items
 * @access  Public
 * @query   storeId - required store identifier
 */
router.get(
  '/expired',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'storeId query parameter is required',
      });
    }

    const expired = await expiryService.getExpired(storeId as string);

    res.json({
      success: true,
      data: expired,
      count: expired.length,
      query: {
        storeId,
      },
    });
  })
);

/**
 * @route   POST /api/expiry/cleanup
 * @desc    Mark expired items as unavailable and optionally cleanup old batches
 * @access  Public
 * @body    storeId - required store identifier
 * @body    cleanupOldBatches - optional boolean (default: false)
 * @body    olderThanDays - optional number (default: 90)
 */
router.post(
  '/cleanup',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId, cleanupOldBatches, olderThanDays } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'storeId is required in body',
      });
    }

    // Mark expired items
    const markExpiredResult = await expiryService.markExpired(storeId);

    let cleanupResult = null;

    // Optionally cleanup old batches
    if (cleanupOldBatches === true) {
      const days = olderThanDays ? parseInt(olderThanDays as string, 10) : 90;
      cleanupResult = await expiryService.cleanupExpiredBatches(storeId, days);
    }

    res.json({
      success: true,
      markExpired: markExpiredResult,
      cleanup: cleanupResult,
    });
  })
);

/**
 * @route   POST /api/expiry/alerts
 * @desc    Send expiry alerts
 * @access  Public
 * @body    storeId - required store identifier
 */
router.post(
  '/alerts',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'storeId is required in body',
      });
    }

    const result = await expiryService.sendExpiryAlerts(storeId);

    res.json({
      success: result.success,
      message: result.message,
      alertsSent: result.alertsSent,
    });
  })
);

/**
 * @route   GET /api/expiry/summary
 * @desc    Get expiry summary for a store
 * @access  Public
 * @query   storeId - required store identifier
 */
router.get(
  '/summary',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'storeId query parameter is required',
      });
    }

    const summary = await expiryService.getExpirySummary(storeId as string);

    res.json({
      success: true,
      data: summary,
      query: {
        storeId,
      },
    });
  })
);

/**
 * @route   POST /api/expiry/update-statuses
 * @desc    Update expiry statuses for all stocks in a store
 * @access  Public
 * @body    storeId - required store identifier
 */
router.post(
  '/update-statuses',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'storeId is required in body',
      });
    }

    const result = await expiryService.updateExpiryStatuses(storeId);

    res.json({
      success: result.success,
      message: result.message,
      updated: result.updated,
    });
  })
);

export default router;
