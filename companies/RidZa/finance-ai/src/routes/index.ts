import { Router } from 'express';
import transactionRoutes from './transaction.js';
import analysisRoutes from './analysis.js';

const router = Router();

router.use('/transaction', transactionRoutes);
router.use('/analysis', analysisRoutes);

export default router;
