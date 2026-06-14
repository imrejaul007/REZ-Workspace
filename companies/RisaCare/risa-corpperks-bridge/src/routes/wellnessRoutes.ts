import { Router, Response } from 'express';
import { z } from 'zod';
import { wellnessProgramService } from '../services';
import { authMiddleware, internalOnlyMiddleware, asyncHandler, ApiResponse } from '../middleware';
import { AuthenticatedRequest } from '../middleware/auth';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler';
import { Enrollment } from '../models';

const router = Router();

const UpsertProgramSchema = z.object({
  programId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['fitness', 'nutrition', 'mental_health', 'preventive', 'chronic_care', 'maternity', 'pediatric', 'general']),
  targetAudience: z.enum(['all', 'employees', 'managers', 'seniors']).default('all'),
  duration: z.string().min(1),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'once']),
  pointsReward: z.number().default(0),
  completionCertificate: z.boolean().default(false),
  prerequisites: z.array(z.string()).optional(),
  features: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })),
  status: z.enum(['active', 'inactive', 'draft']).default('draft'),
});

const EnrollSchema = z.object({
  employeeId: z.string().min(1),
  programId: z.string().min(1),
  companyId: z.string().min(1),
});

const UpdateProgressSchema = z.object({
  progress: z.number().min(0).max(100),
});

// GET /api/wellness/programs - Get all programs
router.get('/wellness/programs',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { category, targetAudience, status, limit, offset } = req.query;

    const result = await wellnessProgramService.getAllPrograms({
      category: category as string,
      targetAudience: targetAudience as string,
      status: status as string,
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

// GET /api/wellness/programs/:programId - Get program by ID
router.get('/wellness/programs/:programId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { programId } = req.params;
    const program = await wellnessProgramService.getProgram(programId);

    if (!program) {
      throw new NotFoundError('Wellness program', programId);
    }

    res.status(200).json({
      success: true,
      data: program,
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/wellness/programs - Create or update program
router.post('/wellness/programs',
  internalOnlyMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const parsed = UpsertProgramSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
    }

    const program = await wellnessProgramService.upsertProgram(parsed.data);

    res.status(200).json({
      success: true,
      data: program,
      message: 'Wellness program saved',
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/wellness/programs/:programId/stats - Get program statistics
router.get('/wellness/programs/:programId/stats',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { programId } = req.params;
    const stats = await wellnessProgramService.getProgramStats(programId);

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/enroll - Enroll in wellness program
router.post('/enroll',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const parsed = EnrollSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({
      employeeId: parsed.data.employeeId,
      programId: parsed.data.programId,
    });

    if (existing) {
      throw new ConflictError('Employee already enrolled in this program');
    }

    const enrollment = await wellnessProgramService.enrollEmployee(
      parsed.data.employeeId,
      parsed.data.programId,
      parsed.data.companyId
    );

    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Enrolled successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/enrollments/:employeeId - Get employee enrollments
router.get('/enrollments/:employeeId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { employeeId } = req.params;
    const { status } = req.query;

    const enrollments = await wellnessProgramService.getEmployeeEnrollments(
      employeeId,
      { status: status as string | undefined }
    );

    res.status(200).json({
      success: true,
      data: { enrollments, count: enrollments.length },
      timestamp: new Date().toISOString(),
    });
  })
);

// PATCH /api/enrollments/:enrollmentId/progress - Update progress
router.patch('/enrollments/:enrollmentId/progress',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { enrollmentId } = req.params;
    const parsed = UpdateProgressSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
    }

    const enrollment = await wellnessProgramService.updateProgress(
      enrollmentId,
      parsed.data.progress
    );

    if (!enrollment) {
      throw new NotFoundError('Enrollment', enrollmentId);
    }

    res.status(200).json({
      success: true,
      data: enrollment,
      message: 'Progress updated',
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/stats/wellness - Get wellness statistics
router.get('/stats/wellness',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { companyId } = req.query;
    const stats = await wellnessProgramService.getStats(companyId as string | undefined);

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
