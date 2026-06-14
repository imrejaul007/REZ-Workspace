import { Router } from 'express';
import campaignRoutes from './campaign.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'goal-driven-campaign-agent',
    timestamp: new Date().toISOString()
  });
});

// Agent routes
router.use('/agent', campaignRoutes);

export default router;