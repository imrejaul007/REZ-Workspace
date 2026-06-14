import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FillRateService } from '../services/fillRateService';
import { AnalysisService } from '../services/analysisService';
import { OptimizationService } from '../services/optimizationService';
import { AlertService } from '../services/alertService';
import { ForecastService } from '../services/forecastService';
import { logger } from 'utils/logger.js';
import { httpRequestDuration } from '../utils/metrics';

const router = Router();

// Initialize services
const fillRateService = new FillRateService(null);
const analysisService = new AnalysisService();
const optimizationService = new OptimizationService();
const alertService = new AlertService();
const forecastService = new ForecastService();

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  inventoryId: z.string().optional(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).optional(),
  limit: z.string().transform(Number).optional()
});

const optimizationSchema = z.object({
  inventoryId: z.string().optional(),
  targetRate: z.number().min(0).max(100).optional(),
  strategy: z.enum(['aggressive', 'moderate', 'conservative']).optional(),
  timeWindow: z.enum(['1h', '6h', '24h', '7d']).optional()
});

const alertSchema = z.object({
  inventoryId: z.string().optional(),
  inventoryName: z.string().optional(),
  threshold: z.number().min(0).max(100),
  condition: z.enum(['above', 'below', 'equals']),
  notification: z.object({
    email: z.string().email().optional(),
    webhook: z.string().url().optional(),
    slack: z.string().url().optional(),
    sms: z.string().optional()
  }),
  createdBy: z.string()
});

// Response helper
const sendResponse = (res: Response, data: any, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  });
};

const sendError = (res: Response, error: string, statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    error,
    timestamp: new Date().toISOString()
  });
};

