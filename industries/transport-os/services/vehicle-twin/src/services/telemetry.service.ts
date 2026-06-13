import { Vehicle, VehicleDocument } from '../models/vehicle';
import { messageBroker } from '../utils/message-broker';
import { logger, logTelemetryEvent } from '../utils/logger';
import { TelemetryUpdate } from '../types';

export interface TelemetryBatch {
  vehicleId: string;
  updates: TelemetryUpdate[];
  timestamp: Date;
}

export interface TelemetryStats {
  vehicleId: string;
  totalUpdates: number;
  lastUpdate: Date;
  avgFuelLevel: number | null;
  avgBatteryLevel: number | null;
  totalDistanceKm: number;
  totalEngineHours: number;
}

class TelemetryService {
  private telemetryBuffer: Map<string, TelemetryUpdate[]> = new Map();
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 60000; // 1 minute

  constructor() {
    // Start periodic flush
    setInterval(() => this.flushBuffer(), this.FLUSH_INTERVAL);
  }

  /**
   * Process incoming telemetry update
   */
  async processTelemetryUpdate(
    vehicleId: string,
    update: TelemetryUpdate
  ): Promise<VehicleDocument | null> {
    const vehicle = await Vehicle.findOne({ vehicleId, isActive: true });
    if (!vehicle) {
      logger.warn(`Telemetry update for unknown vehicle: ${vehicleId}`);
      return null;
    }

    // Apply updates
    if (update.fuelLevel !== undefined) {
      vehicle.telemetry.fuelLevel = update.fuelLevel;
    }
    if (update.batteryLevel !== undefined) {
      vehicle.telemetry.batteryLevel = update.batteryLevel;
    }
    if (update.odometer !== undefined) {
      vehicle.telemetry.odometer = update.odometer;
    }
    if (update.engineHours !== undefined) {
      vehicle.telemetry.engineHours = update.engineHours;
    }
    if (update.tirePressure !== undefined) {
      vehicle.telemetry.diagnostics.tirePressure = update.tirePressure;
    }
    if (update.oilLevel !== undefined) {
      vehicle.telemetry.diagnostics.oilLevel = update.oilLevel;
    }
    if (update.coolantTemp !== undefined) {
      vehicle.telemetry.diagnostics.coolantTemp = update.coolantTemp;
    }
    if (update.errorCodes !== undefined) {
      vehicle.telemetry.diagnostics.errorCodes = update.errorCodes;
    }

    // Check for critical conditions
    this.checkCriticalConditions(vehicle, update);

    await vehicle.save();

    // Log telemetry event
    logTelemetryEvent(vehicleId, 'telemetry_update', {
      fuelLevel: update.fuelLevel,
      batteryLevel: update.batteryLevel,
      odometer: update.odometer
    });

    // Publish telemetry event
    await this.publishTelemetryEvent(vehicleId, update);

    return vehicle;
  }

  /**
   * Process batch telemetry updates
   */
  async processBatchTelemetry(batch: TelemetryBatch): Promise<void> {
    for (const update of batch.updates) {
      await this.processTelemetryUpdate(batch.vehicleId, update);
    }
  }

  /**
   * Buffer telemetry for batch processing
   */
  bufferTelemetry(vehicleId: string, update: TelemetryUpdate): void {
    const existing = this.telemetryBuffer.get(vehicleId) || [];
    existing.push(update);

    // Keep buffer size limited
    if (existing.length > this.BUFFER_SIZE) {
      existing.shift();
    }

    this.telemetryBuffer.set(vehicleId, existing);
  }

  /**
   * Flush buffered telemetry
   */
  async flushBuffer(): Promise<void> {
    for (const [vehicleId, updates] of this.telemetryBuffer.entries()) {
      if (updates.length === 0) continue;

      // Process the latest update
      const latestUpdate = updates[updates.length - 1];
      await this.processTelemetryUpdate(vehicleId, latestUpdate);

      // Clear buffer
      this.telemetryBuffer.set(vehicleId, []);
    }

    if (this.telemetryBuffer.size > 0) {
      logger.debug(`Flushed telemetry buffer for ${this.telemetryBuffer.size} vehicles`);
    }
  }

  /**
   * Get telemetry statistics for a vehicle
   */
  async getTelemetryStats(vehicleId: string): Promise<TelemetryStats | null> {
    const vehicle = await Vehicle.findOne({ vehicleId, isActive: true });
    if (!vehicle) return null;

    return {
      vehicleId,
      totalUpdates: 0, // Would need to track this separately if needed
      lastUpdate: vehicle.status.location.updatedAt,
      avgFuelLevel: vehicle.telemetry.fuelLevel,
      avgBatteryLevel: vehicle.telemetry.batteryLevel,
      totalDistanceKm: vehicle.telemetry.odometer,
      totalEngineHours: vehicle.telemetry.engineHours
    };
  }

  /**
   * Get vehicles with low fuel/battery
   */
  async getVehiclesWithLowLevels(threshold: number = 20): Promise<VehicleDocument[]> {
    return Vehicle.find({
      isActive: true,
      $or: [
        { 'telemetry.fuelLevel': { $lte: threshold, $ne: null } },
        { 'telemetry.batteryLevel': { $lte: threshold, $ne: null } }
      ]
    }).sort({ 'telemetry.fuelLevel': 1 });
  }

