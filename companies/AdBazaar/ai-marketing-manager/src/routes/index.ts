import { Router, Request, Response } from 'express';
import aiMarketingManagerRoutes from './ai-marketing-manager.routes';

const router = Router();

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ai-marketing-manager',
    version: '1.0.0',
 });
});

// AI Marketing Manager routes
router.use('/ai', aiMarketingManagerRoutes);

export default router;