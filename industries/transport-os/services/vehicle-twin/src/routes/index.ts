import { Router, Request, Response } from 'express';
import vehicleRoutes from './vehicle.routes';
import telemetryRoutes from './telemetry.routes';
import { vehicleController } from '../controllers/vehicle.controller';

const router = Router();

// Mount routes
router.use('/vehicles', vehicleRoutes);
router.use('/telemetry', telemetryRoutes);

// Low levels endpoint (telemetry related)
router.get('/telemetry/low-levels', vehicleController.getVehiclesWithLowLevels);

// Diagnostic issues endpoint
router.get('/telemetry/issues', vehicleController.getVehiclesWithDiagnosticIssues);

// Health check endpoint (for monitoring)
router.get('/health/vehicle-stats', vehicleController.getVehicleStatistics);

export default router;