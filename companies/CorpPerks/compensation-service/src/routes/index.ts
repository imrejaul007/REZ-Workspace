import { Router } from 'express';
import salaryBandRoutes from './salaryBandRoutes.js';
import compensationRoutes from './compensationRoutes.js';
import incrementRoutes from './incrementRoutes.js';
import promotionRoutes from './promotionRoutes.js';
import bonusRoutes from './bonusRoutes.js';

const router = Router();

// Mount routes
router.use('/bands', salaryBandRoutes);
router.use('/compensation', compensationRoutes);
router.use('/increments', incrementRoutes);
router.use('/promotions', promotionRoutes);
router.use('/bonus', bonusRoutes);

export default router;
