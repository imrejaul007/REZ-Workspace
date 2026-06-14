import { Router, Request, Response } from 'express';
import { classService } from '../services/ClassService';
import { z } from 'zod';

const router = Router();

const CreateClassSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  classType: z.enum(['yoga', 'pilates', 'hiit', 'spinning', 'strength', 'crossfit', 'zumba', 'boxing', 'swimming', 'personal', 'other']),
  trainerId: z.string(),
  duration: z.number().min(15),
  maxCapacity: z.number().min(1),
  startTime: z.string(),
  room: z.string(),
  equipment: z.array(z.string()).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels']).default('all_levels'),
  price: z.number().min(0).default(0),
  prerequisites: z.array(z.string()).optional()
});

const UpdateClassSchema = CreateClassSchema.partial();

// Create class
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = CreateClassSchema.parse(req.body);
    const fitnessClass = await classService.createClass(data);
    res.status(201).json({ success: true, data: fitnessClass });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create class' });
    }
  }
});

// Get all classes
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, limit, trainerId, classType, status, startDate, endDate } = req.query;
    const result = await classService.getClasses({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      trainerId: trainerId as string,
      classType: classType as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch classes' });
  }
});

// Get upcoming classes
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const { limit, classType } = req.query;
    const classes = await classService.getUpcomingClasses({
      limit: limit ? parseInt(limit as string) : undefined,
      classType: classType as string
    });
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch upcoming classes' });
  }
});

// Get class by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const fitnessClass = await classService.getClassById(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    res.json({ success: true, data: fitnessClass });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch class' });
  }
});

// Update class
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = UpdateClassSchema.parse(req.body);
    const fitnessClass = await classService.updateClass(req.params.id, data);
    if (!fitnessClass) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    res.json({ success: true, data: fitnessClass });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update class' });
    }
  }
});

// Cancel class
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const fitnessClass = await classService.cancelClass(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    res.json({ success: true, data: fitnessClass });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel class' });
  }
});

// Enroll member in class
router.post('/:id/enroll', async (req: Request, res: Response) => {
  try {
    const fitnessClass = await classService.enrollMember(req.params.id);
    res.json({ success: true, data: fitnessClass });
  } catch (error) {
    if (error.message === 'Class not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.message === 'Class is at full capacity' || error.message === 'Cannot enroll in a class that is not scheduled') {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Failed to enroll in class' });
  }
});

// Unenroll member from class
router.post('/:id/unenroll', async (req: Request, res: Response) => {
  try {
    const fitnessClass = await classService.unenrollMember(req.params.id);
    res.json({ success: true, data: fitnessClass });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to unenroll from class' });
  }
});

// Start class
router.patch('/:id/start', async (req: Request, res: Response) => {
  try {
    const fitnessClass = await classService.startClass(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    res.json({ success: true, data: fitnessClass });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to start class' });
  }
});

// Complete class
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const fitnessClass = await classService.completeClass(req.params.id);
    if (!fitnessClass) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    res.json({ success: true, data: fitnessClass });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to complete class' });
  }
});

// Get classes by trainer
router.get('/trainer/:trainerId', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const classes = await classService.getClassesByTrainer(req.params.trainerId, {
      startDate: startDate as string,
      endDate: endDate as string
    });
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch trainer classes' });
  }
});

export default router;
