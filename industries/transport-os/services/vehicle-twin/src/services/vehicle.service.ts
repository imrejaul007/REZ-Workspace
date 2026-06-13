import { v4 as uuidv4 } from 'uuid';
import { Vehicle, VehicleDocument } from '../models/vehicle';
import { messageBroker } from '../utils/message-broker';
import { logger } from '../utils/logger';
import {
  VehicleStatus,
  CreateVehicleRequest,
  UpdateVehicleStatusRequest,
  UpdateVehicleTelemetryRequest,
  VehicleQueryParams,
  VehicleEvent
} from '../types';

export interface CreateVehicleResult {
  vehicle: VehicleDocument;
  created: boolean;
}

export interface VehicleQueryResult {
  vehicles: VehicleDocument[];
  total: number;
}

export interface NearbyVehicle {
  vehicle: VehicleDocument;
  distanceKm: number;
}

class VehicleService {
  /**
   * Create a new vehicle twin
   */
  async createVehicle(data: CreateVehicleRequest): Promise<VehicleDocument> {
    const vehicleId = `VTWIN-${uuidv4().substring(0, 8).toUpperCase()}`;

    const vehicle = new Vehicle({
      vehicleId,
      profile: data.profile,
      ownership: data.ownership,
      status: {
        current: data.status || VehicleStatus.OFFLINE,
        location: data.location || { lat: 0, lng: 0, address: null, updatedAt: new Date() },
        heading: 0,
        speed: 0,
        since: new Date()
      },
      maintenance: data.maintenance || {},
      isActive: true
    });

    await vehicle.save();

    // Publish vehicle created event
    await this.publishEvent('created', vehicle);

    logger.info(`Vehicle created: ${vehicleId}`, {
      vehicleId,
      make: data.profile.make,
      model: data.profile.model,
      category: data.profile.category
    });

    return vehicle;
  }

  /**
   * Get vehicle by ID
   */
  async getVehicle(vehicleId: string): Promise<VehicleDocument | null> {
    return Vehicle.findOne({ vehicleId, isActive: true });
  }

  /**
   * Get vehicle by VIN
   */
  async getVehicleByVin(vin: string): Promise<VehicleDocument | null> {
    return Vehicle.findOne({ 'profile.vin': vin, isActive: true });
  }

  /**
   * Get vehicle by license plate
   */
  async getVehicleByLicensePlate(licensePlate: string): Promise<VehicleDocument | null> {
    return Vehicle.findOne({ 'profile.licensePlate': licensePlate, isActive: true });
  }

  /**
   * Update vehicle status
   */
  async updateVehicleStatus(
    vehicleId: string,
    data: UpdateVehicleStatusRequest
  ): Promise<VehicleDocument | null> {
    const vehicle = await Vehicle.findOne({ vehicleId, isActive: true });
    if (!vehicle) return null;

    const previousStatus = vehicle.status.current;
    const previousLocation = { ...vehicle.status.location };

    vehicle.status.current = data.status;
    if (data.location) {
      vehicle.status.location = {
        ...vehicle.status.location,
        ...data.location,
        updatedAt: new Date()
      };
    }
    if (data.location?.lat !== undefined && data.location?.lng !== undefined) {
      vehicle.status.location.lat = data.location.lat;
      vehicle.status.location.lng = data.location.lng;
      vehicle.status.location.updatedAt = new Date();
    }
    if (data.heading !== undefined) {
      vehicle.status.heading = data.heading;
    }
    if (data.speed !== undefined) {
      vehicle.status.speed = data.speed;
    }

    // Update status since if status changed
    if (previousStatus !== data.status) {
      vehicle.status.since = new Date();

      // Check for status-based alerts
      if (data.status === VehicleStatus.MAINTENANCE) {
        vehicle.maintenance.alerts.push('Vehicle moved to maintenance');
      }
      if (data.status === VehicleStatus.AVAILABLE && previousStatus === VehicleStatus.CLEANING) {
        vehicle.cleanliness.needsCleaning = false;
      }
    }

    await vehicle.save();

    // Publish status changed event
    if (previousStatus !== data.status) {
      await this.publishEvent('status_changed', vehicle, {
        previousStatus,
        newStatus: data.status
      });
    } else {
      await this.publishEvent('updated', vehicle);
    }

    logger.info(`Vehicle status updated: ${vehicleId}`, {
      vehicleId,
      previousStatus,
      newStatus: data.status
    });

    return vehicle;
  }

