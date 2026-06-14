import { Router } from 'express';
import apartmentRoutes from './apartment.routes.js';
import healthRoutes from './health.routes.js';
import targetingRoutes from './targeting.routes.js';

const router = Router();

// API routes
router.use('/api/apartments', apartmentRoutes);
router.use('/api/targeting', targetingRoutes);

// Health and metrics routes (no /api prefix)
router.use('/', healthRoutes);

export default router;