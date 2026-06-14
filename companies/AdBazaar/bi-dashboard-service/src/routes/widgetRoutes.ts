import { Router, Response } from 'express';
import { z } from 'zod';
import { widgetService } from '../services/WidgetService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

const CreateWidgetSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['chart', 'table', 'metric', 'kpi', 'text', 'image']),
  description: z.string().optional(),
  chartType: z.enum(['line', 'bar', 'pie', 'area', 'scatter', 'gauge', 'funnel', 'heatmap']).optional(),
  visualization: z.object({
    showLegend: z.boolean().optional(),
    showLabels: z.boolean().optional(),
    colorScheme: z.array(z.string()).optional(),
    threshold: z.number().optional(),
    animations: z.boolean().optional()
  }).optional(),
  dataSource: z.object({
    id: z.string(),
    type: z.string(),
    query: z.string().optional()
  }).optional(),
  settings: z.record(z.any()).optional(),
  isGlobal: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

const UpdateWidgetSchema = CreateWidgetSchema.partial();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const type = req.query.type as string | undefined;
    const globalOnly = req.query.global === 'true';

    let widgets;
    if (globalOnly) {
      widgets = await widgetService.getGlobalWidgets(type);
    } else {
      widgets = await widgetService.getWidgets(orgId, type);
    }

    res.json({
      success: true,
      data: widgets,
      count: widgets.length
    });
  } catch (error: any) {
    logger.error('Error getting widgets:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/popular', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const limit = parseInt(req.query.limit as string) || 10;

    const widgets = await widgetService.getPopularWidgets(orgId, limit);

    res.json({
      success: true,
      data: widgets
    });
  } catch (error: any) {
    logger.error('Error getting popular widgets:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = CreateWidgetSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const widget = await widgetService.createWidget({
      ...validated,
      organizationId: orgId
    });

    res.status(201).json({
      success: true,
      data: widget
    });
  } catch (error: any) {
    logger.error('Error creating widget:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const widget = await widgetService.getWidgetById(id, orgId);

    if (!widget) {
      res.status(404).json({ success: false, error: 'Widget not found' });
      return;
    }

    res.json({
      success: true,
      data: widget
    });
  } catch (error: any) {
    logger.error(`Error getting widget ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = UpdateWidgetSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const widget = await widgetService.updateWidget(id, validated, orgId);

    if (!widget) {
      res.status(404).json({ success: false, error: 'Widget not found' });
      return;
    }

    res.json({
      success: true,
      data: widget
    });
  } catch (error: any) {
    logger.error(`Error updating widget ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const deleted = await widgetService.deleteWidget(id, orgId);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Widget not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Widget deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting widget ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;