import { Router } from 'express';
import statusRouter from './status';
import inventoryRouter from './inventory';
import loyaltyRouter from './loyalty';
import customerRouter from './customer';
import aiBrainRouter from './ai-brain';

const router = Router();

router.use('/', statusRouter);
router.use('/inventory', inventoryRouter);
router.use('/loyalty', loyaltyRouter);
router.use('/customer', customerRouter);
router.use('/brain', aiBrainRouter);

export default router;
