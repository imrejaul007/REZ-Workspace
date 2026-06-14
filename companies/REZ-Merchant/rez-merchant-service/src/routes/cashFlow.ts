/**
 * Cash Flow Forecasting Routes
 */

import { Router, Request, Response } from 'express';
import { merchantAuth } from '../middleware/auth';
import {
  generateForecast,
  getCashFlowTrends,
  compareForecastToActual,
} from '../services/cashFlowForecastService';
import { errorResponse, errors } from '../utils/response';

const router = Router();
router.use(merchantAuth);

/**
 * GET /cash-flow/forecast
 * Get cash flow forecast
 */
router.get('/forecast', async (req: Request, res: Response) => {
  try {
    const { days, startingBalance } = req.query;

    const forecast = await generateForecast(
      req.merchantId,
      days ? parseInt(days as string) : 30,
      startingBalance ? parseFloat(startingBalance as string) : undefined
    );

    res.json({ success: true, data: forecast });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to generate forecast'));
  }
});

/**
 * GET /cash-flow/trends
 * Get cash flow trends
 */
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const { period } = req.query;

    const trends = await getCashFlowTrends(
      req.merchantId,
      (period as 'weekly' | 'monthly' | 'quarterly') || 'monthly'
    );

    res.json({ success: true, data: trends });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to get trends'));
  }
});

/**
 * GET /cash-flow/compare
 * Compare forecast vs actual
 */
router.get('/compare', async (req: Request, res: Response) => {
  try {
    const { forecastId } = req.query;

    const comparison = await compareForecastToActual(
      req.merchantId,
      forecastId as string | undefined
    );

    res.json({ success: true, data: comparison });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to get comparison'));
  }
});

export default router;
