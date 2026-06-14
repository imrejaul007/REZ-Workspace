/**
 * Employee Disbursements Routes
 */

import { Router, Request, Response } from 'express';
import { merchantAuth } from '../middleware/auth';
import {
  addEmployee,
  updateEmployee,
  getEmployees,
  createDisbursement,
  createBulkDisbursement,
  createSalaryBatch,
  approveDisbursement,
  approveBatch,
  processDisbursement,
  processBatch,
  getDisbursement,
  getDisbursements,
  getBatch,
  getBatches,
  cancelDisbursement,
} from '../services/employeePayoutsService';
import { errorResponse, errors } from '../utils/response';

const router = Router();
router.use(merchantAuth);

// ── Employee Management ──────────────────────────────────────────────────────────

/**
 * POST /employee-payouts/employees
 * Add employee
 */
router.post('/employees', async (req: Request, res: Response) => {
  try {
    const { employeeId, name, email, phone, department, designation, bankAccount, upiId } = req.body;

    if (!employeeId || !name || !phone) {
      errorResponse(res, errors.badRequest('Employee ID, name, and phone required'));
      return;
    }

    const employee = await addEmployee(req.merchantId, {
      employeeId,
      name,
      email,
      phone,
      department,
      designation,
      bankAccount,
      upiId,
    });

    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to add employee'));
  }
});

/**
 * GET /employee-payouts/employees
 * Get employees
 */
router.get('/employees', async (req: Request, res: Response) => {
  try {
    const { department, isActive, search } = req.query;

    const employees = await getEmployees(req.merchantId, {
      department: department as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string,
    });

    res.json({ success: true, data: employees });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to get employees'));
  }
});

/**
 * PATCH /employee-payouts/employees/:id
 * Update employee
 */
router.patch('/employees/:id', async (req: Request, res: Response) => {
  try {
    const employee = await updateEmployee(req.merchantId, req.params.id, req.body);

    if (!employee) {
      errorResponse(res, errors.notFound('Employee'));
      return;
    }

    res.json({ success: true, data: employee });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to update employee'));
  }
});

// ── Single Disbursement ─────────────────────────────────────────────────────────

/**
 * POST /employee-payouts
 * Create single disbursement
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { employeeId, type, amount, description, TDSAmount, paymentMethod, period, category } = req.body;

    if (!employeeId || !type || !amount) {
      errorResponse(res, errors.badRequest('Employee ID, type, and amount required'));
      return;
    }

    const disbursement = await createDisbursement(req.merchantId, {
      employeeId,
      type,
      amount,
      description: description || `${type} payment`,
      TDSAmount,
      paymentMethod: paymentMethod || 'bank_transfer',
      period,
      category,
    });

    res.status(201).json({ success: true, data: disbursement });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to create disbursement'));
  }
});

/**
 * GET /employee-payouts
 * Get disbursements
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, status, employeeId, fromDate, toDate, page, limit } = req.query;

    const result = await getDisbursements(req.merchantId, {
      type: type as unknown,
      status: status as unknown,
      employeeId: employeeId as string,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to get disbursements'));
  }
});

/**
 * GET /employee-payouts/:id
 * Get disbursement
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const disbursement = await getDisbursement(req.merchantId, req.params.id);

    if (!disbursement) {
      errorResponse(res, errors.notFound('Disbursement'));
      return;
    }

    res.json({ success: true, data: disbursement });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to get disbursement'));
  }
});

// ── Batch Disbursement ─────────────────────────────────────────────────────────

/**
 * POST /employee-payouts/batch
 * Create bulk disbursement
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { type, disbursements } = req.body;

    if (!type || !disbursements || !Array.isArray(disbursements)) {
      errorResponse(res, errors.badRequest('Type and disbursements array required'));
      return;
    }

    const batch = await createBulkDisbursement(req.merchantId, { type, disbursements });

    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to create batch'));
  }
});

/**
 * POST /employee-payouts/salary-batch
 * Create salary batch
 */
router.post('/salary-batch', async (req: Request, res: Response) => {
  try {
    const { period, salaryData } = req.body;

    if (!period || !salaryData || !Array.isArray(salaryData)) {
      errorResponse(res, errors.badRequest('Period and salary data required'));
      return;
    }

    const batch = await createSalaryBatch(req.merchantId, period, salaryData);

    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to create salary batch'));
  }
});

/**
 * GET /employee-payouts/batches
 * Get batches
 */
router.get('/batches/list', async (req: Request, res: Response) => {
  try {
    const { type, status, page, limit } = req.query;

    const result = await getBatches(req.merchantId, {
      type: type as unknown,
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to get batches'));
  }
});

/**
 * GET /employee-payouts/batches/:id
 * Get batch
 */
router.get('/batches/:id', async (req: Request, res: Response) => {
  try {
    const batch = await getBatch(req.merchantId, req.params.id);

    if (!batch) {
      errorResponse(res, errors.notFound('Batch'));
      return;
    }

    res.json({ success: true, data: batch });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to get batch'));
  }
});

// ── Approval & Processing ───────────────────────────────────────────────────────

/**
 * POST /employee-payouts/:id/approve
 * Approve disbursement
 */
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { approvedBy } = req.body;

    if (!approvedBy) {
      errorResponse(res, errors.badRequest('Approver ID required'));
      return;
    }

    const disbursement = await approveDisbursement(req.merchantId, req.params.id, approvedBy);

    if (!disbursement) {
      errorResponse(res, errors.notFound('Disbursement'));
      return;
    }

    res.json({ success: true, data: disbursement });
  } catch (err) {
    errorResponse(res, errors.internal(err instanceof Error ? err.message : 'Failed to approve'));
  }
});

/**
 * POST /employee-payouts/batches/:id/approve
 * Approve batch
 */
router.post('/batches/:id/approve', async (req: Request, res: Response) => {
  try {
    const { approvedBy } = req.body;

    if (!approvedBy) {
      errorResponse(res, errors.badRequest('Approver ID required'));
      return;
    }

    const batch = await approveBatch(req.merchantId, req.params.id, approvedBy);

    if (!batch) {
      errorResponse(res, errors.notFound('Batch'));
      return;
    }

    res.json({ success: true, data: batch });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to approve batch'));
  }
});

/**
 * POST /employee-payouts/:id/process
 * Process disbursement
 */
router.post('/:id/process', async (req: Request, res: Response) => {
  try {
    const disbursement = await processDisbursement(req.merchantId, req.params.id);

    if (!disbursement) {
      errorResponse(res, errors.notFound('Disbursement'));
      return;
    }

    res.json({ success: true, data: disbursement });
  } catch (err) {
    errorResponse(res, errors.internal(err instanceof Error ? err.message : 'Failed to process'));
  }
});

/**
 * POST /employee-payouts/batches/:id/process
 * Process batch
 */
router.post('/batches/:id/process', async (req: Request, res: Response) => {
  try {
    const batch = await processBatch(req.merchantId, req.params.id);

    if (!batch) {
      errorResponse(res, errors.notFound('Batch'));
      return;
    }

    res.json({ success: true, data: batch });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to process batch'));
  }
});

/**
 * DELETE /employee-payouts/:id
 * Cancel disbursement
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    const result = await cancelDisbursement(req.merchantId, req.params.id, reason || 'Cancelled by user');

    if (!result) {
      errorResponse(res, errors.notFound('Disbursement'));
      return;
    }

    res.json({ success: true, message: 'Disbursement cancelled' });
  } catch (err) {
    errorResponse(res, errors.internal(err instanceof Error ? err.message : 'Failed to cancel'));
  }
});

export default router;
