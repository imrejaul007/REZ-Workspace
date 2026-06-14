/**
 * CorpPerks Routes
 *
 * API routes for corporate benefits management including:
 * - Benefit packages configuration
 * - Employee enrollment
 * - Benefit allocations
 * - Corporate spending
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth, requireAdminAuth } from '../middleware/auth';
import { CorporateBenefit, BenefitType, BenefitPeriodType } from '../models/CorporateBenefit';
import { CorporateEmployee, EnrollmentStatus, CorpRole } from '../models/CorporateEmployee';
import { logger } from '../config/logger';

const router = Router();

// Zod validation schemas
const createBenefitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  benefitType: z.enum(['meal', 'travel', 'gift', 'wellness', 'flex', 'learning']),
  amount: z.number().positive('Amount must be positive').max(1_000_000),
  periodType: z.enum(['monthly', 'quarterly', 'yearly']),
  rules: z.object({
    minAmount: z.number().min(0).optional(),
    maxAmount: z.number().min(0).optional(),
    requiresApproval: z.boolean().optional(),
    autoApprovalLimit: z.number().min(0).optional(),
    rolloverEnabled: z.boolean().optional(),
    rolloverMaxAmount: z.number().min(0).optional(),
  }).optional(),
  eligibilityCriteria: z.object({
    departments: z.array(z.string()).optional(),
    levels: z.array(z.string()).optional(),
    employmentTypes: z.array(z.enum(['full_time', 'part_time', 'contractor'])).optional(),
  }).optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional(),
});

const enrollEmployeeSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  department: z.string().min(1, 'Department is required'),
  level: z.string().min(1, 'Level is required'),
  designation: z.string().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contractor']).default('full_time'),
  managerId: z.string().optional(),
  corpRole: z.enum(['corp_admin', 'corp_hr', 'corp_finance', 'corp_manager', 'corp_employee']).default('corp_employee'),
  benefits: z.array(z.object({
    benefitId: z.string(),
    allocatedAmount: z.number().positive(),
  })).optional(),
});

const allocateBenefitSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  benefitId: z.string().min(1, 'Benefit ID is required'),
  amount: z.number().positive('Amount must be positive'),
});

function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: Function) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error.errors[0].message });
    }
    req.body = result.data;
    next();
  };
}

// ============================================
// BENEFIT PACKAGES (Admin)
// ============================================

/**
 * Create a new benefit package
 * POST /api/corp/benefits
 */
