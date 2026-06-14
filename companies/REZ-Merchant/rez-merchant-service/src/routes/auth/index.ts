import { Router } from 'express';
import loginRouter from './login';
import coreRouter from './core';
import publicRouter from './public';

const router = Router();

router.use('/', loginRouter);
router.use('/', coreRouter);
router.use('/', publicRouter);

export default router;
