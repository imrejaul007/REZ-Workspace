import { Router } from 'express';
import sequenceRoutes from './sequenceRoutes';
import enrollmentRoutes from './enrollmentRoutes';

const router = Router();

router.use('/sequences', sequenceRoutes);
router.use('/enrollments', enrollmentRoutes);

export default router;