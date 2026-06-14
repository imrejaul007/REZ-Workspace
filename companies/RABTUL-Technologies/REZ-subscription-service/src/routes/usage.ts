import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { usageTracker } from '../services';
import { UsageRecordSchema } from '../types';
import { asyncHandler, authenticateInternal } from '../middleware';
import { logger } from '../utils';

const router = Router();

// Apply authentication to all routes
router.use(authenticateInternal);

/**
 * POST /api/v1/usage
 * Record usage for a subscription
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = UsageRecordSchema.parse(req.body);

    const usageRecord = await usageTracker.recordUsage(validatedData);

    res.status(201).json({
      success: true,
      data: usageRecord
    });
  })
);

/**
 * GET /api/v1/usage
 * List usage records (with optional filters)
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      subscriptionId,
      customerId,
      startDate,
      endDate,
      includeProcessed,
      limit = 100
    } = req.query;

    let usage;

    if (subscriptionId) {
      usage = await usageTracker.getUsageRecords(subscriptionId as string, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        includeProcessed: includeProcessed === 'true',
        limit: parseInt(limit as string, 10)
      });
    } else if (customerId) {
      usage = await usageTracker.getCustomerUsage(customerId as string, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: parseInt(limit as string, 10)
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Either subscriptionId or customerId is required'
      });
      return;
    }

    res.json({
      success: true,
      data: usage,
      count: usage.length
    });
  })
);

/**
 * GET /api/v1/usage/summary
 * Get usage summary for a subscription
 */
router.get(
  '/summary',
  asyncHandler(async (req: Request, res: Response) => {
    const { subscriptionId, periodStart, periodEnd } = req.query;

    if (!subscriptionId) {
      res.status(400).json({
        success: false,
        error: 'subscriptionId is required'
      });
      return;
    }

    const summary = await usageTracker.getUsageSummary(
      subscriptionId as string,
      periodStart ? new Date(periodStart as string) : new Date(),
      periodEnd ? new Date(periodEnd as string) : new Date()
    );

    res.json({
      success: true,
      data: summary
    });
  })
);

/**
 * GET /api/v1/usage/trends
 * Get usage trends for a subscription
 */
router.get(
  '/trends',
  asyncHandler(async (req: Request, res: Response) => {
    const { subscriptionId, days = 30 } = req.query;

    if (!subscriptionId) {
      res.status(400).json({
        success: false,
        error: 'subscriptionId is required'
      });
      return;
    }

    const trends = await usageTracker.getUsageTrends(
      subscriptionId as string,
      parseInt(days as string, 10)
    );

    res.json({
      success: true,
      data: trends
    });
  })
);

/**
 * GET /api/v1/usage/analytics
 * Get usage analytics
 */
router.get(
  '/analytics',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      startDate,
      endDate,
      customerId,
      subscriptionId
    } = req.query;

    const analytics = await usageTracker.getUsageAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      customerId: customerId as string,
      subscriptionId: subscriptionId as string
    });

    res.json({
      success: true,
      data: analytics
    });
  })
);

/**
 * DELETE /api/v1/usage/:id
 * Delete a usage record (for corrections)
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Reason is required for deletion'
      });
      return;
    }

    await usageTracker.deleteUsageRecord(id, reason);

    res.json({
      success: true,
      message: 'Usage record deleted'
    });
  })
);

export default router;
