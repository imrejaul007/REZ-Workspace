import { Router, Request, Response, NextFunction } from 'express';
import { alertService } from '../services/alertService';

const router = Router();

// Middleware to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route   GET /api/alerts
 * @desc    Get complete alert summary
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.query;
    const summary = await alertService.getAlertSummary(storeId as string);

    res.json({
      success: true,
      data: summary,
    });
  })
);

/**
 * @route   GET /api/alerts/low-stock
 * @desc    Get low stock alerts
 * @access  Public
 */
router.get(
  '/low-stock',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.query;
    const alerts = await alertService.getLowStockAlerts(storeId as string);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  })
);

/**
 * @route   GET /api/alerts/expiry
 * @desc    Get expiry alerts
 * @access  Public
 */
router.get(
  '/expiry',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId, days } = req.query;
    const alerts = await alertService.getExpiryAlerts(
      storeId as string,
      days ? Number(days) : undefined
    );

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  })
);

/**
 * @route   GET /api/alerts/by-category
 * @desc    Get alerts grouped by category
 * @access  Public
 */
router.get(
  '/by-category',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.query;
    const alerts = await alertService.getAlertsByCategory(storeId as string);

    res.json({
      success: true,
      data: alerts,
    });
  })
);

/**
 * @route   POST /api/alerts/check/:skuId
 * @desc    Check if a specific SKU is low on stock
 * @access  Public
 */
router.post(
  '/check/:skuId',
  asyncHandler(async (req: Request, res: Response) => {
    const { skuId } = req.params;
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'storeId is required in request body',
      });
    }

    const isLowStock = await alertService.checkLowStock(skuId, storeId);

    res.json({
      success: true,
      data: {
        skuId,
        storeId,
        isLowStock,
      },
    });
  })
);

/**
 * @route   POST /api/alerts/refresh
 * @desc    Refresh alert statuses
 * @access  Public
 */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.body;
    const [lowStockUpdated, expiryUpdated] = await Promise.all([
      alertService.updateLowStockAlerts(storeId),
      alertService.scheduleExpiryAlerts(storeId),
    ]);

    res.json({
      success: true,
      message: 'Alerts refreshed successfully',
      data: {
        lowStockAlertsUpdated: lowStockUpdated,
        newExpiryAlerts: expiryUpdated.length,
      },
    });
  })
);

/**
 * @route   GET /api/alerts/forecast/:skuId
 * @desc    Get stock forecast for a SKU
 * @access  Public
 */
router.get(
  '/forecast/:skuId',
  asyncHandler(async (req: Request, res: Response) => {
    const { skuId } = req.params;
    const { storeId, days } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'storeId query parameter is required',
      });
    }

    const forecast = await alertService.getStockForecast(
      skuId,
      storeId as string,
      days ? Number(days) : undefined
    );

    if (!forecast) {
      return res.status(404).json({
        success: false,
        message: 'Stock record not found for this SKU and store',
      });
    }

    res.json({
      success: true,
      data: forecast,
    });
  })
);

/**
 * @route   POST /api/alerts/schedule-expiry
 * @desc    Schedule expiry alerts (for cron job)
 * @access  Public
 */
router.post(
  '/schedule-expiry',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.body;
    const alerts = await alertService.scheduleExpiryAlerts(storeId);

    res.json({
      success: true,
      message: 'Expiry alerts scheduled',
      data: {
        criticalAlerts: alerts.filter((a) => a.urgency === 'critical' || a.urgency === 'expired'),
        totalAlerts: alerts.length,
      },
    });
  })
);

export default router;
