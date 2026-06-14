import { Router } from 'express';
import ugcRoutes from './ugcRoutes';
import campaignRoutes from './campaignRoutes';

const router = Router();

router.use('/ugc', ugcRoutes);
router.use('/ugc/campaigns', campaignRoutes);

export default router;