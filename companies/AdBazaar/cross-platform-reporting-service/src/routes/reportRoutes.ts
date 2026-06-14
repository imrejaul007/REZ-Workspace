import { Router, Response } from 'express';
import { z } from 'zod';
import { reportService } from '../services/ReportService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

const GenerateReportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  reportType: z.enum(['overview', 'detailed', 'summary', 'custom']),
  sources: z.array(z.string()).min(1),
  metrics: z.array(z.string()).min(1),
  filters: z.record(z.any()).optional(),
  dateRange: z.object({
    start: z.string().transform(s => new Date(s)),
    end: z.string().transform(s => new Date(s))
  }),
  format: z.enum(['json', 'csv', 'pdf', 'excel']).default('json')
});

const ReportQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

router.get('/overview', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const { startDate, endDate } = ReportQuerySchema.parse(req.query);

    const dateRange = startDate && endDate
      ? { start: new Date(startDate), end: new Date(endDate) }
      : undefined;

    const overview = await reportService.getOverview(orgId, dateRange);

    res.json({
      success: true,
      data: overview
    });
  } catch (error: any) {
    logger.error('Error getting overview:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:source', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { source } = req.params;
    const orgId = req.user?.organizationId || 'default';
    const { startDate, endDate } = ReportQuerySchema.parse(req.query);

    const dateRange = startDate && endDate
      ? { start: new Date(startDate), end: new Date(endDate) }
      : undefined;

    const report = await reportService.getReportBySource(source, orgId, dateRange);

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    logger.error(`Error getting report for source ${req.params.source}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/generate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = GenerateReportSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';
    const userId = req.user?.id || 'anonymous';

    const report = await reportService.generateReport({
      ...validated,
      organizationId: orgId,
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error: any) {
    logger.error('Error generating report:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const report = await reportService.getReportById(id, orgId);

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Report not found'
      });
      return;
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    logger.error(`Error getting report ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/export/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const format = (req.query.format as 'json' | 'csv' | 'pdf' | 'excel') || 'json';
    const orgId = req.user?.organizationId || 'default';

    const exportData = await reportService.exportReport(id, format, orgId);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report-${id}.csv"`);
      res.send(exportData);
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }
  } catch (error: any) {
    logger.error(`Error exporting report ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;