import { Router, Request, Response } from 'express';
import { EnrollmentModel } from '../models/Enrollment';
import { CreateEnrollmentSchema, UpdateProgressSchema } from '../types';
import { ZodError } from 'zod';

const router = Router();

const validateRequest = (schema: typeof CreateEnrollmentSchema | typeof UpdateProgressSchema) => {
  return async (req: Request, res: Response, next: Function) => {
    try {
      const data = await schema.parseAsync(req.body);
      req.body = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      next(error);
    }
  };
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const studentId = req.query.studentId as string;
    const courseId = req.query.courseId as string;
    const status = req.query.status as string;

    const query: Record<string, unknown> = {};
    if (studentId) query.studentId = studentId;
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [enrollments, total] = await Promise.all([
      EnrollmentModel.find(query)
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(limit),
      EnrollmentModel.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/student/:studentId', async (req: Request, res: Response) => {
  try {
    const enrollments = await EnrollmentModel.findByStudent(req.params.studentId);
    res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/course/:courseId', async (req: Request, res: Response) => {
  try {
    const enrollments = await EnrollmentModel.findByCourse(req.params.courseId);
    res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const enrollment = await EnrollmentModel.findById(req.params.id);
    if (!enrollment) {
      res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
      return;
    }
    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.post('/', validateRequest(CreateEnrollmentSchema), async (req: Request, res: Response) => {
  try {
    const { studentId, courseId, batchId } = req.body;

    const existing = await EnrollmentModel.findOne({ studentId, courseId });
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Student already enrolled in this course'
      });
      return;
    }

    const enrollment = new EnrollmentModel({
      studentId,
      courseId,
      batchId,
      enrolledAt: new Date(),
      progress: 0,
      status: 'active',
      completedLessons: [],
      lastAccessedAt: new Date()
    });

    await enrollment.save();
    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Enrollment created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.patch('/:id/progress', validateRequest(UpdateProgressSchema), async (req: Request, res: Response) => {
  try {
    const { lessonId, completed } = req.body;
    const enrollment = await EnrollmentModel.findById(req.params.id);

    if (!enrollment) {
      res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
      return;
    }

    if (completed && !enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    } else if (!completed && enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons = enrollment.completedLessons.filter(id => id !== lessonId);
    }

    enrollment.progress = await enrollment.calculateProgress(10);
    enrollment.lastAccessedAt = new Date();

    if (enrollment.progress === 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }

    await enrollment.save();
    res.json({
      success: true,
      data: enrollment,
      message: 'Progress updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const enrollment = await EnrollmentModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!enrollment) {
      res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
      return;
    }

    res.json({
      success: true,
      data: enrollment,
      message: 'Status updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const enrollment = await EnrollmentModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'dropped' } },
      { new: true }
    );

    if (!enrollment) {
      res.status(404).json({
        success: false,
        error: 'Enrollment not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Enrollment cancelled'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
