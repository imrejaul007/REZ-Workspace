/**
 * Routes Index
 * Export all route modules
 */

import { Router } from 'express';
import feedRoutes from './feedRoutes';
import campaignRoutes from './campaignRoutes';
import renderRoutes from './renderRoutes';

const router = Router();

// DPA Feed routes
router.use('/', feedRoutes);

// DPA Campaign routes
router.use('/', campaignRoutes);

// DPA Render routes
router.use('/', renderRoutes);

// Health check (also at root)
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'dynamic-product-ad-engine',
    timestamp: new Date().toISOString(),
  });
});

export default router;