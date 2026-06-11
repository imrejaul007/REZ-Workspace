/**
 * FLEETIQ - API Routes Index
 * Central route aggregation
 */

import { Router } from 'express';
import aiRoutes from './api/ai';
import vehicleRoutes from './api/vehicles';
import driverRoutes from './api/drivers';
import tripRoutes from './api/trips';
import maintenanceRoutes from './api/maintenance';
import analyticsRoutes from './analytics';

const router = Router();

// ============================================
// MOUNT ROUTES
// ============================================

// AI Agent routes
router.use('/ai', aiRoutes);

// Vehicle routes
router.use('/vehicles', vehicleRoutes);

// Driver routes
router.use('/drivers', driverRoutes);

// Trip routes
router.use('/trips', tripRoutes);

// Maintenance routes
router.use('/maintenance', maintenanceRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

export default router;