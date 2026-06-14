import { Router } from 'express';
import invoiceRoutes from './invoice.js';
import ledgerRoutes from './ledger.js';
import tallyRoutes from './tally.js';

const router = Router();

router.use('/invoice', invoiceRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/tally', tallyRoutes);

export default router;
