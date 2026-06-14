import { Router } from 'express';
import checkRoutes from './checkRoutes';
import reportRoutes from './reportRoutes';
import influencerRoutes from './influencerRoutes';
import alertRoutes from './alertRoutes';
import analyticsRoutes from './analyticsRoutes';

const router = Router();

// Mount routes
router.use('/check', checkRoutes);
router.use('/report', reportRoutes);
router.use('/influencers', influencerRoutes);
router.use('/alerts', alertRoutes);
router.use('/analytics', analyticsRoutes);

export default router;