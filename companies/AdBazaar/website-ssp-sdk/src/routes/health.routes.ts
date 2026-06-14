import { Router, Request, Response } from 'express';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'website-ssp-sdk',
    timestamp: new Date().toISOString(),
  });
});

// Readiness check endpoint
router.get('/ready', (_req: Request, res: Response) => {
  // Add database and redis checks here if needed
  res.json({
    status: 'ready',
    service: 'website-ssp-sdk',
    timestamp: new Date().toISOString(),
  });
});

export default router;