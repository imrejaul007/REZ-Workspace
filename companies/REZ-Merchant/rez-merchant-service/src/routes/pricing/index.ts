import { Router } from 'express';
import recommendationsRouter from './recommendations';

const router = Router();
router.use(recommendationsRouter);

export default router;
