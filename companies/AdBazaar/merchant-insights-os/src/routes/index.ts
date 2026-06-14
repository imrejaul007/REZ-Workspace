import { Router } from 'express';
import insightsRouter from './insights.js';
import merchantsRouter from './merchants.js';
import dataRouter from './data.js';

const router = Router();

// Mount routes
router.use('/merchant', insightsRouter);
router.use('/merchants', merchantsRouter);
router.use('/data', dataRouter);

export default router;
