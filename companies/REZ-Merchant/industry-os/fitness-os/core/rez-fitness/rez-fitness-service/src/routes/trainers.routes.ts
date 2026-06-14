import { Router, Request, Response } from 'express';
import { Trainer, ITrainer, TrainerSpecialization } from '../models/Trainer';
import { classService } from '../services/ClassService';
import { z } from 'zod';

const router = Router();

const CreateTrainerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  specializations: z.array(z.enum([
    'yoga', 'pilates', 'hiit', 'spinning', 'strength', 'crossfit',
    'zumba', 'boxing', 'swimming', 'nutrition', 'rehabilitation', 'personal_training'
  ])).min(1),
  certifications: z.array(z.string()).optional(),
  yearsOfExperience: z.number().min(0).default(0),
  bio: z.string().min(10),
  avatarUrl: z.string().url().optional(),
  hourlyRate: z.number().min(0).default(0),
  availability: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string(),
    endTime: z.string()
  })).optional()
});

const UpdateTrainerSchema = CreateTrainerSchema.partial();

// Create trainer
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = CreateTrainerSchema.parse(req.body);
    const trainer = new Trainer({
      ...data,
      hireDate: new Date()
    });
    await trainer.save();
    res.status(201).json({ success: true, data: trainer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create trainer' });
    }
  }
});

// Get all trainers
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, limit, specialization, active } = req.query;
    const query: unknown = {};

    if (specialization) {
      query.specializations = specialization;
    }

    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Trainer.countDocuments(query);
    const trainers = await Trainer.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ lastName: 1 });

    res.json({
      success: true,
      data: {
        trainers,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch trainers' });
  }
});

// Get trainer by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({ success: false, error: 'Trainer not found' });
    }
    res.json({ success: true, data: trainer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch trainer' });
  }
});

// Update trainer
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = UpdateTrainerSchema.parse(req.body);
    const trainer = await Trainer.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!trainer) {
      return res.status(404).json({ success: false, error: 'Trainer not found' });
    }
    res.json({ success: true, data: trainer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update trainer' });
    }
  }
});

// Deactivate trainer
router.patch('/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const trainer = await Trainer.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );
    if (!trainer) {
      return res.status(404).json({ success: false, error: 'Trainer not found' });
    }
    res.json({ success: true, data: trainer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to deactivate trainer' });
  }
});

// Activate trainer
router.patch('/:id/activate', async (req: Request, res: Response) => {
  try {
    const trainer = await Trainer.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: true } },
      { new: true }
    );
    if (!trainer) {
      return res.status(404).json({ success: false, error: 'Trainer not found' });
    }
    res.json({ success: true, data: trainer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to activate trainer' });
  }
});

// Get trainer's classes
router.get('/:id/classes', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const classes = await classService.getClassesByTrainer(req.params.id, {
      startDate: startDate as string,
      endDate: endDate as string
    });
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch trainer classes' });
  }
});

// Update trainer rating
router.patch('/:id/rating', async (req: Request, res: Response) => {
  try {
    const { rating, totalReviews } = req.body;

    if (rating !== undefined && (rating < 0 || rating > 5)) {
      return res.status(400).json({ success: false, error: 'Rating must be between 0 and 5' });
    }

    const updateData: unknown = {};
    if (rating !== undefined) updateData.rating = rating;
    if (totalReviews !== undefined) updateData.totalReviews = totalReviews;

    const trainer = await Trainer.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!trainer) {
      return res.status(404).json({ success: false, error: 'Trainer not found' });
    }

    res.json({ success: true, data: trainer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update trainer rating' });
  }
});

// Get trainers by specialization
router.get('/specialization/:specialization', async (req: Request, res: Response) => {
  try {
    const trainers = await Trainer.find({
      specializations: req.params.specialization,
      isActive: true
    }).sort({ rating: -1 });

    res.json({ success: true, data: trainers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch trainers' });
  }
});

// Search trainers
router.get('/search/query', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query required' });
    }

    const trainers = await Trainer.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { firstName: { $regex: q as string, $options: 'i' } },
            { lastName: { $regex: q as string, $options: 'i' } },
            { bio: { $regex: q as string, $options: 'i' } }
          ]
        }
      ]
    }).sort({ rating: -1 });

    res.json({ success: true, data: trainers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to search trainers' });
  }
});

export default router;
