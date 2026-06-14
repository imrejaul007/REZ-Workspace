import { Router } from 'express';
import campaignRoutes from './campaign.routes';
import healthRoutes from './health.routes';

const router = Router();

// Mount routes
router.use('/api/nl', campaignRoutes);
router.use('/', healthRoutes);

export default router;