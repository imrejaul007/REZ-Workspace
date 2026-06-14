import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Course, Enrollment, Certificate } from '../../models/index.js';
import { authenticate, authorize, asyncHandler, AppError, AuthenticatedRequest } from '../../middleware/index.js';

const router = Router();

// Validation schemas
const enrollmentSchema = z.object({
  courseId: z.string().min(1),
  employeeId: z.string().min(1).optional(), // Optional for self-enrollment
});

const progressSchema = z.object({
  completedLessons: z.array(z.string()).optional(),
  completedModules: z.array(z.string()).optional(),
  currentModuleIndex: z.number().min(0).optional(),
  currentLessonIndex: z.number().min(0).optional(),
  progress: z.number().min(0).max(100).optional(),
});

const quizScoreSchema = z.object({
  lessonId: z.string().min(1),
  score: z.number().min(0).max(100),
  answers: z.array(z.object({
    questionIndex: z.number(),
    selectedAnswer: z.number(),
  })),
});

// POST /api/enrollments - Enroll employee in course
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { courseId, employeeId } = enrollmentSchema.parse(req.body);
    const targetEmployeeId = employeeId || req.user?.userId;

    // Check if course exists
    const course = await Course.findOne({
      _id: courseId,
      tenantId: req.tenantId,
      status: 'published',
    });

    if (!course) {
      throw new AppError('Course not found or not available', 404);
    }

    // Check for existing enrollment
    const existing = await Enrollment.findOne({
      tenantId: req.tenantId,
      courseId: course._id,
      employeeId: targetEmployeeId,
    });

    if (existing) {
      throw new AppError('Already enrolled in this course', 400);
    }

    // Check max participants
    if (course.maxParticipants) {
      const currentCount = await Enrollment.countDocuments({
        tenantId: req.tenantId,
        courseId: course._id,
      });

      if (currentCount >= course.maxParticipants) {
        throw new AppError('Course is full', 400);
      }
    }

    // Create enrollment
    const enrollment = new Enrollment({
      tenantId: req.tenantId,
      courseId: course._id,
      employeeId: targetEmployeeId,
      progress: 0,
      completedModules: [],
      completedLessons: [],
      currentModuleIndex: 0,
      currentLessonIndex: 0,
      startedAt: new Date(),
      lastAccessedAt: new Date(),
    });

    await enrollment.save();

    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Enrolled successfully',
    });
  })
);

// GET /api/enrollments - List enrollments (admin)
router.get(
  '/',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = { tenantId: req.tenantId };

    if (req.query.courseId) filter.courseId = req.query.courseId;
    if (req.query.status === 'completed') {
      filter.completedAt = { $exists: true };
    } else if (req.query.status === 'in_progress') {
      filter.completedAt = { $exists: false };
    }

    const [enrollments, total] = await Promise.all([
      Enrollment.find(filter)
        .populate('courseId', 'title category thumbnail')
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(limit),
      Enrollment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/enrollments/employee/:employeeId - Get employee's enrollments
router.get(
  '/employee/:employeeId',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    // User can only see their own enrollments unless admin
    const targetEmployeeId = (req.user?.role === 'admin' || req.user?.role === 'hr_manager')
      ? req.params.employeeId
      : req.user?.userId;

    const filter: any = {
      tenantId: req.tenantId,
      employeeId: targetEmployeeId,
    };

    if (req.query.status === 'completed') {
      filter.completedAt = { $exists: true };
    } else if (req.query.status === 'in_progress') {
      filter.completedAt = { $exists: false };
    }

    const [enrollments, total] = await Promise.all([
      Enrollment.find(filter)
        .populate('courseId', 'title category thumbnail duration modules level')
        .sort({ lastAccessedAt: -1 })
        .skip(skip)
        .limit(limit),
      Enrollment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/enrollments/my - Get current user's enrollments
router.get(
  '/my',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = {
      tenantId: req.tenantId,
      employeeId: req.user?.userId,
    };

    if (req.query.status === 'completed') {
      filter.completedAt = { $exists: true };
    } else if (req.query.status === 'in_progress') {
      filter.completedAt = { $exists: false };
    }

    const [enrollments, total] = await Promise.all([
      Enrollment.find(filter)
        .populate('courseId', 'title category thumbnail duration modules level thumbnail')
        .sort({ lastAccessedAt: -1 })
        .skip(skip)
        .limit(limit),
      Enrollment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/enrollments/:id - Get single enrollment
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    }).populate('courseId');

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    // Check access
    if (
      enrollment.employeeId !== req.user?.userId &&
      req.user?.role !== 'admin' &&
      req.user?.role !== 'hr_manager'
    ) {
      throw new AppError('Access denied', 403);
    }

    res.json({
      success: true,
      data: enrollment,
    });
  })
);

// PATCH /api/enrollments/:id/progress - Update progress
router.patch(
  '/:id/progress',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validated = progressSchema.parse(req.body);

    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    }).populate('courseId');

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    // Check access
    if (
      enrollment.employeeId !== req.user?.userId &&
      req.user?.role !== 'admin' &&
      req.user?.role !== 'hr_manager'
    ) {
      throw new AppError('Access denied', 403);
    }

    // Update fields
    if (validated.completedLessons) {
      enrollment.completedLessons = [...new Set([...enrollment.completedLessons, ...validated.completedLessons])];
    }
    if (validated.completedModules) {
      enrollment.completedModules = [...new Set([...enrollment.completedModules, ...validated.completedModules])];
    }
    if (validated.currentModuleIndex !== undefined) {
      enrollment.currentModuleIndex = validated.currentModuleIndex;
    }
    if (validated.currentLessonIndex !== undefined) {
      enrollment.currentLessonIndex = validated.currentLessonIndex;
    }
    if (validated.progress !== undefined) {
      enrollment.progress = validated.progress;
    }

    enrollment.lastAccessedAt = new Date();

    // Auto-complete if progress reaches 100
    if (enrollment.progress >= 100 && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
    }

    await enrollment.save();

    res.json({
      success: true,
      data: enrollment,
      message: 'Progress updated',
    });
  })
);

