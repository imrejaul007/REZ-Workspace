import { Router, Request, Response } from 'express';
import { Trainer } from '../models/Trainer';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { gymId, specialization, active } = req.query;
    const query: Record<string, unknown> = {};
    if (gymId) query.gymId = gymId;
    if (specialization) query.specialization = { $in: [(specialization as string).split(',')] };
    if (active !== undefined) query.isActive = active === 'true';

    const trainers = await Trainer.find(query).sort({ rating: -1, name: 1 });
    res.json({ success: true, data: trainers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch trainers' });
  }
});

router.get('/:trainerId', async (req: Request, res: Response) => {
  try {
    const trainer = await Trainer.findOne({ trainerId: req.params.trainerId });
    if (!trainer) return res.status(404).json({ success: false, error: 'Trainer not found' });
    res.json({ success: true, data: trainer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch trainer' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const trainerId = `TRN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const trainer = new Trainer({ ...req.body, trainerId, rating: 0, totalClasses: 0 });
    await trainer.save();
    res.status(201).json({ success: true, data: trainer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create trainer' });
  }
});

router.put('/:trainerId', async (req: Request, res: Response) => {
  try {
    const trainer = await Trainer.findOneAndUpdate(
      { trainerId: req.params.trainerId },
      { $set: req.body },
      { new: true }
    );
    if (!trainer) return res.status(404).json({ success: false, error: 'Trainer not found' });
    res.json({ success: true, data: trainer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update trainer' });
  }
});

export { router as trainerRoutes };
