/**
 * Class Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { GymClass } from '../models/GymClass';

const router = Router();

// Validation schema
const classSchema = z.object({
  gymId: z.string().min(1),
  name: z.string().min(1).max(100),
  type: z.enum(['yoga', 'pilates', 'hiit', 'spinning', 'zumba', 'crossfit', 'boxing', 'swimming', 'personal_training', 'other']),
  description: z.string().optional(),
  trainerId: z.string().min(1),
  duration: z.number().min(15).max(180),
  maxParticipants: z.number().min(1).max(100),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels']).default('all_levels'),
  schedule: z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  price: z.number().min(0).default(0),
  room: z.string().optional(),
  equipment: z.array(z.string()).default([]),
});

// GET /api/classes - List classes
router.get('/', async (req: Request, res: Response) => {
  try {
    const { gymId, type, trainerId, dayOfWeek, active } = req.query;

    const query: Record<string, unknown> = {};
    if (gymId) query.gymId = gymId;
    if (type) query.type = type;
    if (trainerId) query.trainerId = trainerId;
    if (dayOfWeek) query['schedule.dayOfWeek'] = parseInt(dayOfWeek as string);
    if (active !== undefined) query.isActive = active === 'true';

    const classes = await GymClass.find(query).sort({ 'schedule.dayOfWeek': 1, 'schedule.startTime': 1 });

    res.json({ success: true, data: classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch classes' });
  }
});

// GET /api/classes/:classId - Get class by ID
router.get('/:classId', async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const gymClass = await GymClass.findOne({ classId });

    if (!gymClass) {
      res.status(404).json({ success: false, error: 'Class not found' });
      return;
    }

    res.json({ success: true, data: gymClass });
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch class' });
  }
});

// POST /api/classes - Create class
router.post('/', async (req: Request, res: Response) => {
  try {
    const validationResult = classSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
      return;
    }

    const data = validationResult.data;
    const classId = `CLS${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const gymClass = new GymClass({
      classId,
      ...data,
      currentParticipants: 0,
    });

    await gymClass.save();

    res.status(201).json({ success: true, data: gymClass });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ success: false, error: 'Failed to create class' });
  }
});

// PUT /api/classes/:classId - Update class
router.put('/:classId', async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const updates = req.body;

    delete updates.classId;
    delete updates.createdAt;
    delete updates.updatedAt;

    const gymClass = await GymClass.findOneAndUpdate(
      { classId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!gymClass) {
      res.status(404).json({ success: false, error: 'Class not found' });
      return;
    }

    res.json({ success: true, data: gymClass });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ success: false, error: 'Failed to update class' });
  }
});

// DELETE /api/classes/:classId - Delete class
router.delete('/:classId', async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;

    const gymClass = await GymClass.findOneAndUpdate(
      { classId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!gymClass) {
      res.status(404).json({ success: false, error: 'Class not found' });
      return;
    }

    res.json({ success: true, message: 'Class deactivated' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ success: false, error: 'Failed to delete class' });
  }
});

// GET /api/classes/schedule/:dayOfWeek - Get classes for a specific day
router.get('/schedule/:dayOfWeek', async (req: Request, res: Response) => {
  try {
    const { dayOfWeek } = req.params;
    const { gymId } = req.query;

    const query: Record<string, unknown> = {
      'schedule.dayOfWeek': parseInt(dayOfWeek),
      isActive: true,
    };

    if (gymId) query.gymId = gymId;

    const classes = await GymClass.find(query).sort({ 'schedule.startTime': 1 });

    res.json({ success: true, data: classes });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch schedule' });
  }
});

export { router as classRoutes };
