import { Router } from 'express';
import listRouter from './list';
import bulkRouter from './bulk';
import statusRouter from './status';
import refundRouter from './refund';
import detailRouter from './detail';

const router = Router();
router.use(listRouter);
router.use(bulkRouter);
router.use(statusRouter);
router.use(refundRouter);
router.use(detailRouter);

export default router;
