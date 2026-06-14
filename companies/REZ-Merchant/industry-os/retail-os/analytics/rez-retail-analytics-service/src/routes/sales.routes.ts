import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { salesAnalyticsService } from '../services/sales-analytics.service';
import { DateRangeSchema } from '../types';
import { logger } from '../utils/logger';

const router = Router();

const dateRangeQuery = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  storeId: z.string().uuid().optional(),
});

/**
 * GET /api/sales/summary
 * Get sales summary
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, storeId } = dateRangeQuery.parse(req.query);
    const summary = await salesAnalyticsService.getSalesSummary({ startDate, endDate }, storeId);
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Error fetching sales summary:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/sales/by-period
 * Get sales by period
 */
router.get('/by-period', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, storeId, granularity } = z.object({
      ...Object.fromEntries(dateRangeQuery.innerType().shape),
      granularity: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
    }).parse(req.query);

    const sales = await salesAnalyticsService.getSalesByPeriod(
      { startDate, endDate },
      granularity,
      storeId
    );
    res.json({ success: true, data: sales });
  } catch (error) {
    logger.error('Error fetching sales by period:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/sales/by-category
 * Get sales by category
 */
router.get('/by-category', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = dateRangeQuery.parse(req.query);
    const sales = await salesAnalyticsService.getSalesByCategory({ startDate, endDate });
    res.json({ success: true, data: sales });
  } catch (error) {
    logger.error('Error fetching sales by category:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/sales/by-payment
 * Get sales by payment method
 */
router.get('/by-payment', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = dateRangeQuery.parse(req.query);
    const sales = await salesAnalyticsService.getSalesByPaymentMethod({ startDate, endDate });
    res.json({ success: true, data: sales });
  } catch (error) {
    logger.error('Error fetching sales by payment:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/sales/hourly
 * Get hourly sales distribution
 */
router.get('/hourly', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = dateRangeQuery.parse(req.query);
    const sales = await salesAnalyticsService.getHourlySales({ startDate, endDate });
    res.json({ success: true, data: sales });
  } catch (error) {
    logger.error('Error fetching hourly sales:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/sales/top-products
 * Get top selling products
 */
router.get('/top-products', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit, sortBy } = z.object({
      ...Object.fromEntries(dateRangeQuery.innerType().shape),
      limit: z.coerce.number().int().positive().default(10),
      sortBy: z.enum(['revenue', 'quantity']).default('revenue'),
    }).parse(req.query);

    const products = await salesAnalyticsService.getTopProducts(
      { startDate, endDate },
      limit,
      sortBy
    );
    res.json({ success: true, data: products });
  } catch (error) {
    logger.error('Error fetching top products:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/sales/comparison
 * Compare current vs previous period
 */
router.get('/comparison', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, previousStartDate, previousEndDate } = z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
      previousStartDate: z.string().datetime(),
      previousEndDate: z.string().datetime(),
    }).parse(req.query);

    const comparison = await salesAnalyticsService.getPeriodComparison(
      { startDate, endDate },
      { startDate: previousStartDate, endDate: previousEndDate }
    );
    res.json({ success: true, data: comparison });
  } catch (error) {
    logger.error('Error fetching comparison:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

export default router;
