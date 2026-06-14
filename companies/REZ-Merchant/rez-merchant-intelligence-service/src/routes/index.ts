import { Router, Request, Response } from 'express';
import merchantIntelligenceRoutes from './merchantIntelligenceRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'merchant-intelligence-service',
      timestamp: new Date().toISOString(),
    },
  });
});

// Mount merchant intelligence routes
router.use('/merchant', merchantIntelligenceRoutes);

export default router;
