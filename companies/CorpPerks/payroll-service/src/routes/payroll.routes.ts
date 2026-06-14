import { Router, Response } from 'express';
import { payrollService, payslipService } from '../services/index.js';
import { validate } from '../middleware/validate.js';
import { requireTenant } from '../middleware/index.js';
import { runPayrollSchema, payrollRunQuerySchema, payslipQuerySchema } from '../validators/payroll.validator.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// Apply tenant middleware to all routes
router.use(requireTenant);

/**
 * POST /api/payroll/run
 * Run payroll for a specific month/year
 */
router.post('/run', validate(runPayrollSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const input = req.body;
    const processedBy = req.user?.userId || 'system';

    const result = await payrollService.runPayroll(tenantId, input, processedBy);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error running payroll:', error);
    res.status(500).json({ success: false, error: 'Failed to run payroll' });
  }
});

/**
 * GET /api/payroll/runs
 * Get all payroll runs with filtering
 */
router.get('/runs', validate(payrollRunQuerySchema, 'query'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const query = req.query as Record<string, string | undefined>;
    const month = query.month ? parseInt(query.month, 10) : undefined;
    const year = query.year ? parseInt(query.year, 10) : undefined;
    const status = query.status;
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);

    const result = await payrollService.getPayrollRuns(tenantId, { month, year, status }, page, limit);

    res.json(result);
  } catch (error) {
    logger.error('Error fetching payroll runs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payroll runs' });
  }
});

/**
 * GET /api/payroll/summary/:month/:year
 * Get payroll summary for a specific month/year
 */
router.get('/summary/:month/:year', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const month = parseInt(req.params.month, 10);
    const year = parseInt(req.params.year, 10);

    if (isNaN(month) || isNaN(year)) {
      res.status(400).json({ success: false, error: 'Invalid month or year' });
      return;
    }

    const result = await payrollService.getPayrollSummary(tenantId, month, year);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    logger.error('Error fetching payroll summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payroll summary' });
  }
});

/**
 * DELETE /api/payroll/cancel/:runId
 * Cancel a payroll run
 */
router.delete('/cancel/:runId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { runId } = req.params;

    const result = await payrollService.cancelPayrollRun(tenantId, runId);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    logger.error('Error cancelling payroll run:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel payroll run' });
  }
});

/**
 * GET /api/payroll/payslips/:employeeId
 * Get all payslips for an employee
 */
router.get('/payslips/:employeeId', validate(payslipQuerySchema, 'query'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { employeeId } = req.params;
    const query = req.query as Record<string, string | undefined>;
    const month = query.month ? parseInt(query.month, 10) : undefined;
    const year = query.year ? parseInt(query.year, 10) : undefined;
    const status = query.status;
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);

    const result = await payslipService.getEmployeePayslips(tenantId, employeeId, {
      month,
      year,
      status,
      page,
      limit,
    });

    res.json(result);
  } catch (error) {
    logger.error('Error fetching payslips:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payslips' });
  }
});

/**
 * GET /api/payroll/payslip/:id
 * Get payslip by ID with full details
 */
router.get('/payslip/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const result = await payslipService.getPayslipById(tenantId, id);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    logger.error('Error fetching payslip:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payslip' });
  }
});

/**
 * PATCH /api/payroll/payslip/:id/status
 * Update payslip status (approve/mark as paid)
 */
router.patch('/payslip/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { status, paymentDate, paymentMethod, transactionId } = req.body;

    if (!['approved', 'paid', 'on_hold'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const paymentInfo = status === 'paid' ? {
      date: new Date(paymentDate),
      method: paymentMethod,
      transactionId,
    } : undefined;

    const result = await payslipService.updatePayslipStatus(
      tenantId,
      id,
      status,
      paymentInfo
    );

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    logger.error('Error updating payslip status:', error);
    res.status(500).json({ success: false, error: 'Failed to update payslip status' });
  }
});

/**
 * GET /api/payroll/payslips/stats/:employeeId
 * Get payslip statistics for an employee
 */
router.get('/payslips/stats/:employeeId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { employeeId } = req.params;

    const result = await payslipService.getPayslipStats(tenantId, employeeId);

    res.json(result);
  } catch (error) {
    logger.error('Error fetching payslip stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payslip stats' });
  }
});

export default router;
