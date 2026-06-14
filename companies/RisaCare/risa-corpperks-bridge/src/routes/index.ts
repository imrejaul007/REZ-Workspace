import { Router } from 'express';
import employeeRoutes from './employeeRoutes';
import benefitRoutes from './benefitRoutes';
import wellnessRoutes from './wellnessRoutes';

const router = Router();

router.use('/', employeeRoutes);
router.use('/', benefitRoutes);
router.use('/', wellnessRoutes);

export default router;
