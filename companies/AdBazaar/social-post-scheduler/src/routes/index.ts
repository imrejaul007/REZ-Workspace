import { Router } from 'express';
import postRoutes from './postRoutes';
import scheduleRoutes from './scheduleRoutes';
import calendarRoutes from './calendarRoutes';

const router = Router();

router.use('/posts', postRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/calendar', calendarRoutes);

export default router;