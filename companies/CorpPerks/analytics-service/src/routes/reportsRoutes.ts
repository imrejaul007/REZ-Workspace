import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { Report, ScheduledReport } from '../models';
import { scheduledReportService } from '../services/scheduledReportService';
import { logger } from '../utils/logger';
import { CreateScheduledReportSchema, UpdateScheduledReportSchema } from '../utils/validators';
import { ZodError } from 'zod';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/reports/schedule
 * Create a scheduled report
 */
router.post('/schedule', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = CreateScheduledReportSchema.parse(req.body);

    const result = await scheduledReportService.createScheduledReport({
      ...validatedData,
      createdBy: req.userId || 'system',
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SCHEDULE_FAILED',
          message: result.error,
        },
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: result.scheduledReport,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
      return;
    }
    logger.error('Create scheduled report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create scheduled report',
      },
    });
  }
});

/**
 * GET /api/reports/scheduled
 * List all scheduled reports
 */
router.get('/scheduled', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { isActive, reportType } = req.query;

    const reports = await scheduledReportService.listScheduledReports({
      isActive: isActive === 'true',
      reportType: reportType as string,
    });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    logger.error('List scheduled reports error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list scheduled reports',
      },
    });
  }
});

/**
 * GET /api/reports/scheduled/:id
 * Get a specific scheduled report
 */
router.get('/scheduled/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const scheduledReport = await ScheduledReport.findById(req.params.id).lean();

    if (!scheduledReport) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Scheduled report not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: scheduledReport,
    });
  } catch (error) {
    logger.error('Get scheduled report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get scheduled report',
      },
    });
  }
});

/**
 * PATCH /api/reports/scheduled/:id
 * Update a scheduled report
 */
router.patch('/scheduled/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = UpdateScheduledReportSchema.parse(req.body);

    const result = await scheduledReportService.updateScheduledReport(
      req.params.id,
      validatedData
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: result.error,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: result.scheduledReport,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
      return;
    }
    logger.error('Update scheduled report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update scheduled report',
      },
    });
  }
});

/**
 * DELETE /api/reports/scheduled/:id
 * Delete a scheduled report
 */
router.delete('/scheduled/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await scheduledReportService.deleteScheduledReport(req.params.id);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: result.error,
        },
      });
      return;
    }

    res.json({
      success: true,
      message: 'Scheduled report deleted',
    });
  } catch (error) {
    logger.error('Delete scheduled report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete scheduled report',
      },
    });
  }
});

/**
 * GET /api/reports/history
 * Get report generation history
 */
router.get('/history', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type, startDate, endDate, limit = '50', offset = '0' } = req.query;

    const query: Record<string, unknown> = {};

    if (type) {
      query.type = type;
    }
    if (startDate || endDate) {
      query.generatedAt = {};
      if (startDate) {
        (query.generatedAt as Record<string, Date>).$gte = new Date(startDate as string);
      }
      if (endDate) {
        (query.generatedAt as Record<string, Date>).$lte = new Date(endDate as string);
      }
    }

    const reports = await Report.find(query)
      .sort({ generatedAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .lean();

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + reports.length < total,
        },
      },
    });
  } catch (error) {
    logger.error('Get report history error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get report history',
      },
    });
  }
});

/**
 * GET /api/reports/:id
 * Get a specific report
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const report = await Report.findById(req.params.id).lean();

    if (!report) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get report',
      },
    });
  }
});

export default router;
