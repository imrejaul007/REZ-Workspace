import { Router, Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { analyticsService } from '../services/analytics.service';
import {
  ApiResponse,
  Report,
  ReportConfig,
  ReportType,
  Platform,
  DateRange,
  ExportConfig,
} from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('ReportsRoutes');
const router = Router();

/**
 * POST /api/reports
 * Generate a new report
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const config: ReportConfig = req.body;

    // Validate required fields
    if (!config.name || !config.type || !config.dateRange) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'name, type, and dateRange are required',
      };
      return res.status(400).json(response);
    }

    // Validate report type
    const validTypes: ReportType[] = ['summary', 'detailed', 'roi', 'engagement', 'trends', 'custom'];
    if (!validTypes.includes(config.type)) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Invalid report type. Must be one of: ${validTypes.join(', ')}`,
      };
      return res.status(400).json(response);
    }

    // Fetch metrics for the report
    const metrics = await analyticsService.fetchMetrics(config.dateRange, config.platforms);

    // Generate the report
    const report = await reportService.generateReport(config, metrics);

    const response: ApiResponse<Report> = {
      success: true,
      data: report,
      message: 'Report generated successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to generate report', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to generate report',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/reports
 * List all reports
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const reports = reportService.listReports();

    const response: ApiResponse<Report[]> = {
      success: true,
      data: reports,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to list reports', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to list reports',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/reports/:id
 * Get a specific report
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const report = reportService.getReport(id);

    if (!report) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Report not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Report> = {
      success: true,
      data: report,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get report', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get report',
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/reports/:id/export
 * Export a report to specified format
 */
router.post('/:id/export', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const exportConfig: ExportConfig = req.body;

    // Validate format
    const validFormats = ['csv', 'pdf', 'json', 'xlsx'];
    if (!exportConfig.format || !validFormats.includes(exportConfig.format)) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Invalid format. Must be one of: ${validFormats.join(', ')}`,
      };
      return res.status(400).json(response);
    }

    const report = reportService.getReport(id);
    if (!report) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Report not found',
      };
      return res.status(404).json(response);
    }

    const exported = await reportService.exportReport(id, exportConfig);

    // Set appropriate content type and headers
    const contentTypes: Record<string, string> = {
      csv: 'text/csv',
      pdf: 'application/pdf',
      json: 'application/json',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    const extensions: Record<string, string> = {
      csv: 'csv',
      pdf: 'pdf',
      json: 'json',
      xlsx: 'xlsx',
    };

    res.setHeader('Content-Type', contentTypes[exportConfig.format]);
    res.setHeader('Content-Disposition', `attachment; filename="${report.name}.${extensions[exportConfig.format]}"`);

    // For JSON, send as string; for CSV and PDF, send as buffer
    if (exportConfig.format === 'json') {
      res.send(exported);
    } else {
      res.send(exported);
    }
  } catch (error) {
    logger.error('Failed to export report', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to export report',
    };
    res.status(500).json(response);
  }
});

/**
 * DELETE /api/reports/:id
 * Delete a report
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = reportService.deleteReport(id);

    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Report not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Report deleted successfully',
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to delete report', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to delete report',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/reports/templates/summary
 * Get summary report template
 */
router.get('/templates/summary', async (req: Request, res: Response) => {
  try {
    const { start, end, platforms } = req.query;

    if (!start || !end) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'start and end date parameters are required',
      };
      return res.status(400).json(response);
    }

    const dateRange: DateRange = {
      start: new Date(start as string),
      end: new Date(end as string),
    };

    const platformList = platforms
      ? (platforms as string).split(',') as Platform[]
      : undefined;

    const config: ReportConfig = {
      name: 'Summary Report',
      type: 'summary',
      platforms: platformList || [],
      metrics: ['impressions', 'reach', 'engagements', 'likes', 'comments', 'shares'],
      dateRange,
    };

    const metrics = await analyticsService.fetchMetrics(dateRange, platformList);
    const report = await reportService.generateReport(config, metrics);

    const response: ApiResponse<Report> = {
      success: true,
      data: report,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to generate summary report', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to generate summary report',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/reports/templates/roi
 * Get ROI report template
 */
router.get('/templates/roi', async (req: Request, res: Response) => {
  try {
    const { start, end, platforms } = req.query;

    if (!start || !end) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'start and end date parameters are required',
      };
      return res.status(400).json(response);
    }

    const dateRange: DateRange = {
      start: new Date(start as string),
      end: new Date(end as string),
    };

    const platformList = platforms
      ? (platforms as string).split(',') as Platform[]
      : undefined;

    const config: ReportConfig = {
      name: 'ROI Report',
      type: 'roi',
      platforms: platformList || [],
      metrics: ['spend', 'revenue', 'conversions', 'roas', 'cpa'],
      dateRange,
    };

    const metrics = await analyticsService.fetchMetrics(dateRange, platformList);
    const report = await reportService.generateReport(config, metrics);

    const response: ApiResponse<Report> = {
      success: true,
      data: report,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to generate ROI report', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to generate ROI report',
    };
    res.status(500).json(response);
  }
});

export default router;
