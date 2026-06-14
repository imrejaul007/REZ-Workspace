import { Router } from 'express';
import twinRoutes from './twin.routes';

const router = Router();

// Mount twin routes
router.use('/twin', twinRoutes);

export default router;