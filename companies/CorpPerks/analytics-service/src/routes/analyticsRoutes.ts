import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { dashboardService } from '../services/dashboardService';
import { employeeAnalyticsService } from '../services/employeeAnalyticsService';
import { attendanceAnalyticsService } from '../services/attendanceAnalyticsService';
import { payrollAnalyticsService } from '../services/payrollAnalyticsService';
import { performanceAnalyticsService } from '../services/performanceAnalyticsService';
import { logger } from '../utils/logger';
import {
  DashboardQuerySchema,
  EmployeeMetricsQuerySchema,
  AttendanceQuerySchema,
  PayrollQuerySchema,
  PerformanceQuerySchema,
  CreateScheduledReportSchema,
  UpdateScheduledReportSchema,
} from '../utils/validators';
import { ZodError } from 'zod';
import { scheduledReportService } from '../services/scheduledReportService';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/analytics/dashboard
 * Main dashboard metrics
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const queryParams = DashboardQuerySchema.parse(req.query);

    const metrics = await dashboardService.getDashboardMetrics({
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      department: queryParams.department,
    });

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
        },
      });
      return;
    }
    logger.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch dashboard metrics',
      },
    });
  }
});

/**
 * GET /api/analytics/employees
 * Employee metrics
 */
router.get('/employees', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const queryParams = EmployeeMetricsQuerySchema.parse(req.query);

    const metrics = await employeeAnalyticsService.getEmployeeMetrics({
      department: queryParams.department,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      includeInactive: queryParams.includeInactive,
    });

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
        },
      });
      return;
    }
    logger.error('Employee analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch employee metrics',
      },
    });
  }
});

/**
 * GET /api/analytics/attendance
 * Attendance analytics
 */
router.get('/attendance', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const queryParams = AttendanceQuerySchema.parse(req.query);

    const metrics = await attendanceAnalyticsService.getAttendanceMetrics({
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      department: queryParams.department,
      employeeId: queryParams.employeeId,
      groupBy: queryParams.groupBy,
    });

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
        },
      });
      return;
    }
    logger.error('Attendance analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch attendance metrics',
      },
    });
  }
});

/**
 * GET /api/analytics/payroll
 * Payroll analytics
 */
router.get('/payroll', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const queryParams = PayrollQuerySchema.parse(req.query);

    const metrics = await payrollAnalyticsService.getPayrollMetrics({
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      department: queryParams.department,
      employeeId: queryParams.employeeId,
      includeDeductions: queryParams.includeDeductions,
    });

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
        },
      });
      return;
    }
    logger.error('Payroll analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch payroll metrics',
      },
    });
  }
});

/**
 * GET /api/analytics/performance
 * Performance metrics
 */
router.get('/performance', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const queryParams = PerformanceQuerySchema.parse(req.query);

    const metrics = await performanceAnalyticsService.getPerformanceMetrics({
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      department: queryParams.department,
      metric: queryParams.metric,
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder,
    });

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
        },
      });
      return;
    }
    logger.error('Performance analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch performance metrics',
      },
    });
  }
});

export default router;
