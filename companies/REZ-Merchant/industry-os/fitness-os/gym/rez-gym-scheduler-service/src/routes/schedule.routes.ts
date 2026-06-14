import { Router, Request, Response } from 'express';
import { Schedule } from '../models/Schedule';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { gymId, date, trainerId, classId } = req.query;
    const query: Record<string, unknown> = { isActive: true };
    if (gymId) query.gymId = gymId;
    if (date) query.date = date;
    if (trainerId) query.trainerId = trainerId;
    if (classId) query.classId = classId;

    const schedules = await Schedule.find(query).sort({ date: 1, startTime: 1 });
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch schedules' });
  }
});

router.get('/:scheduleId', async (req: Request, res: Response) => {
  try {
    const schedule = await Schedule.findOne({ scheduleId: req.params.scheduleId });
    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch schedule' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const scheduleId = `SCH${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const schedule = new Schedule({ ...req.body, scheduleId });
    await schedule.save();
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create schedule' });
  }
});

router.post('/:scheduleId/book', async (req: Request, res: Response) => {
  try {
    const schedule = await Schedule.findOneAndUpdate(
      { scheduleId: req.params.scheduleId, isActive: true, isCancelled: false, currentBookings: { $lt: '$maxCapacity' } },
      { $inc: { currentBookings: 1 } },
      { new: true }
    );
    if (!schedule) return res.status(400).json({ success: false, error: 'Cannot book - class full or not available' });
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to book' });
  }
});

router.post('/:scheduleId/cancel', async (req: Request, res: Response) => {
  try {
    const schedule = await Schedule.findOneAndUpdate(
      { scheduleId: req.params.scheduleId },
      { $set: { isCancelled: true } },
      { new: true }
    );
    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel' });
  }
});

export { router as scheduleRoutes };
