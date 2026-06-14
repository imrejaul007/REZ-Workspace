import { Router } from 'express';

const router = Router();

// List recurring schedules
router.get('/', (req, res) => {
  res.json({ success: true, data: [] });
});

// Create recurring schedule
router.post('/', (req, res) => {
  res.status(201).json({ success: true, data: { id: 'schedule-1' } });
});

export { router as scheduleRoutes };
