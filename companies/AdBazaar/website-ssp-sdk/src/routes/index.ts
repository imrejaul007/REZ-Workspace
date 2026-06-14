import { Router, Request, Response } from 'express';
import sdkRoutes from './sdk.routes.js';
import healthRoutes from './health.routes.js';
import { getMetrics, getContentType } from '../middleware/metrics.middleware.js';

const router = Router();

// Mount routes
router.use('/api/sdk', sdkRoutes);
router.use('/', healthRoutes);

// Metrics endpoint for Prometheus
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', getContentType());
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error collecting metrics');
  }
});

export default router;