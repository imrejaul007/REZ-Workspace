import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Store } from '../../models/Store';
import { merchantAuth } from '../../middleware/auth';
import { DemandForecastAgent } from '../../services/demandForecastAgent';

const router = Router();
router.use(merchantAuth);

/**
 * Get merchant store IDs
 */
async function getMerchantStoreIds(merchantId: string): Promise<mongoose.Types.ObjectId[]> {
  const stores = await Store.find({ merchantId: merchantId }, '_id').lean();
  return stores.map((s) => s._id);
}

/**
 * GET /analytics/forecast
 * Get demand forecast with pattern detection and predictions
 *
 * Query params:
 *   - horizon: 7 | 14 | 30 (default: 7)
 *   - storeId: optional specific store ID
 *   - historicalDays: number of historical days to analyze (default: 90)
 */
router.get('/forecast', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const horizon = Math.min(Math.max(parseInt(req.query.horizon as string) || 7, 7), 30) as 7 | 14 | 30;
    const storeId = req.query.storeId as string | undefined;
    const historicalDays = Math.min(Math.max(parseInt(req.query.historicalDays as string) || 90, 30), 365);

    const forecast = await DemandForecastAgent.forecast(
      merchantId,
      horizon,
      storeId,
      historicalDays
    );

    res.json({
      success: true,
      data: forecast,
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /analytics/forecast/historical
 * Get historical demand analysis for a specific period
 *
 * Query params:
 *   - startDate: ISO date string
 *   - endDate: ISO date string
 *   - storeId: optional specific store ID
 */
router.get('/forecast/historical', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const startDateStr = req.query.startDate as string;
    const endDateStr = req.query.endDate as string;
    const storeId = req.query.storeId as string | undefined;

    if (!startDateStr || !endDateStr) {
      res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
      return;
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
      return;
    }

    if (startDate >= endDate) {
      res.status(400).json({
        success: false,
        message: 'startDate must be before endDate',
      });
      return;
    }

    // Limit to 1 year max
    const maxRange = 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > maxRange) {
      res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 1 year',
      });
      return;
    }

    const analysis = await DemandForecastAgent.getDemandAnalysis(
      merchantId,
      startDate,
      endDate,
      storeId
    );

    res.json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /analytics/forecast/patterns
 * Get detected demand patterns
 *
 * Query params:
 *   - storeId: optional specific store ID
 *   - days: number of days to analyze (default: 90)
 */
router.get('/forecast/patterns', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const storeId = req.query.storeId as string | undefined;
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 90, 30), 365);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analysis = await DemandForecastAgent.getDemandAnalysis(
      merchantId,
      startDate,
      endDate,
      storeId
    );

    res.json({
      success: true,
      data: {
        patterns: analysis.patterns,
        summary: analysis.summary,
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /analytics/forecast/signals
 * Get current demand signals and alerts
 *
 * Query params:
 *   - horizon: 7 | 14 | 30 (default: 7)
 *   - storeId: optional specific store ID
 */
router.get('/forecast/signals', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const horizon = Math.min(Math.max(parseInt(req.query.horizon as string) || 7, 7), 30) as 7 | 14 | 30;
    const storeId = req.query.storeId as string | undefined;

    const forecast = await DemandForecastAgent.forecast(merchantId, horizon, storeId);

    res.json({
      success: true,
      data: {
        signals: forecast.demandSignals,
        recommendations: forecast.recommendations,
        horizon,
        generatedAt: forecast.generatedAt,
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /analytics/forecast/summary
 * Get quick forecast summary for dashboard
 *
 * Query params:
 *   - storeId: optional specific store ID
 */
router.get('/forecast/summary', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const storeId = req.query.storeId as string | undefined;

    const forecast = await DemandForecastAgent.forecast(merchantId, 7, storeId);

    // Extract key summary metrics
    const next7Days = forecast.forecasts;
    const highDemandDays = next7Days.filter(f => f.demandLevel === 'high').length;
    const lowDemandDays = next7Days.filter(f => f.demandLevel === 'low').length;
    const avgPredictedOrders = next7Days.reduce((sum, f) => sum + f.predictedOrders, 0) / next7Days.length;
    const avgPredictedRevenue = next7Days.reduce((sum, f) => sum + f.predictedRevenue, 0) / next7Days.length;

    res.json({
      success: true,
      data: {
        period: 'next_7_days',
        generatedAt: forecast.generatedAt,
        predictions: {
          highDemandDays,
          lowDemandDays,
          avgDailyOrders: Math.round(avgPredictedOrders),
          avgDailyRevenue: Math.round(avgPredictedRevenue),
          totalPredictedOrders: next7Days.reduce((sum, f) => sum + f.predictedOrders, 0),
          totalPredictedRevenue: next7Days.reduce((sum, f) => sum + f.predictedRevenue, 0),
        },
        patterns: forecast.patterns.map(p => ({
          type: p.type,
          description: p.description,
          impact: p.impact,
        })),
        criticalSignals: forecast.demandSignals.filter(s => s.severity === 'high' || s.severity === 'critical'),
        topRecommendation: forecast.recommendations[0] || null,
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
