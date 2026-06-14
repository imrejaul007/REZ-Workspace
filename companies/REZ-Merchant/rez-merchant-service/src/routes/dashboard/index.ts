import { Router } from 'express';
import overviewRouter from './overview';
import productsRouter from './products';
import customersRouter from './customers';
import campaignsRouter from './campaigns';

const router = Router();

router.use('/', overviewRouter);
router.use('/', productsRouter);
router.use('/', customersRouter);
router.use('/', campaignsRouter);

export default router;
