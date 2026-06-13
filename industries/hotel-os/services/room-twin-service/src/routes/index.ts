import { Router, Request, Response } from 'express';
import twinRoutes from './twin.routes';
import guestRoutes from './guest.routes';
import propertyRoutes from './property.routes';
import { logger } from '../utils/logger';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'room-twin-service',
    timestamp: new Date().toISOString()
  });
});

// Mount twin routes
router.use('/twins', twinRoutes);
router.use('/twins', guestRoutes);
router.use('/twins', propertyRoutes);

// 404 handler
router.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

export default router;
