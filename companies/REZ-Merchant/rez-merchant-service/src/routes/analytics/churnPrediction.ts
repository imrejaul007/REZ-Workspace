import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ChurnAgent, ChurnPrediction, ChurnAnalysisResult } from '../../services/churnAgent';
import { merchantAuth } from '../../middleware/auth';

const router = Router();
router.use(merchantAuth);

/**
 * GET /merchant/analytics/churn-prediction
 * Analyze churn predictions for all customers
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const lookbackDays = parseInt(req.query.lookbackDays as string) || 180;
    const minDaysSinceLastOrder = parseInt(req.query.minDaysSinceLastOrder as string) || 14;

    const analysis: ChurnAnalysisResult = await ChurnAgent.analyzeChurn(merchantId, {
      lookbackDays,
      minDaysSinceLastOrder,
    });

    res.json({
      success: true,
      data: {
        ...analysis,
        // Include summary percentages
        summary: {
          ...analysis.summary,
          criticalPercentage: analysis.totalCustomers > 0
            ? (analysis.summary.criticalCount / analysis.totalCustomers) * 100
            : 0,
          highRiskPercentage: analysis.totalCustomers > 0
            ? (analysis.summary.highRiskCount / analysis.totalCustomers) * 100
            : 0,
          mediumRiskPercentage: analysis.totalCustomers > 0
            ? (analysis.summary.mediumRiskCount / analysis.totalCustomers) * 100
            : 0,
          lowRiskPercentage: analysis.totalCustomers > 0
            ? (analysis.summary.lowRiskCount / analysis.totalCustomers) * 100
            : 0,
        },
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
 * GET /merchant/analytics/churn-prediction/summary
 * Get quick churn summary for dashboard
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;

    const analysis = await ChurnAgent.analyzeChurn(merchantId);

    res.json({
      success: true,
      data: {
        totalCustomers: analysis.totalCustomers,
        churnRate: analysis.summary.churnRate,
        averageChurnProbability: analysis.summary.averageChurnProbability,
        riskDistribution: {
          critical: analysis.summary.criticalCount,
          high: analysis.summary.highRiskCount,
          medium: analysis.summary.mediumRiskCount,
          low: analysis.summary.lowRiskCount,
        },
        criticalAlerts: analysis.alerts.filter((a) => a.severity === 'critical').length,
        warnings: analysis.alerts.filter((a) => a.severity === 'warning').length,
        analyzedAt: analysis.analyzedAt,
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
 * GET /merchant/analytics/churn-prediction/customer/:userId
 * Get churn prediction for a specific customer
 */
router.get('/customer/:userId', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ success: false, message: 'Valid userId is required' });
      return;
    }

    const prediction: ChurnPrediction | null = await ChurnAgent.getCustomerChurnPrediction(
      merchantId,
      userId
    );

    if (!prediction) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    res.json({
      success: true,
      data: prediction,
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
 * GET /merchant/analytics/churn-prediction/risk-level/:level
 * Get customers by churn risk level
 */
router.get('/risk-level/:level', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { level } = req.params;
    const riskLevel = level as 'low' | 'medium' | 'high' | 'critical';

    if (!['low', 'medium', 'high', 'critical'].includes(riskLevel)) {
      res.status(400).json({
        success: false,
        message: 'Invalid risk level. Must be: low, medium, high, or critical',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const customers = await ChurnAgent.getCustomersByRiskLevel(merchantId, riskLevel);
    const paginatedCustomers = customers.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        riskLevel,
        total: customers.length,
        limit,
        offset,
        customers: paginatedCustomers,
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
 * GET /merchant/analytics/churn-prediction/alerts
 * Get active churn alerts
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const severity = req.query.severity as 'info' | 'warning' | 'critical' | undefined;

    const analysis = await ChurnAgent.analyzeChurn(merchantId);
    let alerts = analysis.alerts;

    if (severity) {
      alerts = alerts.filter((a) => a.severity === severity);
    }

    res.json({
      success: true,
      data: {
        totalAlerts: alerts.length,
        criticalCount: alerts.filter((a) => a.severity === 'critical').length,
        warningCount: alerts.filter((a) => a.severity === 'warning').length,
        infoCount: alerts.filter((a) => a.severity === 'info').length,
        alerts: alerts.slice(0, 100), // Limit to 100 most recent
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
