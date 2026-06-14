import { Router, Response } from 'express';
import { reimbursementService } from '../services/index.js';
import { validate } from '../middleware/validate.js';
import { requireTenant } from '../middleware/index.js';
import { createReimbursementSchema, updateReimbursementSchema, reimbursementQuerySchema } from '../validators/payroll.validator.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// Apply tenant middleware to all routes
router.use(requireTenant);

/**
 * GET /api/reimbursements/:employeeId
 * Get reimbursements for an employee
 */
router.get('/:employeeId', validate(reimbursementQuerySchema, 'query'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { employeeId } = req.params;
    const query = req.query as Record<string, string | undefined>;
    const type = query.type;
    const status = query.status;
    const startDate = query.startDate;
    const endDate = query.endDate;
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);

    const result = await reimbursementService.getReimbursements(tenantId, employeeId, {
      type,
      status,
      startDate,
      endDate,
      page,
      limit,
    });

    res.json(result);
  } catch (error) {
    logger.error('Error fetching reimbursements:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reimbursements' });
  }
});

/**
 * POST /api/reimbursements
 * Submit a new reimbursement request
 */
router.post('/', validate(createReimbursementSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const input = req.body;
    const employeeName = req.user?.email?.split('@')[0] || 'Unknown';

    const result = await reimbursementService.submitReimbursement(tenantId, input, employeeName);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error submitting reimbursement:', error);
    res.status(500).json({ success: false, error: 'Failed to submit reimbursement' });
  }
});

/**
 * PATCH /api/reimbursements/:id/status
 * Approve or reject a reimbursement
 */
router.patch('/:id/status', validate(updateReimbursementSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const approvedBy = req.user?.userId || 'system';

    if (!['approved', 'rejected', 'paid'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const result = await reimbursementService.updateReimbursementStatus(
      tenantId,
      id,
      status as 'approved' | 'rejected',
      approvedBy,
      rejectionReason
    );

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    logger.error('Error updating reimbursement:', error);
    res.status(500).json({ success: false, error: 'Failed to update reimbursement' });
  }
});

/**
 * GET /api/reimbursements/:employeeId/summary
 * Get reimbursement summary for an employee
 */
router.get('/:employeeId/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { employeeId } = req.params;
    const { fiscalYear } = req.query as { fiscalYear?: string };

    const result = await reimbursementService.getReimbursementSummary(tenantId, employeeId, fiscalYear);

    res.json(result);
  } catch (error) {
    logger.error('Error fetching reimbursement summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reimbursement summary' });
  }
});

/**
 * GET /api/reimbursements/:employeeId/pending
 * Get pending reimbursements for payroll processing
 */
router.get('/:employeeId/pending', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { employeeId } = req.params;

    const result = await reimbursementService.getPendingForPayroll(tenantId, employeeId);

    res.json(result);
  } catch (error) {
    logger.error('Error fetching pending reimbursements:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending reimbursements' });
  }
});

/**
 * GET /api/reimbursements/admin/pending
 * Get all pending reimbursements (HR Dashboard)
 */
router.get('/admin/pending', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { page, limit } = req.query as { page?: string; limit?: string };

    const result = await reimbursementService.getAllPendingReimbursements(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );

    res.json(result);
  } catch (error) {
    logger.error('Error fetching all pending reimbursements:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending reimbursements' });
  }
});

export default router;
