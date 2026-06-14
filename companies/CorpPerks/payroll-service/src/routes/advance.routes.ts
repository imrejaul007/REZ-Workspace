import { Router, Response } from 'express';
import { advanceService } from '../services/index.js';
import { validate } from '../middleware/validate.js';
import { requireTenant } from '../middleware/index.js';
import { salaryAdvanceSchema, approveAdvanceSchema } from '../validators/payroll.validator.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// Apply tenant middleware to all routes
router.use(requireTenant);

/**
 * POST /api/payroll/advance
 * Request a salary advance
 */
router.post('/', validate(salaryAdvanceSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const input = req.body;
    const employeeName = req.user?.email?.split('@')[0] || 'Unknown Employee';

    const result = await advanceService.requestAdvance(tenantId, input, employeeName);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error requesting salary advance:', error);
    res.status(500).json({ success: false, error: 'Failed to request salary advance' });
  }
});

/**
 * GET /api/payroll/advance/:employeeId
 * Get salary advances for an employee
 */
router.get('/:employeeId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { employeeId } = req.params;
    const { status } = req.query as { status?: string };

    const result = await advanceService.getEmployeeAdvances(tenantId, employeeId, status);

    res.json(result);
  } catch (error) {
    logger.error('Error fetching salary advances:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch salary advances' });
  }
});

/**
 * PATCH /api/payroll/advance/:advanceId/approve
 * Approve or reject a salary advance
 */
router.patch('/:advanceId/approve', validate(approveAdvanceSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { advanceId } = req.params;
    const { approvedAmount, status, rejectionReason } = req.body;
    const approvedBy = req.user?.userId || 'system';

    const result = await advanceService.approveAdvance(
      tenantId,
      advanceId,
      approvedBy,
      approvedAmount,
      status as 'approved' | 'rejected',
      rejectionReason
    );

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    logger.error('Error approving salary advance:', error);
    res.status(500).json({ success: false, error: 'Failed to process salary advance' });
  }
});

/**
 * PATCH /api/payroll/advance/:advanceId/cancel
 * Cancel a salary advance request
 */
router.patch('/:advanceId/cancel', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { advanceId } = req.params;
    const { employeeId } = req.body;

    if (!employeeId) {
      res.status(400).json({ success: false, error: 'Employee ID is required' });
      return;
    }

    const result = await advanceService.cancelAdvance(tenantId, advanceId, employeeId);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    logger.error('Error cancelling salary advance:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel salary advance' });
  }
});

/**
 * PATCH /api/payroll/advance/:advanceId/deduct
 * Mark advance as deducted (after payroll processing)
 */
router.patch('/:advanceId/deduct', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { advanceId } = req.params;
    const { actualMonth, actualYear } = req.body;

    if (!actualMonth || !actualYear) {
      res.status(400).json({ success: false, error: 'Month and year are required' });
      return;
    }

    const result = await advanceService.markAsDeducted(
      tenantId,
      advanceId,
      actualMonth,
      actualYear
    );

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    logger.error('Error marking advance as deducted:', error);
    res.status(500).json({ success: false, error: 'Failed to mark advance as deducted' });
  }
});

/**
 * GET /api/payroll/advance/admin/pending
 * Get all pending advances (HR Dashboard)
 */
router.get('/admin/pending', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { page, limit } = req.query as { page?: string; limit?: string };

    const result = await advanceService.getPendingAdvances(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );

    res.json(result);
  } catch (error) {
    logger.error('Error fetching pending advances:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending advances' });
  }
});

/**
 * GET /api/payroll/advance/deduction/:month/:year
 * Get advances due for deduction in a specific month
 */
router.get('/deduction/:month/:year', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const month = parseInt(req.params.month, 10);
    const year = parseInt(req.params.year, 10);

    if (isNaN(month) || isNaN(year)) {
      res.status(400).json({ success: false, error: 'Invalid month or year' });
      return;
    }

    const result = await advanceService.getAdvancesForDeduction(tenantId, month, year);

    res.json(result);
  } catch (error) {
    logger.error('Error fetching advances for deduction:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch advances for deduction' });
  }
});

/**
 * GET /api/payroll/advance/max/:employeeId
 * Calculate maximum advance amount for an employee
 */
router.get('/max/:employeeId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { employeeId } = req.params;

    const result = await advanceService.calculateMaxAdvance(tenantId, employeeId);

    res.json(result);
  } catch (error) {
    logger.error('Error calculating max advance:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate max advance' });
  }
});

export default router;
