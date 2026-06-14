import { Router, Request, Response } from 'express';
import { reportService } from '../services/reportService';
import { asyncHandler, AppError } from '../middleware';
import { validateRequest, ExportRequestSchema } from '../utils/validators';
import { logger } from 'utils/logger.js';

const router = Router();

// GET /api/report/:id - Detailed report
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const report = await reportService.generateReport(id);

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    res.json({
      success: true,
      data: report,
    });
  })
);

// POST /api/report/:id/export - Export report (PDF, CSV)
router.post(
  '/:id/export',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { format } = validateRequest(ExportRequestSchema, req.body);

    const loggerCtx = logger.child({ action: 'export_report', checkId: id, format });

    try {
      let content: Buffer | string;
      let contentType: string;
      let filename: string;

      if (format === 'pdf') {
        content = await reportService.exportPDF(id);
        contentType = 'application/pdf';
        filename = `authenticity-report-${id}.pdf`;
      } else {
        content = await reportService.exportCSV(id);
        contentType = 'text/csv';
        filename = `authenticity-report-${id}.csv`;
      }

      loggerCtx.info('Report exported successfully');

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      loggerCtx.error('Report export failed', { error });
      throw error;
    }
  })
);

export default router;