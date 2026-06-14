import { Router } from 'express';
import mobileRoutes from './mobileRoutes.js';
import healthRoutes from './healthRoutes.js';

const router = Router();

// Mobile SDK routes
router.use('/api/mobile', mobileRoutes);

// Health routes
router.use('/health', healthRoutes);

export { router as routes };