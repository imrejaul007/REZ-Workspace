/**
 * Forecasting Routes
 *
 * Cash flow forecasting and analytics:
 * - Generate cash flow forecast
 * - Get short-term forecasts
 * - Get aging analysis
 */

import { Router, Request, Response } from 'express';
import { merchantAuth } from '../middleware/auth';
import {
  generateCashFlowForecast,
  getShortTermForecast,
} from '../services/forecastingService';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { SupplierLedger } from '../models/SupplierLedger';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

// Cache TTL in seconds
const CACHE_TTL = {
  cashFlow: 300, // 5 minutes
  shortTerm: 300,
  aging: 180, // 3 minutes
  dashboard: 60, // 1 minute
};

// ── Cache Helpers ────────────────────────────────────────────────────────────

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

async function setCache(key: string, data: unknown, ttl: number): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch {
    // Cache failure is non-fatal
  }
}

/**
 * GET /forecasting/cash-flow
 * Generate cash flow forecast
 */
router.get('/cash-flow', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 90;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;

    if (days > 365) {
      res.status(400).json({ success: false, message: 'Maximum forecast period is 365 days' });
      return;
    }

    // Try cache first
    const cacheKey = `forecast:cashflow:${req.merchantId}:${days}:${startDate?.toISOString() || 'now'}`;
    const cached = await getCached<unknown>(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached, cached: true });
      return;
    }

    const forecast = await generateCashFlowForecast(req.merchantId!, {
      days,
      startDate,
    });

    // Cache the result
    await setCache(cacheKey, forecast, CACHE_TTL.cashFlow);

    res.json({
      success: true,
      data: forecast,
    });
  } catch (err) {
    logger.error('[Forecast] Cash flow forecast failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to generate forecast' });
  }
});

/**
 * GET /forecasting/short-term
 * Get short-term (daily) forecast
 */
router.get('/short-term', async (req: Request, res: Response) => {
  try {
    const horizon = parseInt(req.query.horizon as string) as 7 | 14 | 30 || 30;

    if (![7, 14, 30].includes(horizon)) {
      res.status(400).json({ success: false, message: 'Horizon must be 7, 14, or 30' });
      return;
    }

    const forecast = await getShortTermForecast(req.merchantId!, horizon);

    res.json({
      success: true,
      data: forecast,
    });
  } catch (err) {
    logger.error('[Forecast] Short-term forecast failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to generate forecast' });
  }
});

/**
 * GET /forecasting/aging
 * Get aging analysis with summary
 */
router.get('/aging', async (req: Request, res: Response) => {
  try {
    const supplierId = req.query.supplierId as string | undefined;

    // Get outstanding POs
    const matchQuery: unknown = {
      merchantId: req.merchantId,
      paymentStatus: { $in: ['unpaid', 'partial', 'overdue'] },
      isDeleted: { $ne: true },
    };
    if (supplierId) {
      matchQuery.supplierId = supplierId;
    }

    const pos = await PurchaseOrder.find(matchQuery).lean();

    // Calculate aging
    const now = new Date();
    const aging = {
      current: { amount: 0, count: 0 },
      days30to60: { amount: 0, count: 0 },
      days60to90: { amount: 0, count: 0 },
      days90plus: { amount: 0, count: 0 },
    };

    for (const po of pos) {
      const dueDate = new Date(po.dueDate);
      const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
      const outstanding = (po.totalAmount || 0) - (po.paidAmount || 0);

      if (outstanding <= 0) continue;

      if (daysDiff <= 0) {
        aging.current.amount += outstanding;
        aging.current.count++;
      } else if (daysDiff <= 30) {
        aging.days30to60.amount += outstanding;
        aging.days30to60.count++;
      } else if (daysDiff <= 60) {
        aging.days60to90.amount += outstanding;
        aging.days60to90.count++;
      } else {
        aging.days90plus.amount += outstanding;
        aging.days90plus.count++;
      }
    }

    const totalOutstanding =
      aging.current.amount +
      aging.days30to60.amount +
      aging.days60to90.amount +
      aging.days90plus.amount;

    res.json({
      success: true,
      data: {
        asOfDate: now,
        totalOutstanding,
        buckets: [
          {
            bucket: 'current',
            label: 'Not Yet Due',
            amount: aging.current.amount,
            count: aging.current.count,
            percentage: totalOutstanding > 0 ? (aging.current.amount / totalOutstanding) * 100 : 0,
          },
          {
            bucket: 'days30to60',
            label: '1-30 Days Overdue',
            amount: aging.days30to60.amount,
            count: aging.days30to60.count,
            percentage: totalOutstanding > 0 ? (aging.days30to60.amount / totalOutstanding) * 100 : 0,
          },
          {
            bucket: 'days60to90',
            label: '31-60 Days Overdue',
            amount: aging.days60to90.amount,
            count: aging.days60to90.count,
            percentage: totalOutstanding > 0 ? (aging.days60to90.amount / totalOutstanding) * 100 : 0,
          },
          {
            bucket: 'days90plus',
            label: '90+ Days Overdue',
            amount: aging.days90plus.amount,
            count: aging.days90plus.count,
            percentage: totalOutstanding > 0 ? (aging.days90plus.amount / totalOutstanding) * 100 : 0,
            isCritical: true,
          },
        ],
      },
    });
  } catch (err) {
    logger.error('[Forecast] Aging analysis failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to generate aging report' });
  }
});

/**
 * GET /forecasting/dashboard
 * Get dashboard summary
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // Get current outstanding
    const outstandingPOs = await PurchaseOrder.find({
      merchantId: req.merchantId,
      paymentStatus: { $in: ['unpaid', 'partial', 'overdue'] },
      isDeleted: { $ne: true },
    }).lean();

    const totalOutstanding = outstandingPOs.reduce(
      (sum, po) => sum + ((po.totalAmount || 0) - (po.paidAmount || 0)),
      0
    );

    // Count overdue
    const overdueCount = outstandingPOs.filter(
      (po) => new Date(po.dueDate) < now
    ).length;

    // Get this week's due
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dueThisWeek = outstandingPOs.filter((po) => {
      const due = new Date(po.dueDate);
      return due >= now && due <= weekEnd;
    });
    const dueThisWeekAmount = dueThisWeek.reduce(
      (sum, po) => sum + ((po.totalAmount || 0) - (po.paidAmount || 0)),
      0
    );

    // Get supplier count
    const supplierCount = await SupplierLedger.distinct('supplierId', {
      merchantId: req.merchantId,
    });

    // Generate mini forecast
    const miniForecast = await getShortTermForecast(req.merchantId!, 7);
    const weekNetFlow = miniForecast.reduce((sum, d) => sum + d.netFlow, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalOutstanding,
          overdueCount,
          dueThisWeek: {
            count: dueThisWeek.length,
            amount: dueThisWeekAmount,
          },
          activeSuppliers: supplierCount.length,
          weekNetFlow,
        },
        alerts: [],
      },
    });
  } catch (err) {
    logger.error('[Forecast] Dashboard failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to generate dashboard' });
  }
});

export default router;