  /**
   * Get vehicles with diagnostic issues
   */
  async getVehiclesWithDiagnosticIssues(): Promise<VehicleDocument[]> {
    return Vehicle.find({
      isActive: true,
      $or: [
        { 'telemetry.diagnostics.engineStatus': { $ne: 'ok' } },
        { 'telemetry.diagnostics.brakeStatus': { $ne: 'ok' } },
        { 'telemetry.diagnostics.errorCodes.0': { $exists: true } }
      ]
    }).sort({ 'telemetry.diagnostics.engineStatus': 1 });
  }

  /**
   * Check for critical conditions and add alerts
   */
  private checkCriticalConditions(
    vehicle: VehicleDocument,
    update: TelemetryUpdate
  ): void {
    // Low fuel warning
    if (update.fuelLevel !== undefined && update.fuelLevel <= 10 && update.fuelLevel > 0) {
      vehicle.maintenance.alerts.push('Low fuel warning');
    }

    // Low battery warning
    if (update.batteryLevel !== undefined && update.batteryLevel <= 15 && update.batteryLevel > 0) {
      vehicle.maintenance.alerts.push('Low battery warning');
    }

    // High coolant temperature
    if (update.coolantTemp !== undefined && update.coolantTemp > 105) {
      vehicle.telemetry.diagnostics.engineStatus = 'warning';
      vehicle.maintenance.alerts.push('High coolant temperature');
    }

    // Low oil level
    if (update.oilLevel !== undefined && update.oilLevel <= 20) {
      vehicle.maintenance.alerts.push('Low oil level');
    }

    // Critical tire pressure (if any tire is below 28 PSI)
    if (update.tirePressure !== undefined) {
      const lowPressureTires = update.tirePressure.filter(p => p < 28);
      if (lowPressureTires.length > 0) {
        vehicle.maintenance.alerts.push(`Low tire pressure: ${lowPressureTires.join(', ')} PSI`);
      }
    }

    // Error codes present
    if (update.errorCodes && update.errorCodes.length > 0) {
      vehicle.telemetry.diagnostics.engineStatus = 'warning';
      vehicle.telemetry.diagnostics.errorCodes = update.errorCodes;
    }

    // Limit alerts to last 10
    if (vehicle.maintenance.alerts.length > 10) {
      vehicle.maintenance.alerts = vehicle.maintenance.alerts.slice(-10);
    }
  }

  /**
   * Publish telemetry event to message broker
   */
  private async publishTelemetryEvent(
    vehicleId: string,
    update: TelemetryUpdate
  ): Promise<void> {
    const vehicle = await Vehicle.findOne({ vehicleId, isActive: true });
    if (!vehicle) return;

    const event = {
      vehicleId,
      timestamp: new Date(),
      telemetry: {
        fuelLevel: update.fuelLevel ?? vehicle.telemetry.fuelLevel,
        batteryLevel: update.batteryLevel ?? vehicle.telemetry.batteryLevel,
        odometer: update.odometer ?? vehicle.telemetry.odometer,
        engineHours: update.engineHours ?? vehicle.telemetry.engineHours,
        diagnostics: vehicle.telemetry.diagnostics
      },
      location: {
        lat: vehicle.status.location.lat,
        lng: vehicle.status.location.lng
      }
    };

    try {
      await messageBroker.publishTelemetryEvent(event);
    } catch (error) {
      logger.error('Failed to publish telemetry event', {
        vehicleId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Clear maintenance alerts for a vehicle
   */
  async clearAlerts(vehicleId: string): Promise<VehicleDocument | null> {
    const vehicle = await Vehicle.findOne({ vehicleId, isActive: true });
    if (!vehicle) return null;

    vehicle.maintenance.alerts = [];
    await vehicle.save();

    return vehicle;
  }

  /**
   * Record a service for a vehicle
   */
  async recordService(
    vehicleId: string,
    serviceDate: Date,
    serviceKm: number,
    notes?: string
  ): Promise<VehicleDocument | null> {
    const vehicle = await Vehicle.findOne({ vehicleId, isActive: true });
    if (!vehicle) return null;

    vehicle.maintenance.lastServiceDate = serviceDate;
    vehicle.maintenance.lastServiceKm = serviceKm;

    // Reset diagnostic status after service
    vehicle.telemetry.diagnostics.engineStatus = 'ok';
    vehicle.telemetry.diagnostics.brakeStatus = 'ok';
    vehicle.telemetry.diagnostics.errorCodes = [];

    // Clear old alerts
    vehicle.maintenance.alerts = [];

    // Schedule next service (assume 90 days or 5000km)
    const nextServiceDate = new Date(serviceDate);
    nextServiceDate.setDate(nextServiceDate.getDate() + 90);
    vehicle.maintenance.nextServiceDate = nextServiceDate;
    vehicle.maintenance.nextServiceKm = serviceKm + 5000;

    await vehicle.save();

    logger.info(`Service recorded for vehicle: ${vehicleId}`, {
      vehicleId,
      serviceDate,
      serviceKm
    });

    return vehicle;
  }
}

export const telemetryService = new TelemetryService();
