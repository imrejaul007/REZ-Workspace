import { Router } from 'express';
import exitRoutes from './exitRoutes';
import offboardingRoutes from './offboardingRoutes';

const router = Router();

router.use('/exit', exitRoutes);
router.use('/offboarding', offboardingRoutes);

export default router;
