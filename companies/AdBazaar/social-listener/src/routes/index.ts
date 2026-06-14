import { Router } from 'express';
import listenRoutes from './listenRoutes';
import mentionRoutes from './mentionRoutes';
import sentimentRoutes from './sentimentRoutes';

const router = Router();

router.use('/listen', listenRoutes);
router.use('/mentions', mentionRoutes);
router.use('/sentiment', sentimentRoutes);

export default router;