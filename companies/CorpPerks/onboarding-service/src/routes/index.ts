import { Router } from 'express';
import templateRoutes from './templateRoutes';
import onboardingRoutes from './onboardingRoutes';

const router = Router();

router.use('/templates', templateRoutes);
router.use('/onboarding', onboardingRoutes);

export default router;
