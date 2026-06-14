import { Router } from 'express';
import configRoutes from './configRoutes.js';
import drmRoutes from './drmRoutes.js';
import streamRoutes from './streamRoutes.js';
import manifestRoutes from './manifestRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import heartbeatRoutes from './heartbeatRoutes.js';

const router = Router();

// Mount routes
router.use('/config', configRoutes);
router.use('/drm', drmRoutes);
router.use('/stream', streamRoutes);
router.use('/manifest', manifestRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/heartbeat', heartbeatRoutes);

export default router;
