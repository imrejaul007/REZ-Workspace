import { Router, Response } from 'express';
import { z } from 'zod';
import { employeeHealthService } from '../services';
import { authMiddleware, internalOnlyMiddleware, asyncHandler, ApiResponse } from '../middleware';
import { AuthenticatedRequest } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

const router = Router();

const SyncEmployeesSchema = z.object({
  employees: z.array(z.object({
    employeeId: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    companyId: z.string().min(1),
    department: z.string().optional(),
    designation: z.string().optional(),
    dateOfBirth: z.string().datetime().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    allergies: z.array(z.string()).optional(),
    conditions: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    emergencyContact: z.object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    }).optional(),
    consentGiven: z.boolean().default(false),
    consentDate: z.string().datetime().optional(),
    metadata: z.record(z.unknown()).optional(),
  })).min(1),
});

const UpdateConsentSchema = z.object({
  consentGiven: z.boolean(),
});

const UpdateHealthProfileSchema = z.object({
  allergies: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  }).optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
});

// POST /api/sync/employees - Sync employees from CorpPerks
router.post('/sync/employees',
  internalOnlyMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const parsed = SyncEmployeesSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
    }

    const result = await employeeHealthService.syncEmployees(parsed.data.employees);

    res.status(200).json({
      success: true,
      data: result,
      message: `Synced ${result.synced} employees, ${result.failed} failed`,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/employees/:employeeId - Get employee health record
router.get('/employees/:employeeId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { employeeId } = req.params;
    const employee = await employeeHealthService.getEmployee(employeeId);

    if (!employee) {
      throw new NotFoundError('Employee health record', employeeId);
    }

    res.status(200).json({
      success: true,
      data: employee,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/employees - Get employees by company
router.get('/employees',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { companyId, consentOnly, department, limit, offset } = req.query;

    if (!companyId || typeof companyId !== 'string') {
      throw new ValidationError('companyId is required');
    }

    const result = await employeeHealthService.getEmployeesByCompany(companyId, {
      consentOnly: consentOnly === 'true',
      department: department as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  })
);

// PATCH /api/employees/:employeeId/consent - Update consent
router.patch('/employees/:employeeId/consent',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { employeeId } = req.params;
    const parsed = UpdateConsentSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
    }

    const employee = await employeeHealthService.updateConsent(employeeId, parsed.data.consentGiven);

    if (!employee) {
      throw new NotFoundError('Employee health record', employeeId);
    }

    res.status(200).json({
      success: true,
      data: employee,
      message: 'Consent updated',
      timestamp: new Date().toISOString(),
    });
  })
);

// PATCH /api/employees/:employeeId/profile - Update health profile
router.patch('/employees/:employeeId/profile',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { employeeId } = req.params;
    const parsed = UpdateHealthProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
    }

    const employee = await employeeHealthService.updateHealthProfile(employeeId, parsed.data);

    if (!employee) {
      throw new NotFoundError('Employee health record', employeeId);
    }

    res.status(200).json({
      success: true,
      data: employee,
      message: 'Health profile updated',
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/stats/health - Get health statistics
router.get('/stats/health',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { companyId } = req.query;
    const stats = await employeeHealthService.getStats(companyId as string | undefined);

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