  /**
   * Update vehicle telemetry
   */
  async updateVehicleTelemetry(
    vehicleId: string,
    data: UpdateVehicleTelemetryRequest
  ): Promise<VehicleDocument | null> {
    const vehicle = await Vehicle.findOne({ vehicleId, isActive: true });
    if (!vehicle) return null;

    if (data.fuelLevel !== undefined) {
      vehicle.telemetry.fuelLevel = data.fuelLevel;
    }
    if (data.batteryLevel !== undefined) {
      vehicle.telemetry.batteryLevel = data.batteryLevel;
    }
    if (data.odometer !== undefined) {
      vehicle.telemetry.odometer = data.odometer;
    }
    if (data.engineHours !== undefined) {
      vehicle.telemetry.engineHours = data.engineHours;
    }
    if (data.diagnostics) {
      vehicle.telemetry.diagnostics = {
        ...vehicle.telemetry.diagnostics,
        ...data.diagnostics
      };
    }

    // Check for diagnostic alerts
    if (data.diagnostics?.engineStatus === 'warning' || data.diagnostics?.engineStatus === 'critical') {
      vehicle.maintenance.alerts.push(`Engine status: ${data.diagnostics.engineStatus}`);
    }
    if (data.diagnostics?.brakeStatus === 'warning' || data.diagnostics?.brakeStatus === 'critical') {
      vehicle.maintenance.alerts.push(`Brake status: ${data.diagnostics.brakeStatus}`);
    }
    if (data.diagnostics?.errorCodes && data.diagnostics.errorCodes.length > 0) {
      vehicle.maintenance.alerts.push(`Error codes detected: ${data.diagnostics.errorCodes.join(', ')}`);
    }

    await vehicle.save();

    // Publish telemetry updated event
    await this.publishEvent('telemetry_updated', vehicle);

    return vehicle;
  }

  /**
   * Update vehicle location
   */
  async updateVehicleLocation(
    vehicleId: string,
    lat: number,
    lng: number,
    heading?: number,
    speed?: number,
    address?: string
  ): Promise<VehicleDocument | null> {
    const vehicle = await Vehicle.findOne({ vehicleId, isActive: true });
    if (!vehicle) return null;

    vehicle.status.location = {
      lat,
      lng,
      address: address || vehicle.status.location.address,
      updatedAt: new Date()
    };

    if (heading !== undefined) {
      vehicle.status.heading = heading;
    }
    if (speed !== undefined) {
      vehicle.status.speed = speed;
    }

    await vehicle.save();

    return vehicle;
  }

  /**
   * Update vehicle utilization
   */
  async updateVehicleUtilization(
    vehicleId: string,
    data: {
      todayTrips?: number;
      todayRevenue?: number;
      weekTrips?: number;
      weekRevenue?: number;
      utilizationRate?: number;
      avgTripDistanceKm?: number;
      avgTripDurationMinutes?: number;
    }
  ): Promise<VehicleDocument | null> {
    const vehicle = await Vehicle.findOne({ vehicleId, isActive: true });
    if (!vehicle) return null;

    if (data.todayTrips !== undefined) vehicle.utilization.todayTrips = data.todayTrips;
    if (data.todayRevenue !== undefined) vehicle.utilization.todayRevenue = data.todayRevenue;
    if (data.weekTrips !== undefined) vehicle.utilization.weekTrips = data.weekTrips;
    if (data.weekRevenue !== undefined) vehicle.utilization.weekRevenue = data.weekRevenue;
    if (data.utilizationRate !== undefined) vehicle.utilization.utilizationRate = data.utilizationRate;
    if (data.avgTripDistanceKm !== undefined) vehicle.utilization.avgTripDistanceKm = data.avgTripDistanceKm;
    if (data.avgTripDurationMinutes !== undefined) vehicle.utilization.avgTripDurationMinutes = data.avgTripDurationMinutes;

    await vehicle.save();

    return vehicle;
  }

