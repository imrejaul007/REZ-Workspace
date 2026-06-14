import { Router, Request, Response } from 'express';
import { GymClass } from '../models/GymClass';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { gymId, type, trainerId, active } = req.query;
    const query: Record<string, unknown> = {};
    if (gymId) query.gymId = gymId;
    if (type) query.type = type;
    if (trainerId) query.trainerId = trainerId;
    if (active !== undefined) query.isActive = active === 'true';

    const classes = await GymClass.find(query).sort({ 'schedule.dayOfWeek': 1, 'schedule.startTime': 1 });
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch classes' });
  }
});

router.get('/:classId', async (req: Request, res: Response) => {
  try {
    const gymClass = await GymClass.findOne({ classId: req.params.classId });
    if (!gymClass) return res.status(404).json({ success: false, error: 'Class not found' });
    res.json({ success: true, data: gymClass });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch class' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const classId = `CLS${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const gymClass = new GymClass({ ...req.body, classId, currentParticipants: 0 });
    await gymClass.save();
    res.status(201).json({ success: true, data: gymClass });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create class' });
  }
});

router.put('/:classId', async (req: Request, res: Response) => {
  try {
    const gymClass = await GymClass.findOneAndUpdate(
      { classId: req.params.classId },
      { $set: req.body },
      { new: true }
    );
    if (!gymClass) return res.status(404).json({ success: false, error: 'Class not found' });
    res.json({ success: true, data: gymClass });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update class' });
  }
});

router.delete('/:classId', async (req: Request, res: Response) => {
  try {
    await GymClass.findOneAndUpdate({ classId: req.params.classId }, { $set: { isActive: false } });
    res.json({ success: true, message: 'Class deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete class' });
  }
});

export { router as classRoutes };
