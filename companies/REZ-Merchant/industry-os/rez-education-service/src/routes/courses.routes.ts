import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Course, CourseCategory, CourseStatus, DurationUnit } from '../models';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createCourseSchema = z.object({
  merchantId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.nativeEnum(CourseCategory),
  duration: z.number().positive(),
  durationUnit: z.nativeEnum(DurationUnit).optional(),
  batchSize: z.number().int().positive().optional(),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional(),
  instructorId: z.string().optional(),
  schedule: z.array(z.object({
    day: z.string().min(1),
    startTime: z.string().min(1),
    endTime: z.string().min(1)
  })).optional(),
  syllabus: z.array(z.object({
    topic: z.string().min(1),
    description: z.string().optional(),
    order: z.number().int().positive()
  })).optional(),
  maxStudents: z.number().int().positive().optional(),
  startDate: z.string().transform(s => new Date(s)).optional(),
  endDate: z.string().transform(s => new Date(s)).optional(),
  prerequisites: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.nativeEnum(CourseStatus).optional()
});

const updateCourseSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.nativeEnum(CourseCategory).optional(),
  duration: z.number().positive().optional(),
  durationUnit: z.nativeEnum(DurationUnit).optional(),
  batchSize: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
  discountPrice: z.number().positive().optional(),
  instructorId: z.string().optional(),
  schedule: z.array(z.object({
    day: z.string().min(1),
    startTime: z.string().min(1),
    endTime: z.string().min(1)
  })).optional(),
  syllabus: z.array(z.object({
    topic: z.string().min(1),
    description: z.string().optional(),
    order: z.number().int().positive()
  })).optional(),
  maxStudents: z.number().int().positive().optional(),
  startDate: z.string().transform(s => new Date(s)).optional(),
  endDate: z.string().transform(s => new Date(s)).optional(),
  prerequisites: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.nativeEnum(CourseStatus).optional()
});

const searchQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  merchantId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(CourseStatus)
});

/**
 * POST /api/courses - Create a new course
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createCourseSchema.parse(req.body);

    const course = new Course({
      ...validatedData,
      courseId: `CRS-${uuidv4().substring(0, 8).toUpperCase()}`,
      enrollmentCount: 0,
      status: validatedData.status || CourseStatus.ACTIVE
    });

    await course.save();

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/courses - List/search courses
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = searchQuerySchema.parse(req.query);

    const filter: Record<string, unknown> = {};

    if (query.q) {
      filter.$text = { $search: query.q };
    }
    if (query.category) {
      filter.category = query.category;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.merchantId) {
      filter.merchantId = query.merchantId;
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 20;
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Course.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        courses,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/courses/:id - Get course by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const course = await Course.findOne({ courseId: req.params.id });

    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * PUT /api/courses/:id - Update course
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = updateCourseSchema.parse(req.body);

    const course = await Course.findOneAndUpdate(
      { courseId: req.params.id },
      { $set: validatedData },
      { new: true }
    );

    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * DELETE /api/courses/:id - Delete course
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const course = await Course.findOneAndDelete({ courseId: req.params.id });

    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * PATCH /api/courses/:id/status - Update course status
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const validatedData = updateStatusSchema.parse(req.body);

    const course = await Course.findOneAndUpdate(
      { courseId: req.params.id },
      { $set: { status: validatedData.status } },
      { new: true }
    );

    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/courses/categories - Get all course categories
 */
router.get('/meta/categories', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(CourseCategory)
  });
});

export default router;