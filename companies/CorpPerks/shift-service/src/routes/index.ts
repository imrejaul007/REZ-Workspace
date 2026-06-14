import { Router } from 'express';
import templateRoutes from './templateRoutes';
import shiftRoutes from './shiftRoutes';
import swapRoutes from './swapRoutes';
import requestRoutes from './requestRoutes';

const router = Router();

// Mount routes
router.use('/templates', templateRoutes);
router.use('/schedule', shiftRoutes);
router.use('/swap', swapRoutes);
router.use('/requests', requestRoutes);

// Also mount shift routes at root for /api/shifts/:date
router.use('/', shiftRoutes);

export default router;
