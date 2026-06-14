/**
 * Employee Routes
 *
 * API endpoints for CorpPerks employee integration
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  validateEmployee,
  syncEmployee,
  getCorporateDiscount,
  applyCorporateDiscount,
  logCorporateExpense,
  getCorporateAllowance,
  deductFromAllowance,
  getCorporateCatalog,
  batchSyncEmployees,
  hasActiveAllowance,
  getExpenseHistory,
  validateDiscountEligibility,
  syncDiscountConfig,
  Employee,
  CorporateDiscount,
  CorporateAllowance,
  CorporateExpense,
  DiscountApplication
} from '../services/employeeIntegration';
import { authenticateToken, authenticateInternalService, requireRoles } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const employeeSchema = z.object({
  employeeId: z.string().min(1),
  email: z.string().email(),
  companyId: z.string().min(1),
  department: z.string().optional(),
  designation: z.string().optional(),
  corporateTier: z.enum(['standard', 'premium', 'enterprise'])
});

const discountApplicationSchema = z.object({
  customerId: z.string().min(1),
  cartTotal: z.number().positive(),
  category: z.string().min(1)
});

const expenseLogSchema = z.object({
  employeeId: z.string().min(1),
  companyId: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  merchantId: z.string().min(1),
  orderId: z.string().min(1)
});

const allowanceDeductSchema = z.object({
  employeeId: z.string().min(1),
  amount: z.number().positive(),
  orderId: z.string().min(1)
});

const batchSyncSchema = z.object({
  companyId: z.string().min(1),
  employees: z.array(employeeSchema).min(1)
});

// Error handler wrapper
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware to extract auth token
function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

/**
 * POST /api/v1/employee/validate
 * Validate employee token and return employee data
 */
router.post(
  '/employee/validate',
  asyncHandler(async (req: Request, res: Response) => {
    const token = extractAuthToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const employee = await validateEmployee(token);

    if (!employee) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Sync employee to merchant service
    await syncEmployee(employee.companyId, employee);

    return res.status(200).json({
      success: true,
      employee
    });
  })
);

/**
 * POST /api/v1/employee/sync
 * Sync employee data to merchant service
 */
router.post(
  '/employee/sync',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = employeeSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee data',
        details: validation.error.issues
      });
    }

    const employee: Employee = validation.data;
    await syncEmployee(employee.companyId, employee);

    return res.status(200).json({
      success: true,
      message: 'Employee synced successfully'
    });
  })
);

/**
 * POST /api/v1/employee/batch-sync
 * Batch sync multiple employees
 */
router.post(
  '/employee/batch-sync',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = batchSyncSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid batch sync data',
        details: validation.error.issues
      });
    }

    const { companyId, employees } = validation.data;
    const result = await batchSyncEmployees(companyId, employees);

    return res.status(200).json({
      success: true,
      synced: result.synced,
      failed: result.failed
    });
  })
);

/**
 * GET /api/v1/discount/:companyId
 * Get corporate discount for a company and category
 */
router.get(
  '/discount/:companyId',
  asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const { category } = req.query;

    if (!category || typeof category !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Category parameter is required'
      });
    }

    const discount = await getCorporateDiscount(companyId, category);

    return res.status(200).json({
      success: true,
      discount
    });
  })
);

/**
 * POST /api/v1/discount/apply
 * Apply corporate discount to cart
 */
router.post(
  '/discount/apply',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = discountApplicationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid discount application data',
        details: validation.error.issues
      });
    }

    const { customerId, cartTotal, category } = validation.data;
    const result = await applyCorporateDiscount(customerId, cartTotal, category);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'No applicable discount found'
      });
    }

    const application: DiscountApplication = {
      discount: result.discount,
      companyId: result.companyId,
      originalTotal: cartTotal,
      finalTotal: cartTotal - result.discount
    };

    return res.status(200).json({
      success: true,
      application
    });
  })
);

/**
 * POST /api/v1/discount/eligibility
 * Check discount eligibility without applying
 */
router.post(
  '/discount/eligibility',
  asyncHandler(async (req: Request, res: Response) => {
    const { companyId, category, cartTotal } = req.body;

    if (!companyId || !category || typeof cartTotal !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'companyId, category, and cartTotal are required'
      });
    }

    const result = await validateDiscountEligibility(companyId, category, cartTotal);

    return res.status(200).json({
      success: true,
      ...result
    });
  })
);

/**
 * GET /api/v1/discount/:companyId/all
 * Get all discount configurations for a company
 */
router.get(
  '/discount/:companyId/all',
  asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;

    const discounts = await syncDiscountConfig(companyId);

    return res.status(200).json({
      success: true,
      discounts
    });
  })
);

/**
 * POST /api/v1/expense/log
 * Log a corporate expense
 */
router.post(
  '/expense/log',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = expenseLogSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid expense data',
        details: validation.error.issues
      });
    }

    await logCorporateExpense(validation.data);

    return res.status(201).json({
      success: true,
      message: 'Expense logged successfully'
    });
  })
);

/**
 * GET /api/v1/expense/history/:employeeId
 * Get expense history for an employee
 */
router.get(
  '/expense/history/:employeeId',
  asyncHandler(async (req: Request, res: Response) => {
    const { employeeId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const expenses = await getExpenseHistory(employeeId, limit);

    return res.status(200).json({
      success: true,
      expenses
    });
  })
);

/**
 * GET /api/v1/allowance/:employeeId
 * Get corporate allowance for an employee
 */
router.get(
  '/allowance/:employeeId',
  asyncHandler(async (req: Request, res: Response) => {
    const { employeeId } = req.params;

    const allowance = await getCorporateAllowance(employeeId);

    return res.status(200).json({
      success: true,
      allowance
    });
  })
);

/**
 * GET /api/v1/allowance/:employeeId/status
 * Check if employee has active allowance
 */
router.get(
  '/allowance/:employeeId/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { employeeId } = req.params;

    const hasAllowance = await hasActiveAllowance(employeeId);
    const allowance = await getCorporateAllowance(employeeId);

    return res.status(200).json({
      success: true,
      hasActiveAllowance: hasAllowance,
      allowance
    });
  })
);

/**
 * POST /api/v1/allowance/deduct
 * Deduct from corporate allowance
 */
router.post(
  '/allowance/deduct',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = allowanceDeductSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deduction data',
        details: validation.error.issues
      });
    }

    const { employeeId, amount, orderId } = validation.data;

    // First check if employee has sufficient allowance
    const allowance = await getCorporateAllowance(employeeId);

    if (allowance.remaining < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient allowance',
        remaining: allowance.remaining,
        requested: amount
      });
    }

    const success = await deductFromAllowance(employeeId, amount, orderId);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to deduct from allowance'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Allowance deducted successfully',
      newBalance: allowance.remaining - amount
    });
  })
);

/**
 * GET /api/v1/catalog/:companyId
 * Get corporate catalog for a company
 */
router.get(
  '/catalog/:companyId',
  asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.params;

    const products = await getCorporateCatalog(companyId);

    return res.status(200).json({
      success: true,
      products
    });
  })
);

/**
 * Health check endpoint
 */
router.get(
  '/health',
  asyncHandler(async (req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      status: 'healthy',
      service: 'REZ Merchant CorpPerks Bridge',
      timestamp: new Date().toISOString()
    });
  })
);

export default router;
