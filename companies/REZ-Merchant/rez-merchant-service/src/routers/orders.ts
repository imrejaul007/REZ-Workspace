/**
 * Orders & Fulfillment domain router.
 */
import { Router } from 'express';
import orderRoutes from '../routes/orders';
import webOrderRoutes from '../routes/webOrders';
import posRoutes from '../routes/pos';
import tableManagementRoutes from '../routes/tableManagement';
import postPurchaseRoutes from '../routes/postPurchase';

const router = Router();

router.use('/orders', orderRoutes);
router.use('/web-orders', webOrderRoutes);
router.use('/pos', posRoutes);
router.use('/table-management', tableManagementRoutes);
router.use('/post-purchase', postPurchaseRoutes);

export default router;
