import { Router } from 'express';
import pmpRoutes from './pmpRoutes.js';
import { metricsHandler, metricsMiddleware } from '../middleware/index.js';

const router = Router();

// Apply metrics middleware to all routes
router.use(metricsMiddleware);

// Mount PMP routes
router.use('/pmp', pmpRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'pmp-invite-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint
router.get('/metrics', metricsHandler);

export default router;