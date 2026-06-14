import { Router } from 'express';
import subscriptionsRouter from './subscriptions';
import usageRouter from './usage';
import invoicesRouter from './invoices';
import webhooksRouter from './webhooks';
import plansRouter from './plans';
import analyticsRouter from './analytics';

const router = Router();

// Mount routes
router.use('/subscriptions', subscriptionsRouter);
router.use('/usage', usageRouter);
router.use('/invoices', invoicesRouter);
router.use('/webhooks', webhooksRouter);
router.use('/plans', plansRouter);
router.use('/analytics', analyticsRouter);

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-subscription-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'REZ Subscription Service',
    version: '1.0.0',
    description: 'Subscription and Recurring Billing Service',
    endpoints: {
      subscriptions: '/api/v1/subscriptions',
      usage: '/api/v1/usage',
      invoices: '/api/v1/invoices',
      webhooks: '/api/v1/webhooks',
      plans: '/api/v1/plans',
      analytics: '/api/v1/analytics',
      health: '/api/v1/health'
    }
  });
});

export default router;
