import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { analyticsCore } from '../services/analyticsCore.js';
import { ReportRequestSchema, MetricTypeSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/dashboard', (req, res) => {
  try {
    const request = ReportRequestSchema.parse(req.body);
    res.json({ success: true, data: analyticsCore.generateDashboard(request) });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else res.status(500).json({ success: false, error: 'Dashboard generation failed' });
  }
});

router.get('/metrics/:metric/timeseries', (req, res) => {
  const { metric, startDate, endDate } = req.params;
  if (!startDate || !endDate) return res.status(400).json({ success: false, error: 'startDate and endDate required' });
  res.json({ success: true, data: analyticsCore.getMetricTimeSeries(metric as unknown, startDate, endDate) });
});

router.get('/compare', (req, res) => {
  const { currentStart, currentEnd, previousStart, previousEnd } = req.query;
  if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
    return res.status(400).json({ success: false, error: 'All date parameters required' });
  }
  res.json({ success: true, data: analyticsCore.comparePeriods(currentStart as string, currentEnd as string, previousStart as string, previousEnd as string) });
});

export default router;
