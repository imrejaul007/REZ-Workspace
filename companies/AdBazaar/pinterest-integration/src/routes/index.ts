import { Router } from 'express';
import authRoutes from './auth.routes';
import accountsRoutes from './accounts.routes';
import boardsRoutes from './boards.routes';
import pinsRoutes from './pins.routes';
import analyticsRoutes from './analytics.routes';
import commentsRoutes from './comments.routes';

const router = Router();

// Auth routes (no auth middleware)
router.use('/auth', authRoutes);

// Protected routes
router.use('/accounts', accountsRoutes);
router.use('/boards', boardsRoutes);
router.use('/pins', pinsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/comments', commentsRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'pinterest-integration',
    timestamp: new Date().toISOString(),
  });
});

export default router;