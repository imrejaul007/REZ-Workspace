import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-salon-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /api/health/ready
 * Readiness probe for Kubernetes
 */
router.get('/ready', (_req: Request, res: Response) => {
  res.json({
    status: 'ready',
    service: 'rez-salon-service',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/health/live
 * Liveness probe for Kubernetes
 */
router.get('/live', (_req: Request, res: Response) => {
  res.json({
    status: 'alive',
    service: 'rez-salon-service',
    timestamp: new Date().toISOString(),
  });
});

export const healthRoutes = router;
