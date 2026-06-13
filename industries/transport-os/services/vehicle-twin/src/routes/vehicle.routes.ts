import { Router } from 'express';
import { vehicleController } from '../controllers/vehicle.controller';

const router = Router();

// ==================== VEHICLE ROUTES ====================

// Create vehicle
router.post('/', vehicleController.createVehicle);

// Get all vehicles with filters
router.get('/', vehicleController.getVehicles);

// Get vehicle statistics
router.get('/statistics', vehicleController.getVehicleStatistics);

// Get vehicles needing maintenance
router.get('/maintenance/due', vehicleController.getVehiclesNeedingMaintenance);

// Get nearby vehicles
router.get('/nearby', vehicleController.getNearbyVehicles);

// Get vehicle by ID
router.get('/:vehicleId', vehicleController.getVehicle);

// Get vehicle by VIN
router.get('/vin/:vin', vehicleController.getVehicleByVin);

// Get vehicle by license plate
router.get('/plate/:licensePlate', vehicleController.getVehicleByLicensePlate);

// Get vehicles by fleet
router.get('/fleet/:fleetId', vehicleController.getVehiclesByFleet);

// Get vehicles by owner
router.get('/owner/:ownerId', vehicleController.getVehiclesByOwner);

// Update vehicle status
router.patch('/:vehicleId/status', vehicleController.updateVehicleStatus);

// Update vehicle telemetry
router.patch('/:vehicleId/telemetry', vehicleController.updateVehicleTelemetry);

// Update vehicle location
router.patch('/:vehicleId/location', vehicleController.updateVehicleLocation);

// Update vehicle utilization
router.patch('/:vehicleId/utilization', vehicleController.updateVehicleUtilization);

// Update vehicle cleanliness
router.patch('/:vehicleId/cleanliness', vehicleController.updateVehicleCleanliness);

// Update vehicle maintenance
router.patch('/:vehicleId/maintenance', vehicleController.updateVehicleMaintenance);

// Delete vehicle
router.delete('/:vehicleId', vehicleController.deleteVehicle);

export default router;