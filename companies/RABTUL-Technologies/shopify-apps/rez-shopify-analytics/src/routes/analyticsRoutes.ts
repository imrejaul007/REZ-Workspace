import { Router } from 'express';
import { z } from 'zod';
import { analyticsService } from '../services/analyticsService.js';
import { EventSchema, ReportSchema, DashboardWidgetSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/track', (req, res) => {
  try {
    const event = analyticsService.trackEvent(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    logger.error('Failed to track event', { error });
    res.status(400).json({ success: false, error: 'Invalid event data' });
  }
});

router.get('/events', (req, res) => {
  const { shopId, customerId, eventType, productId, startDate, endDate, limit } = req.query;
  const events = analyticsService.getEvents({
    shopId: shopId as string,
    customerId: customerId as string,
    eventType: eventType as string,
    productId: productId as string,
    startDate: startDate as string,
    endDate: endDate as string,
    limit: limit ? parseInt(limit as string) : undefined
  });
  res.json({ success: true, data: events });
});

router.get('/metrics', (req, res) => {
  const { shopId, startDate, endDate } = req.query;
  if (!shopId || !startDate || !endDate) {
    return res.status(400).json({ success: false, error: 'Missing required params: shopId, startDate, endDate' });
  }
  const metrics = analyticsService.getMetrics(shopId as string, startDate as string, endDate as string);
  res.json({ success: true, data: metrics });
});

router.get('/products/performance', (req, res) => {
  const { shopId, startDate, endDate } = req.query;
  if (!shopId || !startDate || !endDate) {
    return res.status(400).json({ success: false, error: 'Missing required params' });
  }
  const performance = analyticsService.getProductPerformance(shopId as string, startDate as string, endDate as string);
  res.json({ success: true, data: performance });
});

router.get('/traffic/sources', (req, res) => {
  const { shopId, startDate, endDate } = req.query;
  if (!shopId || !startDate || !endDate) {
    return res.status(400).json({ success: false, error: 'Missing required params' });
  }
  const sources = analyticsService.getTrafficSources(shopId as string, startDate as string, endDate as string);
  res.json({ success: true, data: sources });
});

router.post('/reports', (req, res) => {
  try {
    const report = ReportSchema.parse(req.body);
    const created = analyticsService.createReport(report);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else res.status(500).json({ success: false, error: 'Failed to create report' });
  }
});

router.get('/reports', (req, res) => {
  const { shopId } = req.query;
  const reports = analyticsService.getReports(shopId as string | undefined);
  res.json({ success: true, data: reports });
});

router.get('/reports/:id', (req, res) => {
  const report = analyticsService.getReport(req.params.id);
  report ? res.json({ success: true, data: report }) : res.status(404).json({ success: false, error: 'Report not found' });
});

router.post('/reports/:id/generate', (req, res) => {
  const result = analyticsService.generateReport(req.params.id);
  res.json({ success: true, data: result });
});

router.post('/widgets', (req, res) => {
  try {
    const widget = DashboardWidgetSchema.parse(req.body);
    const created = analyticsService.createWidget(widget);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else res.status(500).json({ success: false, error: 'Failed to create widget' });
  }
});

router.get('/widgets', (req, res) => {
  const { dashboardId } = req.query;
  const widgets = analyticsService.getWidgets(dashboardId as string);
  res.json({ success: true, data: widgets });
});

router.post('/funnel/analyze', (req, res) => {
  const { shopId, steps } = req.body;
  if (!shopId || !steps) {
    return res.status(400).json({ success: false, error: 'Missing shopId or steps' });
  }
  const result = analyticsService.analyzeFunnel(shopId, steps);
  res.json({ success: true, data: result });
});

router.get('/cohorts', (req, res) => {
  const { shopId, type } = req.query;
  if (!shopId) {
    return res.status(400).json({ success: false, error: 'Missing shopId' });
  }
  const cohorts = analyticsService.getCohortAnalysis(shopId as string, (type as 'weekly' | 'monthly') || 'monthly');
  res.json({ success: true, data: cohorts });
});

export default router;
