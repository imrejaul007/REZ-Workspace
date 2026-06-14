import { Router } from 'express';
import streamRoutes from './stream.js';
import cueRoutes from './cue.js';
import healthRoutes from './health.js';

const router = Router();

router.use('/stream', streamRoutes);
router.use('/cue', cueRoutes);
router.use('/health', healthRoutes);

export default router;