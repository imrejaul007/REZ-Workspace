import { Router, Response } from 'express';
import { z } from 'zod';
import { dashboardService } from '../services/DashboardService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

const CreateDashboardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  widgets: z.array(z.any()).optional(),
  layout: z.object({
    columns: z.number().min(1).max(24).default(12),
    rowHeight: z.number().min(50).default(100),
    gap: z.number().min(0).default(10)
  }).optional(),
  filters: z.array(z.any()).optional(),
  refreshInterval: z.number().min(60000).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

const UpdateDashboardSchema = CreateDashboardSchema.partial();

const WidgetSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['chart', 'table', 'metric', 'kpi', 'text', 'image']),
  title: z.string().optional(),
  dataSourceId: z.string().optional(),
  query: z.string().optional(),
  chartType: z.enum(['line', 'bar', 'pie', 'area', 'scatter', 'gauge', 'funnel']).optional(),
  visualization: z.object({
    showLegend: z.boolean().optional(),
    showLabels: z.boolean().optional(),
    colorScheme: z.array(z.string()).optional(),
    threshold: z.number().optional()
  }).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
  }),
  refreshInterval: z.number().optional(),
  settings: z.record(z.any()).optional()
});

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string | undefined;

    const result = await dashboardService.listDashboards(orgId, page, limit, category);

    res.json({
      success: true,
      data: result.dashboards,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error: any) {
    logger.error('Error listing dashboards:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/favorites', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const dashboards = await dashboardService.getFavorites(orgId);

    res.json({
      success: true,
      data: dashboards
    });
  } catch (error: any) {
    logger.error('Error getting favorites:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = CreateDashboardSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';
    const userId = req.user?.id || 'anonymous';

    const dashboard = await dashboardService.createDashboard({
      ...validated,
      organizationId: orgId,
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      data: dashboard
    });
  } catch (error: any) {
    logger.error('Error creating dashboard:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const dashboard = await dashboardService.getDashboardById(id, orgId);

    if (!dashboard) {
      res.status(404).json({ success: false, error: 'Dashboard not found' });
      return;
    }

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error: any) {
    logger.error(`Error getting dashboard ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = UpdateDashboardSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const dashboard = await dashboardService.updateDashboard(id, validated, orgId);

    if (!dashboard) {
      res.status(404).json({ success: false, error: 'Dashboard not found' });
      return;
    }

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error: any) {
    logger.error(`Error updating dashboard ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const deleted = await dashboardService.deleteDashboard(id, orgId);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Dashboard not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Dashboard deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting dashboard ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/widgets', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = WidgetSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const dashboard = await dashboardService.addWidget(id, validated, orgId);

    if (!dashboard) {
      res.status(404).json({ success: false, error: 'Dashboard not found' });
      return;
    }

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error: any) {
    logger.error(`Error adding widget to dashboard ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id/widgets/:widgetId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, widgetId } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const dashboard = await dashboardService.removeWidget(id, widgetId, orgId);

    if (!dashboard) {
      res.status(404).json({ success: false, error: 'Dashboard not found' });
      return;
    }

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error: any) {
    logger.error(`Error removing widget from dashboard ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/refresh', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const dashboard = await dashboardService.refreshDashboard(id, orgId);

    if (!dashboard) {
      res.status(404).json({ success: false, error: 'Dashboard not found' });
      return;
    }

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error: any) {
    logger.error(`Error refreshing dashboard ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/favorite', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const dashboard = await dashboardService.toggleFavorite(id, orgId);

    if (!dashboard) {
      res.status(404).json({ success: false, error: 'Dashboard not found' });
      return;
    }

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error: any) {
    logger.error(`Error toggling favorite for dashboard ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;