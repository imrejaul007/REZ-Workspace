import { Router, Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { ApiResponse, TimeReport } from '../types';

const router = Router();

const getTenantId = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return tenantId;
};

// Generate time report
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'startDate and endDate are required',
      };
      return res.status(400).json(response);
    }

    const report = await reportService.generateReport(
      tenantId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    const response: ApiResponse<TimeReport> = {
      success: true,
      data: report,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate report',
    };
    res.status(500).json(response);
  }
});

// Get billable hours report
router.get('/billable', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'startDate and endDate are required',
      };
      return res.status(400).json(response);
    }

    const report = await reportService.getBillableHoursReport(
      tenantId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    const response: ApiResponse<typeof report> = {
      success: true,
      data: report,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate report',
    };
    res.status(500).json(response);
  }
});

// Get daily breakdown for user
router.get('/daily/:userId', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'startDate and endDate are required',
      };
      return res.status(400).json(response);
    }

    const breakdown = await reportService.getDailyBreakdown(
      tenantId,
      req.params.userId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    const response: ApiResponse<typeof breakdown> = {
      success: true,
      data: breakdown,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate breakdown',
    };
    res.status(500).json(response);
  }
});

export default router;
