import { Router } from 'express';
import campaignRoutes from './campaign.routes.js';
import inventoryRoutes from './inventory.routes.js';
import sponsoredRoutes from './sponsored.routes.js';
import analyticsRoutes from './analytics.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'retail-media-network-hub',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/retail-media/campaigns', campaignRoutes);
router.use('/retail-media/inventory', inventoryRoutes);
router.use('/retail-media/sponsored', sponsoredRoutes);
router.use('/retail-media/analytics', analyticsRoutes);

// Combined retail-media route for backwards compatibility
router.post('/retail-media/campaign', (req, res, next) => {
  // Forward to campaigns route
  req.url = '/retail-media/campaigns';
  campaignRoutes(req, res, next);
});

router.get('/retail-media/campaigns', (req, res, next) => {
  req.url = '/retail-media/campaigns';
  campaignRoutes(req, res, next);
});

export default router;