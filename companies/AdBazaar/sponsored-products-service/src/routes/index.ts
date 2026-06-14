import { Router } from 'express';
import sponsoredProductsRouter from './sponsoredProducts';

const router = Router();

// Mount routes
router.use('/sponsored', sponsoredProductsRouter);

export default router;