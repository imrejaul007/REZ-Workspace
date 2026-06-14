import { Router, Request, Response } from 'express';
import { LessonModel } from '../models/Lesson';
import { CreateLessonSchema, UpdateLessonSchema } from '../types';
import { ZodError } from 'zod';

const router = Router();

const validateRequest = (schema: typeof CreateLessonSchema | typeof UpdateLessonSchema) => {
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
    const courseId = req.query.courseId as string;
    const type = req.query.type as string;

    const query: Record<string, unknown> = {};
    if (courseId) query.courseId = courseId;
    if (type) query.type = type;

    const skip = (page - 1) * limit;
    const [lessons, total] = await Promise.all([
      LessonModel.find(query)
        .sort({ courseId: 1, order: 1 })
        .skip(skip)
        .limit(limit),
      LessonModel.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: lessons,
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

router.get('/course/:courseId', async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const lessons = await LessonModel.findByCourse(courseId);
    res.json({
      success: true,
      data: lessons
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
    const lesson = await LessonModel.findById(req.params.id);
    if (!lesson) {
      res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
      return;
    }
    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.post('/', validateRequest(CreateLessonSchema), async (req: Request, res: Response) => {
  try {
    const lesson = new LessonModel(req.body);
    await lesson.save();
    res.status(201).json({
      success: true,
      data: lesson,
      message: 'Lesson created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.put('/:id', validateRequest(UpdateLessonSchema), async (req: Request, res: Response) => {
  try {
    const lesson = await LessonModel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!lesson) {
      res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
      return;
    }

    res.json({
      success: true,
      data: lesson,
      message: 'Lesson updated successfully'
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
    const lesson = await LessonModel.findByIdAndDelete(req.params.id);
    if (!lesson) {
      res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
      return;
    }
    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.patch('/:id/order', async (req: Request, res: Response) => {
  try {
    const { order } = req.body;
    const lesson = await LessonModel.findByIdAndUpdate(
      req.params.id,
      { $set: { order } },
      { new: true }
    );

    if (!lesson) {
      res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
      return;
    }

    res.json({
      success: true,
      data: lesson,
      message: 'Lesson order updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
