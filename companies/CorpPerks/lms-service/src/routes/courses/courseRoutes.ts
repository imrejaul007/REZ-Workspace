import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Course, Enrollment } from '../../models/index.js';
import { authenticate, authorize, asyncHandler, AppError, AuthenticatedRequest } from '../../middleware/index.js';

const router = Router();

// Validation schemas
const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.string().min(1),
  thumbnail: z.string().optional(),
  instructor: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  prerequisites: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  maxParticipants: z.number().positive().optional(),
  modules: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    order: z.number(),
    estimatedDuration: z.number().optional(),
    lessons: z.array(z.object({
      title: z.string().min(1),
      type: z.enum(['video', 'text', 'quiz', 'assignment', 'document']),
      content: z.string().min(1),
      duration: z.number().positive(),
      order: z.number(),
      videoUrl: z.string().optional(),
      quizQuestions: z.array(z.object({
        question: z.string().min(1),
        options: z.array(z.string()).min(2),
        correctAnswer: z.number().min(0),
        explanation: z.string().optional(),
      })).optional(),
    })).optional(),
  })).optional(),
});

const updateCourseSchema = createCourseSchema.partial();

// Calculate total duration from modules
const calculateDuration = (modules: any[]): number => {
  return modules?.reduce((total, mod) => {
    return total + (mod.estimatedDuration || mod.lessons?.reduce((sum: number, l: any) => sum + l.duration, 0) || 0);
  }, 0) || 0;
};

// GET /api/courses - List all courses
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = { tenantId: req.tenantId };

    // Apply filters
    if (req.query.category) filter.category = req.query.category;
    if (req.query.level) filter.level = req.query.level;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.isPublic === 'true') filter.isPublic = true;
    if (req.query.search) {
      filter.$text = { $search: req.query.search as string };
    }

    // Public courses visible to all, but filtered for specific tenant
    const [courses, total] = await Promise.all([
      Course.find(filter)
        .select('-modules') // Exclude modules for list view
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Course.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/courses/categories - Get all categories
router.get(
  '/categories',
  authenticate,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const categories = await Course.distinct('category');
    res.json({ success: true, data: categories });
  })
);

// GET /api/courses/stats - Get course statistics
router.get(
  '/stats',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filter = { tenantId: req.tenantId };

    const [total, published, draft, archived, enrollments] = await Promise.all([
      Course.countDocuments(filter),
      Course.countDocuments({ ...filter, status: 'published' }),
      Course.countDocuments({ ...filter, status: 'draft' }),
      Course.countDocuments({ ...filter, status: 'archived' }),
      Enrollment.countDocuments({ tenantId: req.tenantId }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        published,
        draft,
        archived,
        totalEnrollments: enrollments,
      },
    });
  })
);

// GET /api/courses/:id - Get single course with modules
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const course = await Course.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Get enrollment count
    const enrollmentCount = await Enrollment.countDocuments({
      tenantId: req.tenantId,
      courseId: course._id,
    });

    res.json({
      success: true,
      data: {
        ...course.toJSON(),
        enrollmentCount,
      },
    });
  })
);

// POST /api/courses - Create new course
router.post(
  '/',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validated = createCourseSchema.parse(req.body);

    // Calculate total duration
    const duration = calculateDuration(validated.modules || []);

    const course = new Course({
      ...validated,
      tenantId: req.tenantId,
      duration,
      createdBy: req.user?.userId || 'system',
    });

    await course.save();

    res.status(201).json({
      success: true,
      data: course,
      message: 'Course created successfully',
    });
  })
);

// PATCH /api/courses/:id - Update course
router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validated = updateCourseSchema.parse(req.body);

    // Recalculate duration if modules changed
    if (validated.modules) {
      validated.duration = calculateDuration(validated.modules);
    }
    validated.updatedBy = req.user?.userId;

    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { $set: validated },
      { new: true, runValidators: true }
    );

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    res.json({
      success: true,
      data: course,
      message: 'Course updated successfully',
    });
  })
);

// DELETE /api/courses/:id - Delete course (soft delete)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { $set: { status: 'archived' } },
      { new: true }
    );

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    res.json({
      success: true,
      message: 'Course archived successfully',
    });
  })
);

// POST /api/courses/:id/modules - Add module to course
router.post(
  '/:id/modules',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const course = await Course.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const newModule = {
      title: req.body.title,
      description: req.body.description,
      lessons: req.body.lessons || [],
      order: req.body.order ?? course.modules.length,
      estimatedDuration: req.body.estimatedDuration || 0,
    };

    course.modules.push(newModule as any);
    course.duration = calculateDuration(course.modules);
    course.updatedBy = req.user?.userId;

    await course.save();

    res.status(201).json({
      success: true,
      data: course,
      message: 'Module added successfully',
    });
  })
);

export default router;
