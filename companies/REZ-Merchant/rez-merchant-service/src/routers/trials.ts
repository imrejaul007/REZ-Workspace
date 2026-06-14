/**
 * Trials domain router.
 */
import { Router } from 'express';
import trialsRoutes from '../routes/trials';

const router = Router();

router.use('/trials', trialsRoutes);

export default router;
