import { Request, Response } from 'express';
import { vehicleService } from '../services/vehicle.service';
import { telemetryService } from '../services/telemetry.service';
import { logger } from '../utils/logger';
import {
  CreateVehicleSchema,
  UpdateVehicleStatusSchema,
  UpdateVehicleTelemetrySchema,
  LocationUpdateSchema,
  TelemetryUpdateSchema,
  UpdateMaintenanceSchema,
  UpdateUtilizationSchema,
  UpdateCleanlinessSchema,
  VehicleQuerySchema
} from '../schemas/vehicle.schemas';
import { ZodError } from 'zod';

type AsyncRequestHandler = (req: Request, res: Response) => Promise<void>;

const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: (error: unknown) => void) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};

export const vehicleController = {
  /**
   * Create a new vehicle
   * POST /api/vehicles
   */
  createVehicle: asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = CreateVehicleSchema.parse(req.body);
      const vehicle = await vehicleService.createVehicle(data);

      res.status(201).json({
        success: true,
        data: vehicle,
        message: 'Vehicle created successfully'
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors
          }
        });
        return;
      }
      throw error;
    }
  }),

  /**
   * Get all vehicles with optional filters
   * GET /api/vehicles
   */
  getVehicles: asyncHandler(async (req: Request, res: Response) => {
    const queryParams = VehicleQuerySchema.parse({
      ...req.query,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      skip: req.query.skip ? parseInt(req.query.skip as string, 10) : 0
    });

    const result = await vehicleService.queryVehicles(queryParams);

    res.json({
      success: true,
      data: result.vehicles,
      pagination: {
        total: result.total,
        limit: queryParams.limit,
        skip: queryParams.skip,
        hasMore: queryParams.skip + result.vehicles.length < result.total
      }
    });
  }),

  /**
   * Get vehicle by ID
   * GET /api/vehicles/:vehicleId
   */
  getVehicle: asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const vehicle = await vehicleService.getVehicle(vehicleId);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        error: {
          code: 'VEHICLE_NOT_FOUND',
          message: 'Vehicle not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: vehicle
    });
  }),

  /**
   * Get vehicle by VIN
   * GET /api/vehicles/vin/:vin
   */
  getVehicleByVin: asyncHandler(async (req: Request, res: Response) => {
    const { vin } = req.params;
    const vehicle = await vehicleService.getVehicleByVin(vin);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        error: {
          code: 'VEHICLE_NOT_FOUND',
          message: 'Vehicle not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: vehicle
    });
  }),

  /**
   * Get vehicle by license plate
   * GET /api/vehicles/plate/:licensePlate
   */
  getVehicleByLicensePlate: asyncHandler(async (req: Request, res: Response) => {
    const { licensePlate } = req.params;
    const vehicle = await vehicleService.getVehicleByLicensePlate(licensePlate);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        error: {
          code: 'VEHICLE_NOT_FOUND',
          message: 'Vehicle not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: vehicle
    });
  }),

  /**
   * Update vehicle status
   * PATCH /api/vehicles/:vehicleId/status
   */
  updateVehicleStatus: asyncHandler(async (req: Request, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const data = UpdateVehicleStatusSchema.parse(req.body);

      const vehicle = await vehicleService.updateVehicleStatus(vehicleId, data);

      if (!vehicle) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found'
          }
        });
        return;
      }

      logger.info(`Vehicle status updated: ${vehicleId}`);

      res.json({
        success: true,
        data: vehicle,
        message: 'Vehicle status updated successfully'
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors
          }
        });
        return;
      }
      throw error;
    }
  }),

  /**
   * Update vehicle telemetry
   * PATCH /api/vehicles/:vehicleId/telemetry
   */
  updateVehicleTelemetry: asyncHandler(async (req: Request, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const data = UpdateVehicleTelemetrySchema.parse(req.body);

      const vehicle = await vehicleService.updateVehicleTelemetry(vehicleId, data);

      if (!vehicle) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: vehicle,
        message: 'Vehicle telemetry updated successfully'
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors
          }
        });
        return;
      }
      throw error;
    }
  }),

  /**
   * Update vehicle location
   * PATCH /api/vehicles/:vehicleId/location
   */
  updateVehicleLocation: asyncHandler(async (req: Request, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const data = LocationUpdateSchema.parse(req.body);

      const vehicle = await vehicleService.updateVehicleLocation(
        vehicleId,
        data.lat,
        data.lng,
        data.heading,
        data.speed,
        data.address
      );

      if (!vehicle) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: vehicle,
        message: 'Vehicle location updated successfully'
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors
          }
        });
        return;
      }
      throw error;
    }
  }),

  /**
   * Update vehicle utilization
   * PATCH /api/vehicles/:vehicleId/utilization
   */
  updateVehicleUtilization: asyncHandler(async (req: Request, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const data = UpdateUtilizationSchema.parse(req.body);

      const vehicle = await vehicleService.updateVehicleUtilization(vehicleId, data);

      if (!vehicle) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: vehicle,
        message: 'Vehicle utilization updated successfully'
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors
          }
        });
        return;
      }
      throw error;
    }
  }),

  /**
   * Update vehicle cleanliness
   * PATCH /api/vehicles/:vehicleId/cleanliness
   */
  updateVehicleCleanliness: asyncHandler(async (req: Request, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const data = UpdateCleanlinessSchema.parse(req.body);

      const vehicle = await vehicleService.updateVehicleCleanliness(vehicleId, data);

      if (!vehicle) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: vehicle,
        message: 'Vehicle cleanliness updated successfully'
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors
          }
        });
        return;
      }
      throw error;
    }
  }),

  /**
   * Update vehicle maintenance
   * PATCH /api/vehicles/:vehicleId/maintenance
   */
  updateVehicleMaintenance: asyncHandler(async (req: Request, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const data = UpdateMaintenanceSchema.parse(req.body);

      const vehicle = await vehicleService.updateVehicleMaintenance(vehicleId, data);

      if (!vehicle) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: vehicle,
        message: 'Vehicle maintenance updated successfully'
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors
          }
        });
        return;
      }
      throw error;
    }
  }),

  /**
   * Get vehicles by fleet
   * GET /api/vehicles/fleet/:fleetId
   */
  getVehiclesByFleet: asyncHandler(async (req: Request, res: Response) => {
    const { fleetId } = req.params;
    const vehicles = await vehicleService.getVehiclesByFleet(fleetId);

    res.json({
      success: true,
      data: vehicles,
      total: vehicles.length
    });
  }),

  /**
   * Get vehicles by owner
   * GET /api/vehicles/owner/:ownerId
   */
  getVehiclesByOwner: asyncHandler(async (req: Request, res: Response) => {
    const { ownerId } = req.params;
    const vehicles = await vehicleService.getVehiclesByOwner(ownerId);

    res.json({
      success: true,
      data: vehicles,
      total: vehicles.length
    });
  }),

  /**
   * Get available vehicles near a location
   * GET /api/vehicles/nearby
   */
  getNearbyVehicles: asyncHandler(async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 5;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COORDINATES',
          message: 'lat and lng query parameters are required'
        }
      });
      return;
    }

    const nearbyVehicles = await vehicleService.getAvailableVehiclesNear(lat, lng, radiusKm, limit);

    res.json({
      success: true,
      data: nearbyVehicles
    });
  }),

  /**
   * Get vehicle statistics
   * GET /api/vehicles/statistics
   */
  getVehicleStatistics: asyncHandler(async (req: Request, res: Response) => {
    const stats = await vehicleService.getVehicleStatistics();

    res.json({
      success: true,
      data: stats
    });
  }),

  /**
   * Get vehicles needing maintenance
   * GET /api/vehicles/maintenance/due
   */
  getVehiclesNeedingMaintenance: asyncHandler(async (req: Request, res: Response) => {
    const vehicles = await vehicleService.getVehiclesNeedingMaintenance();

    res.json({
      success: true,
      data: vehicles,
      total: vehicles.length
    });
  }),

  /**
   * Delete vehicle (soft delete)
   * DELETE /api/vehicles/:vehicleId
   */
  deleteVehicle: asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const deleted = await vehicleService.deleteVehicle(vehicleId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'VEHICLE_NOT_FOUND',
          message: 'Vehicle not found'
        }
      });
      return;
    }

    logger.info(`Vehicle deleted: ${vehicleId}`);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  }),

  // Telemetry endpoints
  /**
   * Process telemetry update
   * POST /api/telemetry/:vehicleId
   */
  processTelemetryUpdate: asyncHandler(async (req: Request, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const update = TelemetryUpdateSchema.parse(req.body);

      const vehicle = await telemetryService.processTelemetryUpdate(vehicleId, update);

      if (!vehicle) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: vehicle,
        message: 'Telemetry update processed successfully'
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors
          }
        });
        return;
      }
      throw error;
    }
  }),

  /**
   * Get telemetry statistics for a vehicle
   * GET /api/telemetry/:vehicleId/stats
   */
  getTelemetryStats: asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const stats = await telemetryService.getTelemetryStats(vehicleId);

    if (!stats) {
      res.status(404).json({
        success: false,
        error: {
          code: 'VEHICLE_NOT_FOUND',
          message: 'Vehicle not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: stats
    });
  }),

  /**
   * Get vehicles with low fuel/battery
   * GET /api/telemetry/low-levels
   */
  getVehiclesWithLowLevels: asyncHandler(async (req: Request, res: Response) => {
    const threshold = req.query.threshold
      ? parseInt(req.query.threshold as string, 10)
      : 20;

    const vehicles = await telemetryService.getVehiclesWithLowLevels(threshold);

    res.json({
      success: true,
      data: vehicles,
      total: vehicles.length
    });
  }),

  /**
   * Get vehicles with diagnostic issues
   * GET /api/telemetry/issues
   */
  getVehiclesWithDiagnosticIssues: asyncHandler(async (req: Request, res: Response) => {
    const vehicles = await telemetryService.getVehiclesWithDiagnosticIssues();

    res.json({
      success: true,
      data: vehicles,
      total: vehicles.length
    });
  }),

  /**
   * Clear maintenance alerts for a vehicle
   * DELETE /api/telemetry/:vehicleId/alerts
   */
  clearAlerts: asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const vehicle = await telemetryService.clearAlerts(vehicleId);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        error: {
          code: 'VEHICLE_NOT_FOUND',
          message: 'Vehicle not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: vehicle,
      message: 'Alerts cleared successfully'
    });
  }),

  /**
   * Record service for a vehicle
   * POST /api/telemetry/:vehicleId/service
   */
  recordService: asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const { serviceDate, serviceKm, notes } = req.body;

    const vehicle = await telemetryService.recordService(
      vehicleId,
      new Date(serviceDate),
      serviceKm,
      notes
    );

    if (!vehicle) {
      res.status(404).json({
        success: false,
        error: {
          code: 'VEHICLE_NOT_FOUND',
          message: 'Vehicle not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: vehicle,
      message: 'Service recorded successfully'
    });
  })
};