  /**
   * Update vehicle cleanliness
   */
  async updateVehicleCleanliness(
    vehicleId: string,
    data: {
      lastCleaned?: Date;
      cleanlinessScore?: number;
      needsCleaning?: boolean;
    }
  ): Promise<VehicleDocument | null> {
    const vehicle = await Vehicle.findOne({ vehicleId, isActive: true });
    if (!vehicle) return null;

    if (data.lastCleaned !== undefined) vehicle.cleanliness.lastCleaned = data.lastCleaned;
    if (data.cleanlinessScore !== undefined) vehicle.cleanliness.cleanlinessScore = data.cleanlinessScore;
    if (data.needsCleaning !== undefined) vehicle.cleanliness.needsCleaning = data.needsCleaning;

    await vehicle.save();

    return vehicle;
  }

  /**
   * Update vehicle maintenance
   */
  async updateVehicleMaintenance(
    vehicleId: string,
    data: {
      nextServiceDate?: Date;
      nextServiceKm?: number;
      lastServiceDate?: Date;
      lastServiceKm?: number;
      insuranceExpiry?: Date;
      registrationExpiry?: Date;
      inspectionExpiry?: Date;
    }
  ): Promise<VehicleDocument | null> {
    const vehicle = await Vehicle.findOne({ vehicleId, isActive: true });
    if (!vehicle) return null;

    if (data.nextServiceDate !== undefined) vehicle.maintenance.nextServiceDate = data.nextServiceDate;
    if (data.nextServiceKm !== undefined) vehicle.maintenance.nextServiceKm = data.nextServiceKm;
    if (data.lastServiceDate !== undefined) vehicle.maintenance.lastServiceDate = data.lastServiceDate;
    if (data.lastServiceKm !== undefined) vehicle.maintenance.lastServiceKm = data.lastServiceKm;
    if (data.insuranceExpiry !== undefined) vehicle.maintenance.insuranceExpiry = data.insuranceExpiry;
    if (data.registrationExpiry !== undefined) vehicle.maintenance.registrationExpiry = data.registrationExpiry;
    if (data.inspectionExpiry !== undefined) vehicle.maintenance.inspectionExpiry = data.inspectionExpiry;

    await vehicle.save();

    return vehicle;
  }

