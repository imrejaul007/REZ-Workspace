import { Driver, DriverDocument } from '../models/Driver';
import { Delivery } from '../models/Delivery';
import {
  IDriver,
  DriverStatus,
  UpdateDriverLocationDTO,
  GeoLocation
} from '../types';
import { redisClient } from '../config/redis';
import { calculateDistance, isPointInRadius } from '../utils/geo';

export interface CreateDriverDTO {
  userId: string;
  name: string;
  email: string;
  phone: string;
  vehicle: IDriver['vehicle'];
  availability?: {
    isAvailable?: boolean;
    maxRadius?: number;
    workingHours?: {
      start: string;
      end: string;
    };
  };
}

export class DriverService {
  private static instance: DriverService;

  private constructor() {}

  public static getInstance(): DriverService {
    if (!DriverService.instance) {
      DriverService.instance = new DriverService();
    }
    return DriverService.instance;
  }

  public async createDriver(data: CreateDriverDTO): Promise<DriverDocument> {
    const existingDriver = await Driver.findOne({ userId: data.userId }).exec();
    if (existingDriver) {
      throw new Error('Driver already exists for this user');
    }

    const driver = new Driver({
      userId: data.userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      status: DriverStatus.AVAILABLE,
      vehicle: data.vehicle,
      rating: 5.0,
      totalDeliveries: 0,
      completedDeliveries: 0,
      failedDeliveries: 0,
      availability: {
        isAvailable: data.availability?.isAvailable ?? true,
        maxRadius: data.availability?.maxRadius ?? 10,
        workingHours: data.availability?.workingHours ?? { start: '08:00', end: '20:00' }
      }
    });

    await driver.save();
    await this.cacheDriver(driver);

    return driver;
  }

  public async getDriverById(driverId: string): Promise<DriverDocument | null> {
    const cached = await this.getCachedDriver(driverId);
    if (cached) {
      return cached;
    }

    const driver = await Driver.findById(driverId).exec();
    if (driver) {
      await this.cacheDriver(driver);
    }
    return driver;
  }

  public async getDriverByUserId(userId: string): Promise<DriverDocument | null> {
    return Driver.findOne({ userId }).exec();
  }

