import { Router } from 'express';
import verifyRouter from './verify';
import redeemRouter from './redeem';
import listRouter from './list';
import statsRouter from './stats';

const router = Router();

router.use('/', verifyRouter);
router.use('/', redeemRouter);
router.use('/', listRouter);
router.use('/', statsRouter);

export default router;