  /**
   * Query vehicles with filters
   */
  async queryVehicles(params: VehicleQueryParams): Promise<VehicleQueryResult> {
    const query: Record<string, unknown> = { isActive: true };

    if (params.status) {
      query['status.current'] = params.status;
    }
    if (params.category) {
      query['profile.category'] = params.category;
    }
    if (params.fleetId) {
      query['ownership.fleetId'] = params.fleetId;
    }
    if (params.ownerId) {
      query['ownership.ownerId'] = params.ownerId;
    }
    if (params.needsMaintenance) {
      query['maintenance.nextServiceDate'] = { $lte: new Date() };
    }
    if (params.needsCleaning) {
      query['cleanliness.needsCleaning'] = true;
    }
    if (params.minUtilization !== undefined) {
      query['utilization.utilizationRate'] = { $gte: params.minUtilization };
    }
    if (params.maxUtilization !== undefined) {
      query['utilization.utilizationRate'] = {
        ...(query['utilization.utilizationRate'] as object || {}),
        $lte: params.maxUtilization
      };
    }

    const limit = params.limit || 50;
    const skip = params.skip || 0;

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Vehicle.countDocuments(query)
    ]);

    return { vehicles, total };
  }

  /**
   * Get vehicles by fleet
   */
  async getVehiclesByFleet(fleetId: string): Promise<VehicleDocument[]> {
    return Vehicle.find({ 'ownership.fleetId': fleetId, isActive: true })
      .sort({ createdAt: -1 });
  }

  /**
   * Get vehicles by owner
   */
  async getVehiclesByOwner(ownerId: string): Promise<VehicleDocument[]> {
    return Vehicle.find({ 'ownership.ownerId': ownerId, isActive: true })
      .sort({ createdAt: -1 });
  }

  /**
   * Get available vehicles near a location
   */
  async getAvailableVehiclesNear(
    lat: number,
    lng: number,
    radiusKm: number = 5,
    limit: number = 10
  ): Promise<NearbyVehicle[]> {
    // Simple bounding box filter (approximate)
    const latDelta = radiusKm / 111; // 1 degree lat ~= 111km
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    const vehicles = await Vehicle.find({
      'status.current': VehicleStatus.AVAILABLE,
      'status.location.lat': { $gte: lat - latDelta, $lte: lat + latDelta },
      'status.location.lng': { $gte: lng - lngDelta, $lte: lng + lngDelta },
      isActive: true
    }).limit(limit);

    // Calculate actual distances and sort
    const nearbyVehicles: NearbyVehicle[] = vehicles.map(v => ({
      vehicle: v,
      distanceKm: this.calculateDistance(lat, lng, v.status.location.lat, v.status.location.lng)
    }));

    return nearbyVehicles
      .filter(v => v.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Delete vehicle (soft delete)
   */
  async deleteVehicle(vehicleId: string): Promise<boolean> {
    const vehicle = await Vehicle.findOne({ vehicleId, isActive: true });
    if (!vehicle) return false;

    vehicle.isActive = false;
    await vehicle.save();

    await this.publishEvent('deleted', vehicle);

    logger.info(`Vehicle deleted: ${vehicleId}`, { vehicleId });

    return true;
  }

  /**
   * Get vehicle statistics
   */
  async getVehicleStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    avgUtilization: number;
    needsMaintenance: number;
    needsCleaning: number;
  }> {
    const [vehicles, stats] = await Promise.all([
      Vehicle.find({ isActive: true }),
      Vehicle.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgUtilization: { $avg: '$utilization.utilizationRate' },
            needsMaintenance: {
              $sum: { $cond: [{ $lte: ['$maintenance.nextServiceDate', new Date()] }, 1, 0] }
            },
            needsCleaning: {
              $sum: { $cond: ['$cleanliness.needsCleaning', 1, 0] }
            }
          }
        }
      ])
    ]);

    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    vehicles.forEach(v => {
      byStatus[v.status.current] = (byStatus[v.status.current] || 0) + 1;
      byCategory[v.profile.category] = (byCategory[v.profile.category] || 0) + 1;
    });

    return {
      total: vehicles.length,
      byStatus,
      byCategory,
      avgUtilization: stats[0]?.avgUtilization || 0,
      needsMaintenance: stats[0]?.needsMaintenance || 0,
      needsCleaning: stats[0]?.needsCleaning || 0
    };
  }

  /**
   * Get vehicles needing maintenance
   */
  async getVehiclesNeedingMaintenance(): Promise<VehicleDocument[]> {
    return Vehicle.find({
      isActive: true,
      $or: [
        { 'maintenance.nextServiceDate': { $lte: new Date() } },
        { 'maintenance.insuranceExpiry': { $lte: new Date() } },
        { 'maintenance.registrationExpiry': { $lte: new Date() } },
        { 'maintenance.inspectionExpiry': { $lte: new Date() } }
      ]
    }).sort({ 'maintenance.nextServiceDate': 1 });
  }

  /**
   * Publish vehicle event to message broker
   */
  private async publishEvent(
    eventType: VehicleEvent['eventType'],
    vehicle: VehicleDocument,
    additionalData: Record<string, unknown> = {}
  ): Promise<void> {
    const event: VehicleEvent = {
      eventType,
      vehicleId: vehicle.vehicleId,
      timestamp: new Date(),
      data: {
        status: vehicle.status.current,
        category: vehicle.profile.category,
        make: vehicle.profile.make,
        model: vehicle.profile.model,
        ...additionalData
      },
      location: {
        lat: vehicle.status.location.lat,
        lng: vehicle.status.location.lng
      }
    };

    try {
      await messageBroker.publishVehicleEvent(event);
    } catch (error) {
      logger.error('Failed to publish vehicle event', {
        vehicleId: vehicle.vehicleId,
        eventType,
        error: (error as Error).message
      });
    }
  }
}

export const vehicleService = new VehicleService();
