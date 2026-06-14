import { Router, Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { ApiResponse, PerformanceReport, DateRange } from '../types';

const router = Router();

const getTenantId = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new Error('Tenant ID is required in x-tenant-id header');
  }
  return tenantId;
};

// Create report
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { title, dateRange, metrics, createdBy } = req.body;

    if (!title || !dateRange || !metrics || !createdBy) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing required fields: title, dateRange, metrics, createdBy',
      };
      return res.status(400).json(response);
    }

    const report = await reportService.create(
      tenantId,
      title,
      dateRange as DateRange,
      metrics,
      createdBy
    );

    const response: ApiResponse<PerformanceReport> = {
      success: true,
      data: report,
      message: 'Report created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create report',
    };
    res.status(400).json(response);
  }
});

// Get all reports
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

    const reports = await reportService.findAll(tenantId, { limit, offset });
    const response: ApiResponse<PerformanceReport[]> = {
      success: true,
      data: reports,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reports',
    };
    res.status(500).json(response);
  }
});

// Get reports by date range
router.get('/range', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { start, end } = req.query;

    if (!start || !end) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'start and end query params are required',
      };
      return res.status(400).json(response);
    }

    const dateRange: DateRange = {
      start: new Date(start as string),
      end: new Date(end as string),
    };

    const reports = await reportService.findByDateRange(tenantId, dateRange);
    const response: ApiResponse<PerformanceReport[]> = {
      success: true,
      data: reports,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reports',
    };
    res.status(500).json(response);
  }
});

// Get aggregate report
router.get('/aggregate', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { start, end } = req.query;

    if (!start || !end) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'start and end query params are required',
      };
      return res.status(400).json(response);
    }

    const dateRange: DateRange = {
      start: new Date(start as string),
      end: new Date(end as string),
    };

    const metrics = await reportService.generateAggregateReport(tenantId, dateRange);
    const response: ApiResponse<typeof metrics> = {
      success: true,
      data: metrics,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate aggregate report',
    };
    res.status(500).json(response);
  }
});

// Get report by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const report = await reportService.findById(tenantId, req.params.id);
    if (!report) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Report not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<PerformanceReport> = {
      success: true,
      data: report,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch report',
    };
    res.status(500).json(response);
  }
});

// Delete report
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const deleted = await reportService.delete(tenantId, req.params.id);
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
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete report',
    };
    res.status(500).json(response);
  }
});

export default router;
