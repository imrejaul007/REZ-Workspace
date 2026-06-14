import { Router } from 'express';
import creatorRoutes from './creator.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import analyticsRoutes from './analytics.routes';
import payoutRoutes from './payout.routes';

const router = Router();

// Mount routes
router.use('/creators', creatorRoutes);
router.use('/', productRoutes);
router.use('/', orderRoutes);
router.use('/', analyticsRoutes);
router.use('/', payoutRoutes);

export default router;