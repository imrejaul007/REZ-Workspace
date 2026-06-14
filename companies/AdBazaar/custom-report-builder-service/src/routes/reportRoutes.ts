import { Router, Response } from 'express';
import { z } from 'zod';
import { reportService } from '../services/ReportService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

const CreateReportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  widgets: z.array(z.any()).optional(),
  layout: z.object({
    columns: z.number().min(1).max(24).default(12),
    rowHeight: z.number().min(50).default(100),
    gap: z.number().min(0).default(10)
  }).optional(),
  dataSources: z.array(z.any()).optional(),
  filters: z.array(z.any()).optional(),
  refreshInterval: z.number().min(60000).optional(),
  isPublic: z.boolean().optional()
});

const UpdateReportSchema = CreateReportSchema.partial();

const WidgetSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['chart', 'table', 'metric', 'text', 'image', 'filter']),
  title: z.string().optional(),
  dataSourceId: z.string().optional(),
  query: z.string().optional(),
  visualization: z.object({
    chartType: z.enum(['line', 'bar', 'pie', 'area', 'scatter', 'table']).optional(),
    colorScheme: z.array(z.string()).optional(),
    showLegend: z.boolean().optional(),
    showLabels: z.boolean().optional()
  }).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
  }),
  settings: z.record(z.any()).optional()
});

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const result = await reportService.listReports(orgId, page, limit, status);

    res.json({
      success: true,
      data: result.reports,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error: any) {
    logger.error('Error listing reports:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = CreateReportSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';
    const userId = req.user?.id || 'anonymous';

    const report = await reportService.createReport({
      ...validated,
      organizationId: orgId,
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error: any) {
    logger.error('Error creating report:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const report = await reportService.getReportById(id, orgId);

    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found' });
      return;
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    logger.error(`Error getting report ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = UpdateReportSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const report = await reportService.updateReport(id, validated, orgId);

    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found' });
      return;
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    logger.error(`Error updating report ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const deleted = await reportService.deleteReport(id, orgId);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Report not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting report ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/widgets', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = WidgetSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const report = await reportService.addWidget(id, validated, orgId);

    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found' });
      return;
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    logger.error(`Error adding widget to report ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/preview', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const preview = await reportService.previewReport(id, orgId);

    res.json({
      success: true,
      data: preview
    });
  } catch (error: any) {
    logger.error(`Error previewing report ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/run', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const report = await reportService.runReport(id, orgId);

    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found' });
      return;
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    logger.error(`Error running report ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;