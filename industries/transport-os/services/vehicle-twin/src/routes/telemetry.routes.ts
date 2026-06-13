import { Router } from 'express';
import { vehicleController } from '../controllers/vehicle.controller';

const router = Router();

// Process telemetry update
router.post('/:vehicleId', vehicleController.processTelemetryUpdate);

// Get telemetry statistics
router.get('/:vehicleId/stats', vehicleController.getTelemetryStats);

// Clear alerts
router.delete('/:vehicleId/alerts', vehicleController.clearAlerts);

// Record service
router.post('/:vehicleId/service', vehicleController.recordService);

export default router;