// POST /api/enrollments/:id/quiz - Submit quiz score
router.post(
  '/:id/quiz',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { lessonId, score, answers } = quizScoreSchema.parse(req.body);

    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    }).populate('courseId');

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    if (enrollment.employeeId !== req.user?.userId) {
      throw new AppError('Access denied', 403);
    }

    // Add lesson to completed if score is passing (>= 70%)
    if (score >= 70) {
      if (!enrollment.completedLessons.includes(lessonId)) {
        enrollment.completedLessons.push(lessonId);
      }
    }

    // Update best score
    if (enrollment.score === undefined || score > enrollment.score) {
      enrollment.score = score;
    }

    enrollment.lastAccessedAt = new Date();
    await enrollment.save();

    res.json({
      success: true,
      data: {
        passed: score >= 70,
        score,
        completed: enrollment.completedLessons.includes(lessonId),
      },
    });
  })
);

// POST /api/enrollments/:id/complete - Mark enrollment as complete
router.post(
  '/:id/complete',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    }).populate('courseId');

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    if (
      enrollment.employeeId !== req.user?.userId &&
      req.user?.role !== 'admin' &&
      req.user?.role !== 'hr_manager'
    ) {
      throw new AppError('Access denied', 403);
    }

    if (enrollment.completedAt) {
      throw new AppError('Already completed', 400);
    }

    // Mark as complete
    enrollment.progress = 100;
    enrollment.completedAt = new Date();
    enrollment.lastAccessedAt = new Date();

    // Generate certificate
    const certificateId = `CERT-${uuidv4().substring(0, 8).toUpperCase()}`;

    const certificate = new Certificate({
      tenantId: req.tenantId!,
      enrollmentId: enrollment._id,
      courseId: enrollment.courseId._id,
      employeeId: enrollment.employeeId,
      certificateId,
      issuedAt: new Date(),
      metadata: {
        courseTitle: (enrollment.courseId as any).title || 'Course',
        employeeName: req.body.employeeName || 'Employee',
        completionDate: new Date(),
        score: enrollment.score,
      },
    });

    await certificate.save();

    enrollment.certificateId = certificate._id;
    await enrollment.save();

    res.json({
      success: true,
      data: {
        enrollment,
        certificate,
      },
      message: 'Course completed and certificate issued',
    });
  })
);

// GET /api/enrollments/:id/certificate - Get certificate for enrollment
router.get(
  '/:id/certificate',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    if (
      enrollment.employeeId !== req.user?.userId &&
      req.user?.role !== 'admin' &&
      req.user?.role !== 'hr_manager'
    ) {
      throw new AppError('Access denied', 403);
    }

    if (!enrollment.certificateId) {
      throw new AppError('No certificate found', 404);
    }

    const certificate = await Certificate.findOne({
      _id: enrollment.certificateId,
      tenantId: req.tenantId,
    });

    if (!certificate) {
      throw new AppError('Certificate not found', 404);
    }

    res.json({
      success: true,
      data: certificate,
    });
  })
);

export default router;
