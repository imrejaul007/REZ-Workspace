import { Router } from 'express';
import campaignRouter from './campaigns';
import eventRouter from './events';

const router = Router();

router.use('/', campaignRouter);
router.use('/', eventRouter);

export default router;
