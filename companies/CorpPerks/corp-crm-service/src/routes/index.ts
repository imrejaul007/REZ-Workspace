import { Router } from 'express';
import clientRoutes from './clientRoutes.js';
import dealRoutes from './dealRoutes.js';
import proposalRoutes from './proposalRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';

const router = Router();

router.use('/clients', clientRoutes);
router.use('/deals', dealRoutes);
router.use('/proposals', proposalRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
