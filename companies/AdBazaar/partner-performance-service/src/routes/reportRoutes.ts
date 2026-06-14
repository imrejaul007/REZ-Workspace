import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { reportService } from '../services/reportService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const generateReportSchema = z.object({
  partnerId: z.string().min(1),
  type: z.enum(['performance', 'revenue', 'campaign', 'roi', 'custom']),
  name: z.string().min(1),
  format: z.enum(['json', 'pdf', 'csv', 'excel']).optional().default('json'),
  period: z.object({
    start: z.string().transform((s) => new Date(s)),
    end: z.string().transform((s) => new Date(s)),
  }),
  filters: z.object({
    campaignIds: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
  }).optional(),
  metrics: z.array(z.string()).optional(),
  scheduled: z.object({
    enabled: z.boolean().optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    recipients: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * POST /api/reports
 * Generate a new report
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = generateReportSchema.parse(req.body);
    const report = await reportService.generateReport(input);

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

/**
 * GET /api/reports/:id
 * Get report by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const report = await reportService.getReport(req.params.id);

    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found' });
      return;
    }

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch report' });
  }
});

/**
 * GET /api/reports/partner/:partnerId
 * Get reports by partner
 */
router.get('/partner/:partnerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { type, status, page = '1', limit = '20' } = req.query;

    const result = await reportService.getReportsByPartner(req.params.partnerId, {
      type: type as any,
      status: status as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result.reports,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
});

/**
 * POST /api/reports/:id/deliver
 * Mark report as delivered
 */
router.post('/:id/deliver', authMiddleware, async (req: Request, res: Response) => {
  try {
    const report = await reportService.markAsDelivered(req.params.id);

    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found or not ready' });
      return;
    }

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to deliver report' });
  }
});

/**
 * DELETE /api/reports/:id
 * Delete report
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const deleted = await reportService.deleteReport(req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Report not found' });
      return;
    }

    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete report' });
  }
});

export default router;