  public async getAllDrivers(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: DriverStatus;
      isAvailable?: boolean;
      vehicleType?: IDriver['vehicle']['type'];
    }
  ): Promise<{ drivers: DriverDocument[]; total: number }> {
    const query: unknown = {};

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.isAvailable !== undefined) {
      query['availability.isAvailable'] = filters.isAvailable;
    }
    if (filters?.vehicleType) {
      query['vehicle.type'] = filters.vehicleType;
    }

    const skip = (page - 1) * limit;

    const [drivers, total] = await Promise.all([
      Driver.find(query)
        .sort({ rating: -1, totalDeliveries: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Driver.countDocuments(query).exec()
    ]);

    return { drivers, total };
  }

  public async updateDriverLocation(data: UpdateDriverLocationDTO): Promise<DriverDocument> {
    const driver = await Driver.findById(data.driverId).exec();

    if (!driver) {
      throw new Error('Driver not found');
    }

    const location: GeoLocation = {
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      address: data.location.address,
      timestamp: new Date()
    };

    await driver.updateOne({
      currentLocation: location
    });

    await this.invalidateDriverCache(driver._id?.toString() || '');
    await this.publishDriverLocation(driver._id?.toString() || '', location);

    const updatedDriver = await Driver.findById(data.driverId).exec();
    if (!updatedDriver) {
      throw new Error('Failed to retrieve updated driver');
    }

    return updatedDriver;
  }

  public async updateDriverStatus(
    driverId: string,
    status: DriverStatus
  ): Promise<DriverDocument> {
    const driver = await Driver.findById(driverId).exec();

    if (!driver) {
      throw new Error('Driver not found');
    }

    if (driver.currentDeliveryId && status !== DriverStatus.BUSY) {
      throw new Error('Cannot change status while on active delivery');
    }

    await driver.updateOne({
      status,
      'availability.isAvailable': status === DriverStatus.AVAILABLE
    });

    await this.invalidateDriverCache(driverId);

    const updatedDriver = await Driver.findById(driverId).exec();
    if (!updatedDriver) {
      throw new Error('Failed to retrieve updated driver');
    }

    return updatedDriver;
  }

  public async setDriverAvailability(
    driverId: string,
    isAvailable: boolean
  ): Promise<DriverDocument> {
    const driver = await Driver.findById(driverId).exec();

    if (!driver) {
      throw new Error('Driver not found');
    }

    if (driver.currentDeliveryId && isAvailable) {
      throw new Error('Cannot set available while on active delivery');
    }

    await driver.updateOne({
      'availability.isAvailable': isAvailable,
      status: isAvailable ? DriverStatus.AVAILABLE : DriverStatus.OFFLINE
    });

    await this.invalidateDriverCache(driverId);

    const updatedDriver = await Driver.findById(driverId).exec();
    if (!updatedDriver) {
      throw new Error('Failed to retrieve updated driver');
    }

    return updatedDriver;
  }

  public async findNearestAvailableDriver(
    pickupLocation: GeoLocation,
    vehicleType?: IDriver['vehicle']['type']
  ): Promise<DriverDocument | null> {
    const query: unknown = {
      status: DriverStatus.AVAILABLE,
      'availability.isAvailable': true,
      'currentLocation': { $exists: true, $ne: null }
    };

    if (vehicleType) {
      query['vehicle.type'] = vehicleType;
    }

    const drivers = await Driver.find(query).exec();

    if (drivers.length === 0) {
      return null;
    }

    let nearestDriver: DriverDocument | null = null;
    let shortestDistance = Infinity;

    for (const driver of drivers) {
      if (!driver.currentLocation) continue;

      const distance = calculateDistance(pickupLocation, driver.currentLocation);

      if (distance < shortestDistance) {
        const isInRadius = isPointInRadius(
          driver.currentLocation,
          pickupLocation,
          driver.availability.maxRadius
        );

        if (isInRadius) {
          shortestDistance = distance;
          nearestDriver = driver;
        }
      }
    }

    return nearestDriver;
  }

  public async getAvailableDrivers(location?: GeoLocation): Promise<DriverDocument[]> {
    const query: unknown = {
      status: DriverStatus.AVAILABLE,
      'availability.isAvailable': true
    };

    if (location) {
      query['currentLocation'] = { $exists: true, $ne: null };
    }

    let drivers = await Driver.find(query).sort({ rating: -1 }).exec();

    if (location) {
      drivers = drivers.filter((driver) => {
        if (!driver.currentLocation) return false;
        return isPointInRadius(
          driver.currentLocation,
          location,
          driver.availability.maxRadius
        );
      });
    }

    return drivers;
  }

  public async assignDeliveryToDriver(
    driverId: string,
    deliveryId: string
  ): Promise<DriverDocument> {
    const driver = await Driver.findById(driverId).exec();

    if (!driver) {
      throw new Error('Driver not found');
    }

    if (!driver.availability.isAvailable) {
      throw new Error('Driver is not available');
    }

    if (driver.currentDeliveryId) {
      throw new Error('Driver already has an active delivery');
    }

    await driver.updateOne({
      currentDeliveryId: deliveryId,
      status: DriverStatus.BUSY,
      'availability.isAvailable': false
    });

    await this.invalidateDriverCache(driverId);

    const updatedDriver = await Driver.findById(driverId).exec();
    if (!updatedDriver) {
      throw new Error('Failed to retrieve updated driver');
    }

    return updatedDriver;
  }

  public async completeCurrentDelivery(driverId: string): Promise<DriverDocument> {
    const driver = await Driver.findById(driverId).exec();

    if (!driver) {
      throw new Error('Driver not found');
    }

    await driver.updateOne({
      $unset: { currentDeliveryId: 1 },
      status: DriverStatus.AVAILABLE,
      'availability.isAvailable': true,
      $inc: {
        completedDeliveries: 1,
        totalDeliveries: 1
      }
    });

    await this.invalidateDriverCache(driverId);

    const updatedDriver = await Driver.findById(driverId).exec();
    if (!updatedDriver) {
      throw new Error('Failed to retrieve updated driver');
    }

    return updatedDriver;
  }

  public async cancelCurrentDelivery(driverId: string): Promise<DriverDocument> {
    const driver = await Driver.findById(driverId).exec();

    if (!driver) {
      throw new Error('Driver not found');
    }

    await driver.updateOne({
      $unset: { currentDeliveryId: 1 },
      status: DriverStatus.AVAILABLE,
      'availability.isAvailable': true,
      $inc: {
        failedDeliveries: 1,
        totalDeliveries: 1
      }
    });

    await this.invalidateDriverCache(driverId);

    const updatedDriver = await Driver.findById(driverId).exec();
    if (!updatedDriver) {
      throw new Error('Failed to retrieve updated driver');
    }

    return updatedDriver;
  }

  public async getDriverStats(driverId: string): Promise<{
    totalDeliveries: number;
    completedDeliveries: number;
    failedDeliveries: number;
    successRate: number;
    averageRating: number;
  }> {
    const driver = await Driver.findById(driverId).exec();

    if (!driver) {
      throw new Error('Driver not found');
    }

    const successRate =
      driver.totalDeliveries > 0
        ? (driver.completedDeliveries / driver.totalDeliveries) * 100
        : 0;

    return {
      totalDeliveries: driver.totalDeliveries,
      completedDeliveries: driver.completedDeliveries,
      failedDeliveries: driver.failedDeliveries,
      successRate: Math.round(successRate * 100) / 100,
      averageRating: driver.rating
    };
  }

  public async updateDriverRating(
    driverId: string,
    newRating: number
  ): Promise<DriverDocument> {
    const driver = await Driver.findById(driverId).exec();

    if (!driver) {
      throw new Error('Driver not found');
    }

    const currentTotal = driver.rating * driver.completedDeliveries;
    const updatedTotal = currentTotal + newRating;
    const updatedCount = driver.completedDeliveries + 1;
    const updatedRating = updatedTotal / updatedCount;

    await driver.updateOne({
      rating: Math.round(updatedRating * 10) / 10
    });

    await this.invalidateDriverCache(driverId);

    const updatedDriver = await Driver.findById(driverId).exec();
    if (!updatedDriver) {
      throw new Error('Failed to retrieve updated driver');
    }

    return updatedDriver;
  }

  public async getActiveDeliveryDriver(deliveryId: string): Promise<DriverDocument | null> {
    return Driver.findOne({ currentDeliveryId: deliveryId }).exec();
  }

  private async cacheDriver(driver: DriverDocument): Promise<void> {
    const redis = redisClient.getClient();
    const key = `driver:${driver._id}`;
    await redis.set(key, JSON.stringify(driver.toObject()), 'EX', 3600);
  }

  private async getCachedDriver(driverId: string): Promise<DriverDocument | null> {
    try {
      const redis = redisClient.getClient();
      const cached = await redis.get(`driver:${driverId}`);
      if (cached) {
        const data = JSON.parse(cached);
        return new Driver(data);
      }
    } catch (error) {
      logger.error('Cache read error:', error);
    }
    return null;
  }

  private async invalidateDriverCache(driverId: string): Promise<void> {
    const redis = redisClient.getClient();
    await redis.del(`driver:${driverId}`);
  }

  private async publishDriverLocation(driverId: string, location: GeoLocation): Promise<void> {
    const redis = redisClient.getClient();
    const channel = `driver:${driverId}:location`;
    await redis.publish(channel, JSON.stringify(location));
  }
}

export const driverService = DriverService.getInstance();
export default driverService;
