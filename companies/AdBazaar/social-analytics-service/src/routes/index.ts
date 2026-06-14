import { Router } from 'express';
import analyticsRoutes from './analyticsRoutes';
import dashboardRoutes from './dashboardRoutes';

const router = Router();

router.use('/analytics', analyticsRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;