/**
 * Multi-Location Dashboard Routes
 * Provides API endpoints for multi-location restaurant management
 */

import { Router, Request, Response } from 'express';
import { merchantAuth } from '../middleware/auth';
import { multiLocationDashboard } from '../services/multiLocationDashboard';
import { errorResponse } from '../utils/response';

const router = Router();
router.use(merchantAuth);

/**
 * Parse date range from query parameters
 */
function parseDateRange(req: Request): { start: Date; end: Date } | null {
  const startStr = req.query.start as string;
  const endStr = req.query.end as string;

  if (!startStr || !endStr) {
    return null;
  }

  const start = new Date(startStr);
  const end = new Date(endStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return null;
  }

  if (start > end) {
    return null;
  }

  return { start, end };
}

/**
 * @route GET /locations
 * @summary Get all locations for the merchant
 * @tags Multi-Location Dashboard
 * @security BearerAuth
 * @description Returns all store locations belonging to the authenticated merchant.
 * @response {object} 200 - Locations retrieved successfully
 */
router.get('/locations', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const locations = await multiLocationDashboard.getAllLocations(merchantId);
    res.json({ success: true, data: locations });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * @route GET /locations/:id/performance
 * @summary Get performance metrics for a location
 * @tags Multi-Location Dashboard
 * @security BearerAuth
 * @param {string} id - Location ID
 * @param {string} start - Start date (ISO 8601)
 * @param {string} end - End date (ISO 8601)
 * @description Returns detailed performance metrics for a specific location within the given date range.
 * @response {object} 200 - Performance retrieved successfully
 * @response {object} 400 - Invalid parameters
 * @response {object} 404 - Location not found
 */
router.get('/locations/:id/performance', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const period = parseDateRange(req);

    if (!period) {
      errorResponse(res, { message: 'Invalid or missing date range. Provide start and end dates.' });
      return;
    }

    const performance = await multiLocationDashboard.getLocationPerformance(id, period);
    res.json({ success: true, data: performance });
  } catch (err: unknown) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ success: false, message: err.message });
      return;
    }
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * @route GET /consolidated-report
 * @summary Get consolidated report across all locations
 * @tags Multi-Location Dashboard
 * @security BearerAuth
 * @param {string} start - Start date (ISO 8601)
 * @param {string} end - End date (ISO 8601)
 * @description Returns a consolidated analytics report across all merchant locations including trends.
 * @response {object} 200 - Report retrieved successfully
 * @response {object} 400 - Invalid parameters
 */
router.get('/consolidated-report', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const period = parseDateRange(req);

    if (!period) {
      errorResponse(res, { message: 'Invalid or missing date range. Provide start and end dates.' });
      return;
    }

    const report = await multiLocationDashboard.getConsolidatedReport(merchantId, period);
    res.json({ success: true, data: report });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * @route GET /compare
 * @summary Compare locations side by side
 * @tags Multi-Location Dashboard
 * @security BearerAuth
 * @param {string} start - Start date (ISO 8601)
 * @param {string} end - End date (ISO 8601)
 * @description Returns a comparison of all locations with key metrics for side-by-side analysis.
 * @response {object} 200 - Comparison retrieved successfully
 * @response {object} 400 - Invalid parameters
 */
router.get('/compare', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const period = parseDateRange(req);

    if (!period) {
      errorResponse(res, { message: 'Invalid or missing date range. Provide start and end dates.' });
      return;
    }

    const comparison = await multiLocationDashboard.compareLocations(merchantId, period);
    res.json({ success: true, data: comparison });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * @route GET /top-performers
 * @summary Get top performing locations
 * @tags Multi-Location Dashboard
 * @security BearerAuth
 * @param {number} limit - Number of locations to return (default: 5, max: 20)
 * @description Returns the top performing locations ranked by revenue in the last 30 days.
 * @response {object} 200 - Top performers retrieved successfully
 */
router.get('/top-performers', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    let limit = parseInt(req.query.limit as string) || 5;
    limit = Math.min(Math.max(1, limit), 20); // Clamp between 1 and 20

    const topPerformers = await multiLocationDashboard.getTopPerformers(merchantId, limit);
    res.json({ success: true, data: topPerformers });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * @route GET /locations/:id/health
 * @summary Get health status for a location
 * @tags Multi-Location Dashboard
 * @security BearerAuth
 * @param {string} id - Location ID
 * @description Returns health status and alerts for a specific location.
 * @response {object} 200 - Health status retrieved successfully
 * @response {object} 404 - Location not found
 */
router.get('/locations/:id/health', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const health = await multiLocationDashboard.getLocationHealth(id);
    res.json({ success: true, data: health });
  } catch (err: unknown) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ success: false, message: err.message });
      return;
    }
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
