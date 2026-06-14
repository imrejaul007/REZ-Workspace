// Cross-Merchant View Service - Analytics Routes
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { aggregatedAnalyticsService } from '../services/aggregatedAnalyticsService';
import { logger } from '../utils/logger';

const router = Router();

const dateSchema = z.string().refine(val => !isNaN(new Date(val).getTime()), {
  message: 'Invalid date format',
});

const metricsQuerySchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

const trendsQuerySchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  granularity: z.enum(['hour', 'day', 'week']).optional(),
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const validated = metricsQuerySchema.parse(req.query);

    const startDate = validated.startDate
      ? new Date(validated.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = validated.endDate
      ? new Date(validated.endDate)
      : new Date();

    const metrics = await aggregatedAnalyticsService.getCrossMerchantMetrics(startDate, endDate);
    res.json({ success: true, data: metrics });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
    }
    logger.error('[AnalyticsRoutes] Get metrics failed', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get metrics' } });
  }
});

router.get('/merchants', async (_req: Request, res: Response) => {
  try {
    const summaries = await aggregatedAnalyticsService.getAllMerchantSummaries();
    res.json({ success: true, data: summaries, meta: { total: summaries.length } });
  } catch (error) {
    logger.error('[AnalyticsRoutes] Get merchants failed', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get merchants' } });
  }
});

router.get('/merchants/top', async (req: Request, res: Response) => {
  try {
    const metric = (req.query.metric as 'conversations' | 'satisfaction' | 'revenue') || 'conversations';
    const limit = parseInt(req.query.limit as string) || 10;
    const top = await aggregatedAnalyticsService.getTopMerchants(metric, limit);
    res.json({ success: true, data: top });
  } catch (error) {
    logger.error('[AnalyticsRoutes] Get top merchants failed', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get top merchants' } });
  }
});

router.get('/merchants/:merchantId', async (req: Request, res: Response) => {
  try {
    const summary = await aggregatedAnalyticsService.getMerchantSummary(req.params.merchantId);
    if (!summary) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Merchant not found' } });
    }
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('[AnalyticsRoutes] Get merchant failed', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get merchant' } });
  }
});

router.get('/trends', async (req: Request, res: Response) => {
  try {
    const validated = trendsQuerySchema.parse(req.query);

    const startDate = validated.startDate
      ? new Date(validated.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = validated.endDate
      ? new Date(validated.endDate)
      : new Date();
    const granularity = validated.granularity || 'day';

    const trends = await aggregatedAnalyticsService.getAggregatedTrends(startDate, endDate, granularity);
    res.json({ success: true, data: trends });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
    }
    logger.error('[AnalyticsRoutes] Get trends failed', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get trends' } });
  }
});

router.post('/compare', async (req: Request, res: Response) => {
  try {
    const { merchantIds } = req.body;
    if (!Array.isArray(merchantIds) || merchantIds.length < 2) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'At least 2 merchantIds required' } });
    }
    const comparison = await aggregatedAnalyticsService.getMerchantComparison(merchantIds);
    res.json({ success: true, data: comparison });
  } catch (error) {
    logger.error('[AnalyticsRoutes] Compare merchants failed', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to compare merchants' } });
  }
});

export default router;