// GET /api/fill-rate/current - Current fill rate
router.get('/current', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'get', route: '/current' });
  try {
    const { inventoryId } = req.query;

    const result = await fillRateService.getCurrentFillRate(inventoryId as string);
    sendResponse(res, result);
  } catch (error: any) {
    logger.error('Error getting current fill rate', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// GET /api/fill-rate/summary - Fill rate summary
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'get', route: '/summary' });
  try {
    const periodHours = parseInt(req.query.period as string) || 24;

    const result = await fillRateService.getFillRateSummary(periodHours);
    sendResponse(res, result);
  } catch (error: any) {
    logger.error('Error getting fill rate summary', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// GET /api/fill-rate/history - Fill rate history
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'get', route: '/history' });
  try {
    const validation = dateRangeSchema.safeParse(req.query);
    if (!validation.success) {
      sendError(res, 'Invalid query parameters', 400);
      return;
    }

    const { startDate, endDate, inventoryId, granularity, limit } = validation.data;

    const result = await fillRateService.getFillRateHistory({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      inventoryId,
      granularity: granularity as 'hour' | 'day' | 'week' | 'month' | undefined,
      limit: limit || 100
    });

    sendResponse(res, result);
  } catch (error: any) {
    logger.error('Error getting fill rate history', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// GET /api/fill-rate/analysis - Fill rate analysis
router.get('/analysis', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'get', route: '/analysis' });
  try {
    const inventoryId = req.query.inventoryId as string;

    if (!inventoryId) {
      // Return all latest analyses
      const results = await analysisService.getLatestAnalysis();
      sendResponse(res, results);
    } else {
      // Generate new analysis
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const result = await analysisService.analyzeFillRate(inventoryId, startDate, endDate);
      sendResponse(res, result);
    }
  } catch (error: any) {
    logger.error('Error getting fill rate analysis', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// POST /api/fill-rate/optimize - Optimize fill rate
router.post('/optimize', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'post', route: '/optimize' });
  try {
    const validation = optimizationSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 'Invalid request body', 400);
      return;
    }

    const result = await optimizationService.optimizeFillRate({
      ...validation.data,
      targetRate: validation.data.targetRate || 85
    });

    sendResponse(res, result);
  } catch (error: any) {
    logger.error('Error optimizing fill rate', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// GET /api/fill-rate/recommendations - Get recommendations
router.get('/recommendations', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'get', route: '/recommendations' });
  try {
    const inventoryId = req.query.inventoryId as string;

    // Get latest analysis and extract recommendations
    const analysis = await analysisService.getLatestAnalysis(inventoryId);

    if (!analysis) {
      sendResponse(res, [], 200);
      return;
    }

    const recommendations = Array.isArray(analysis)
      ? analysis.flatMap(a => a.recommendations)
      : (analysis as any).recommendations;

    sendResponse(res, recommendations);
  } catch (error: any) {
    logger.error('Error getting recommendations', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// GET /api/fill-rate/by-inventory - Fill by inventory
router.get('/by-inventory', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'get', route: '/by-inventory' });
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const result = await fillRateService.getFillRateByInventory(startDate, endDate);
    sendResponse(res, result);
  } catch (error: any) {
    logger.error('Error getting fill rate by inventory', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// GET /api/fill-rate/by-demand - Fill by demand source
router.get('/by-demand', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'get', route: '/by-demand' });
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const result = await fillRateService.getFillRateByDemandSource(startDate, endDate);
    sendResponse(res, result);
  } catch (error: any) {
    logger.error('Error getting fill rate by demand', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// POST /api/fill-rate/alerts - Create fill rate alert
router.post('/alerts', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'post', route: '/alerts' });
  try {
    const validation = alertSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 'Invalid request body: ' + validation.error.message, 400);
      return;
    }

    const result = await alertService.createAlert(validation.data);
    sendResponse(res, result, 201);
  } catch (error: any) {
    logger.error('Error creating alert', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// GET /api/fill-rate/alerts - Get all alerts
router.get('/alerts', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'get', route: '/alerts' });
  try {
    const status = req.query.status as 'active' | 'paused' | 'triggered' | 'disabled' | undefined;
    const inventoryId = req.query.inventoryId as string | undefined;

    const result = await alertService.getAlerts({ status, inventoryId });
    sendResponse(res, result);
  } catch (error: any) {
    logger.error('Error getting alerts', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// GET /api/fill-rate/alerts/:id - Get single alert
router.get('/alerts/:id', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'get', route: '/alerts/:id' });
  try {
    const result = await alertService.getAlert(req.params.id);

    if (!result) {
      sendError(res, 'Alert not found', 404);
      return;
    }

    sendResponse(res, result);
  } catch (error: any) {
    logger.error('Error getting alert', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// PUT /api/fill-rate/alerts/:id - Update alert
router.put('/alerts/:id', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'put', route: '/alerts/:id' });
  try {
    const result = await alertService.updateAlert(req.params.id, req.body);

    if (!result) {
      sendError(res, 'Alert not found', 404);
      return;
    }

    sendResponse(res, result);
  } catch (error: any) {
    logger.error('Error updating alert', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// DELETE /api/fill-rate/alerts/:id - Delete alert
router.delete('/alerts/:id', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'delete', route: '/alerts/:id' });
  try {
    const deleted = await alertService.deleteAlert(req.params.id);

    if (!deleted) {
      sendError(res, 'Alert not found', 404);
      return;
    }

    sendResponse(res, { message: 'Alert deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting alert', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// GET /api/fill-rate/alerts/stats - Get alert statistics
router.get('/alerts/stats', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'get', route: '/alerts/stats' });
  try {
    const inventoryId = req.query.inventoryId as string | undefined;
    const result = await alertService.getAlertStats(inventoryId);
    sendResponse(res, result);
  } catch (error: any) {
    logger.error('Error getting alert stats', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// POST /api/fill-rate/alerts/check - Manually trigger alert check
router.post('/alerts/check', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'post', route: '/alerts/check' });
  try {
    const result = await alertService.checkAlerts();
    sendResponse(res, result);
  } catch (error: any) {
    logger.error('Error checking alerts', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// GET /api/fill-rate/forecast - Fill rate forecast
router.get('/forecast', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'get', route: '/forecast' });
  try {
    const inventoryId = req.query.inventoryId as string | undefined;
    const horizon = parseInt(req.query.horizon as string) || 24;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;

    const result = await forecastService.generateForecast({
      inventoryId,
      horizon,
      startDate
    });

    sendResponse(res, result);
  } catch (error: any) {
    logger.error('Error generating forecast', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// GET /api/fill-rate/forecast/accuracy - Get forecast accuracy metrics
router.get('/forecast/accuracy', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'get', route: '/forecast/accuracy' });
  try {
    const inventoryId = req.query.inventoryId as string | undefined;
    const result = await forecastService.getForecastAccuracyMetrics(inventoryId);
    sendResponse(res, result);
  } catch (error: any) {
    logger.error('Error getting forecast accuracy', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// GET /api/fill-rate/forecast/compare - Compare forecast vs actual
router.get('/forecast/compare', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'get', route: '/forecast/compare' });
  try {
    const inventoryId = req.query.inventoryId as string | undefined;
    const days = parseInt(req.query.days as string) || 7;

    const result = await forecastService.compareForecastVsActual(inventoryId, days);
    sendResponse(res, result);
  } catch (error: any) {
    logger.error('Error comparing forecast', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// POST /api/fill-rate/record - Record new fill rate data
router.post('/record', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'post', route: '/record' });
  try {
    const { inventoryId, inventoryName, impressions, filled, requestId, metadata } = req.body;

    if (!inventoryId || impressions === undefined || filled === undefined) {
      sendError(res, 'Missing required fields: inventoryId, impressions, filled', 400);
      return;
    }

    const result = await fillRateService.recordFillRate({
      inventoryId,
      inventoryName,
      impressions,
      filled,
      requestId,
      metadata
    });

    sendResponse(res, result, 201);
  } catch (error: any) {
    logger.error('Error recording fill rate', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

// GET /api/fill-rate/compare - Compare inventories
router.get('/compare', async (req: Request, res: Response, next: NextFunction) => {
  const timer = httpRequestDuration.startTimer({ method: 'get', route: '/compare' });
  try {
    const inventoryIds = (req.query.inventoryIds as string)?.split(',') || [];

    if (inventoryIds.length < 2) {
      sendError(res, 'At least 2 inventory IDs required for comparison', 400);
      return;
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const result = await analysisService.compareInventories(inventoryIds, startDate, endDate);
    sendResponse(res, result);
  } catch (error: any) {
    logger.error('Error comparing inventories', { error: error.message });
    timer?.();
    sendError(res, error.message);
  }
  timer?.();
});

export default router;