import { Router, Request, Response } from 'express';
import { ScheduleModel } from '../models/Schedule';

const router = Router();

router.get('/schedules', async (req: Request, res: Response) => {
  try {
    const doctorId = req.query.doctorId as string;
    const query: Record<string, unknown> = { isActive: true };
    if (doctorId) query.doctorId = doctorId;
    const schedules = await ScheduleModel.find(query).sort({ dayOfWeek: 1 });
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/schedules', async (req: Request, res: Response) => {
  try {
    const schedule = new ScheduleModel(req.body);
    await schedule.save();
    res.status(201).json({ success: true, data: schedule, message: 'Schedule created' });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
