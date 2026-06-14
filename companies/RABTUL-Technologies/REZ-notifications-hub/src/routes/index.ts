import { Router } from 'express';
import notificationRoutes from './notification.routes';
import templateRoutes from './template.routes';
import preferencesRoutes from './preferences.routes';
import optoutRoutes from './optout.routes';
import analyticsRoutes from './analytics.routes';
import gdprRoutes from './gdpr.routes';
import { config } from '../config';

const router = Router();

const API_PREFIX = `/${config.server.apiVersion}`;

// Mount routes
router.use(`${API_PREFIX}/notifications`, notificationRoutes);
router.use(`${API_PREFIX}/templates`, templateRoutes);
router.use(`${API_PREFIX}/preferences`, preferencesRoutes);
router.use(`${API_PREFIX}/opt-out`, optoutRoutes);
router.use(`${API_PREFIX}/analytics`, analyticsRoutes);
router.use(`${API_PREFIX}`, gdprRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: config.server.apiVersion,
  });
});

export default router;
