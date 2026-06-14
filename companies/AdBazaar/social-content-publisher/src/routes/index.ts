import { Router } from 'express';
import postRoutes from './post.routes';
import queueRoutes from './queue.routes';
import calendarRoutes from './calendar.routes';
import platformRoutes from './platform.routes';

const router = Router();

router.use('/posts', postRoutes);
router.use('/queue', queueRoutes);
router.use('/calendar', calendarRoutes);
router.use('/platforms', platformRoutes);

export default router;