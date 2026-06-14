/**
 * Loyalty config domain router.
 */
import { Router } from 'express';
import loyaltyConfigRoutes from '../routes/loyaltyConfig';

const router = Router();

router.use('/loyalty-config', loyaltyConfigRoutes);

export default router;
