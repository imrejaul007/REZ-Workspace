import { Router } from 'express';
import triggerRoutes from './triggerRoutes';

const router = Router();

router.use('/triggers', triggerRoutes);

export default router;