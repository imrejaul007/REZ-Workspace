import { Router, Response } from 'express';
import { z } from 'zod';
import { chartService } from '../services/ChartService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

const CreateChartSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['line', 'bar', 'pie', 'area', 'scatter', 'gauge', 'funnel', 'heatmap', 'candlestick']),
  description: z.string().optional(),
  dataConfig: z.object({
    xAxis: z.string(),
    yAxis: z.array(z.string()),
    groupBy: z.string().optional(),
    aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).optional()
  }),
  visualization: z.object({
    showLegend: z.boolean().default(true),
    showGrid: z.boolean().default(true),
    showLabels: z.boolean().default(true),
    colorScheme: z.array(z.string()).optional(),
    animations: z.boolean().default(true)
  }).optional(),
  thresholds: z.array(z.object({
    value: z.number(),
    color: z.string(),
    label: z.string().optional()
  })).optional(),
  annotations: z.array(z.object({
    x: z.union([z.string(), z.number()]),
    label: z.string(),
    color: z.string().optional()
  })).optional(),
  isTemplate: z.boolean().optional()
});

const UpdateChartSchema = CreateChartSchema.partial();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const type = req.query.type as string | undefined;

    const charts = await chartService.getCharts(orgId, type);

    res.json({
      success: true,
      data: charts,
      count: charts.length
    });
  } catch (error: any) {
    logger.error('Error getting charts:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/templates', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const type = req.query.type as string | undefined;

    const templates = await chartService.getTemplates(type);

    res.json({
      success: true,
      data: templates
    });
  } catch (error: any) {
    logger.error('Error getting chart templates:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = CreateChartSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';
    const userId = req.user?.id || 'anonymous';

    const chart = await chartService.createChart({
      ...validated,
      organizationId: orgId,
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      data: chart
    });
  } catch (error: any) {
    logger.error('Error creating chart:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const chart = await chartService.getChartById(id, orgId);

    if (!chart) {
      res.status(404).json({ success: false, error: 'Chart not found' });
      return;
    }

    res.json({
      success: true,
      data: chart
    });
  } catch (error: any) {
    logger.error(`Error getting chart ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = UpdateChartSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const chart = await chartService.updateChart(id, validated, orgId);

    if (!chart) {
      res.status(404).json({ success: false, error: 'Chart not found' });
      return;
    }

    res.json({
      success: true,
      data: chart
    });
  } catch (error: any) {
    logger.error(`Error updating chart ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const deleted = await chartService.deleteChart(id, orgId);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Chart not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Chart deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting chart ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/render', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const rendered = await chartService.renderChart(id, orgId);

    res.json({
      success: true,
      data: rendered
    });
  } catch (error: any) {
    logger.error(`Error rendering chart ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;