router.post('/api/corp/benefits', requireAdminAuth, validateBody(createBenefitSchema), async (req: Request, res: Response) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID required' });
    }

    const benefit = new CorporateBenefit({
      ...req.body,
      companyId: new mongoose.Types.ObjectId(companyId),
      startDate: new Date(req.body.startDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      createdBy: new mongoose.Types.ObjectId(req.userId),
    });

    await benefit.save();
    logger.info('[CorpPerks] Benefit created', { benefitId: benefit._id, companyId, type: req.body.benefitType });

    res.status(201).json({ success: true, data: benefit });
  } catch (err) {
    logger.error('[CorpPerks] Create benefit failed', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get all benefit packages for company
 * GET /api/corp/benefits
 */
router.get('/api/corp/benefits', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID required' });
    }

    const { type, isActive } = req.query;
    const query: Record<string, unknown> = { companyId: new mongoose.Types.ObjectId(companyId) };

    if (type) query.benefitType = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const benefits = await CorporateBenefit.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: benefits });
  } catch (err) {
    logger.error('[CorpPerks] Get benefits failed', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get single benefit package
 * GET /api/corp/benefits/:id
 */
router.get('/api/corp/benefits/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const benefit = await CorporateBenefit.findById(req.params.id);
    if (!benefit) {
      return res.status(404).json({ success: false, message: 'Benefit not found' });
    }
    res.json({ success: true, data: benefit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Update benefit package
 * PUT /api/corp/benefits/:id
 */
router.put('/api/corp/benefits/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const benefit = await CorporateBenefit.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: new mongoose.Types.ObjectId(req.userId) },
      { new: true, runValidators: true }
    );

    if (!benefit) {
      return res.status(404).json({ success: false, message: 'Benefit not found' });
    }

    logger.info('[CorpPerks] Benefit updated', { benefitId: benefit._id });
    res.json({ success: true, data: benefit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// EMPLOYEE ENROLLMENT (Admin)
// ============================================

/**
 * Enroll a new corporate employee
 * POST /api/corp/employees
 */
router.post('/api/corp/employees', requireAdminAuth, validateBody(enrollEmployeeSchema), async (req: Request, res: Response) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID required' });
    }

    // Check if already enrolled
    const existing = await CorporateEmployee.findOne({
      userId: new mongoose.Types.ObjectId(req.body.userId),
      companyId: new mongoose.Types.ObjectId(companyId),
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Employee already enrolled' });
    }

    const employee = new CorporateEmployee({
      ...req.body,
      userId: new mongoose.Types.ObjectId(req.body.userId),
      companyId: new mongoose.Types.ObjectId(companyId),
      managerId: req.body.managerId ? new mongoose.Types.ObjectId(req.body.managerId) : undefined,
      enrollmentStatus: EnrollmentStatus.ENROLLED,
      enrolledAt: new Date(),
      createdBy: new mongoose.Types.ObjectId(req.userId),
    });

    // Auto-enroll in benefits if specified
    if (req.body.benefits?.length) {
      const now = new Date();
      employee.benefits = req.body.benefits.map((b) => ({
        benefitId: new mongoose.Types.ObjectId(b.benefitId),
        benefitType: 'benefit',
        allocatedAmount: b.allocatedAmount,
        utilizedAmount: 0,
        remainingAmount: b.allocatedAmount,
        enrolledAt: now,
        lastResetDate: now,
        rolloverAmount: 0,
        isActive: true,
      }));
    }

    await employee.save();
    logger.info('[CorpPerks] Employee enrolled', { employeeId: employee._id, companyId });

    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    logger.error('[CorpPerks] Enroll employee failed', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get all employees for company
 * GET /api/corp/employees
 */
router.get('/api/corp/employees', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID required' });
    }

    const { department, enrollmentStatus, corpRole, page = 1, limit = 20 } = req.query;
    const query: Record<string, unknown> = { companyId: new mongoose.Types.ObjectId(companyId) };

    if (department) query.department = department;
    if (enrollmentStatus) query.enrollmentStatus = enrollmentStatus;
    if (corpRole) query.corpRole = corpRole;

    const skip = (Number(page) - 1) * Number(limit);

    const [employees, total] = await Promise.all([
      CorporateEmployee.find(query)
        .populate('userId', 'name email phoneNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      CorporateEmployee.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: employees,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get single employee
 * GET /api/corp/employees/:id
 */
router.get('/api/corp/employees/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const employee = await CorporateEmployee.findById(req.params.id)
      .populate('userId', 'name email phoneNumber')
      .populate('benefits.benefitId');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Allocate benefit to employee
 * POST /api/corp/employees/:id/benefits
 */
router.post('/api/corp/employees/:id/benefits', requireAdminAuth, validateBody(allocateBenefitSchema), async (req: Request, res: Response) => {
  try {
    const employee = await CorporateEmployee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const benefit = await CorporateBenefit.findById(req.body.benefitId);
    if (!benefit) {
      return res.status(404).json({ success: false, message: 'Benefit not found' });
    }

    const now = new Date();
    const enrollment = {
      benefitId: new mongoose.Types.ObjectId(req.body.benefitId),
      benefitType: benefit.benefitType,
      allocatedAmount: req.body.amount,
      utilizedAmount: 0,
      remainingAmount: req.body.amount,
      enrolledAt: now,
      lastResetDate: now,
      rolloverAmount: 0,
      isActive: true,
    };

    // Add or update benefit enrollment
    const existingIdx = employee.benefits.findIndex(
      b => b.benefitId.toString() === req.body.benefitId
    );

    if (existingIdx >= 0) {
      employee.benefits[existingIdx] = enrollment;
    } else {
      employee.benefits.push(enrollment);
    }

    // Update benefit stats
    benefit.enrolledEmployees += 1;
    benefit.totalAllocated += req.body.amount;
    await benefit.save();

    await employee.save();
    logger.info('[CorpPerks] Benefit allocated', { employeeId: employee._id, benefitId: benefit._id, amount: req.body.amount });

    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// EMPLOYEE SELF-SERVICE
// ============================================

/**
 * Get my corporate profile and benefits
 * GET /api/corp/me
 */
router.get('/api/corp/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID required' });
    }

    const employee = await CorporateEmployee.findOne({
      userId: new mongoose.Types.ObjectId(req.userId),
      companyId: new mongoose.Types.ObjectId(companyId),
    }).populate('benefits.benefitId');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Not enrolled in corporate benefits' });
    }

    // Get active benefits with remaining amounts
    const activeBenefits = employee.benefits
      .filter(b => b.isActive)
      .map(b => ({
        benefitId: b.benefitId,
        benefitType: b.benefitType,
        allocatedAmount: b.allocatedAmount,
        remainingAmount: b.remainingAmount,
        utilizedAmount: b.utilizedAmount,
        periodStart: b.lastResetDate,
      }));

    res.json({
      success: true,
      data: {
        employeeId: employee.employeeId,
        department: employee.department,
        level: employee.level,
        enrollmentStatus: employee.enrollmentStatus,
        corpRole: employee.corpRole,
        benefits: activeBenefits,
        stats: employee.stats,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get my benefit balance summary
 * GET /api/corp/me/benefits/summary
 */
router.get('/api/corp/me/benefits/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID required' });
    }

    const employee = await CorporateEmployee.findOne({
      userId: new mongoose.Types.ObjectId(req.userId),
      companyId: new mongoose.Types.ObjectId(companyId),
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Not enrolled in corporate benefits' });
    }

    // Calculate summary by benefit type
    const summary: Record<string, { allocated: number; utilized: number; remaining: number }> = {};

    for (const benefit of employee.benefits.filter(b => b.isActive)) {
      const type = benefit.benefitType;
      if (!summary[type]) {
        summary[type] = { allocated: 0, utilized: 0, remaining: 0 };
      }
      summary[type].allocated += benefit.allocatedAmount;
      summary[type].utilized += benefit.utilizedAmount;
      summary[type].remaining += benefit.remainingAmount;
    }

    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
